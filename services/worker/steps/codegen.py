"""Model calls for planning and writing code: the architect picks files, the editor writes them."""

from __future__ import annotations

import json
import re
from pathlib import Path

from models import FeatureRequestInput, Plan, PlannedFile
from steps import llm, repo

MAX_FILES = 5

PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "summary": {"type": "string"},
        "files": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "reason": {"type": "string"},
                    "is_new": {"type": "boolean"},
                },
                "required": ["path", "reason", "is_new"],
                "additionalProperties": False,
            },
        },
        "acceptance_criteria": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["summary", "files", "acceptance_criteria"],
    "additionalProperties": False,
}

ARCHITECT_SYSTEM = """You are the architect for a small Next.js, TypeScript and Tailwind v4 code base.
You receive a feature request (a GitHub issue), the repository conventions (AGENTS.md), the file tree and the
first lines of the most relevant files. Decide the minimal set of files to change or create (2 to 5) so that
the feature works end to end, and write acceptance criteria.

Rules:
- Choose the MINIMAL set of files. Every file needs a concrete reason.
- Follow AGENTS.md to the letter (tokens, header slot, small files, no literal colours in components).
- When the feature needs a new component or module, plan a NEW file for it (is_new: true) with a path that
  matches the existing layout (for example a new component under components/). Do not put new components into
  unrelated files.
- Only list files that exist in the tree, or new files you are creating. Never list lockfiles or node_modules.
- The dependency list is fixed: plan nothing that needs a package which is not already in package.json
  (no icon libraries, no theme libraries; inline SVG or text is fine).
- Acceptance criteria are short, testable sentences a reviewer can check in the browser or with the gates
  (`npm run typecheck`, `npm run build`).
Return JSON only."""

EDITOR_SYSTEM = """You are a senior TypeScript engineer editing one file of a Next.js 16, React 19, Tailwind v4 code base.
Return only the complete file contents, no code fences, no commentary. The output replaces the file verbatim.
Keep unrelated code exactly as it is. Follow the repository conventions given to you. The project must pass
`tsc --noEmit` with strict mode and `next build`.
Hard rules:
- Import only from packages listed in the dependency list you are given, from Node built-ins, or from files in
  this repository. Never add a dependency. For icons use inline SVG or plain text.
- Components that use hooks, window, document or localStorage start with the "use client" directive. Nothing
  else gets that directive. The root layout (app/layout.tsx) stays a server component: keep its `metadata`
  export and everything it already renders; to apply a saved theme before paint add a tiny inline
  `<script dangerouslySetInnerHTML={{ __html: "..." }} />` at the top of `<body>` or in `<head>`, never a hook.
- Never remove existing behaviour: keep every existing export, import, comment and rendered element unless
  the task explicitly says to remove it. Add to the file; do not rewrite it.
- Interactive controls get an `aria-label` and a `data-testid` in kebab-case (for example "theme-toggle").
- No literal colours in components: use the token utilities from the conventions."""

FENCE_RE = re.compile(r"^\s*```[a-zA-Z0-9_.+-]*\s*\n(.*?)\n\s*```\s*$", re.DOTALL)


def strip_fences(text: str) -> str:
    """A model sometimes wraps output in fences even when told not to."""
    match = FENCE_RE.match(text)
    if match:
        return match.group(1) + "\n"
    stripped = text.lstrip("\n")
    if stripped.startswith("```"):
        stripped = stripped.split("\n", 1)[1] if "\n" in stripped else ""
    if stripped.rstrip().endswith("```"):
        stripped = stripped.rstrip()[:-3]
    if not stripped.endswith("\n"):
        stripped += "\n"
    return stripped


def dependency_block(root: Path) -> str:
    """The dependency names from package.json, so the models never import what is not installed."""
    package_json = repo.read_file(root, "package.json")
    if not package_json:
        return "Dependencies: unknown (no package.json)."
    try:
        data = json.loads(package_json)
    except json.JSONDecodeError:
        return "Dependencies: unreadable package.json."
    names = sorted({*data.get("dependencies", {}), *data.get("devDependencies", {})})
    return "Dependencies available (package.json, nothing else may be imported): " + ", ".join(names)


def _issue_block(req: FeatureRequestInput, issue_title: str, issue_body: str) -> str:
    return f"# Issue: {issue_title}\n\n{issue_body}\n\nArea: {req.area or 'unspecified'}\n"


def build_architect_prompt(
    req: FeatureRequestInput,
    issue_title: str,
    issue_body: str,
    agents_md: str,
    tree: list[str],
    heads: list[tuple[str, str]],
    dependencies: str = "",
) -> str:
    parts = [_issue_block(req, issue_title, issue_body)]
    parts.append("# Repository conventions (AGENTS.md)\n\n" + (agents_md.strip() or "(no AGENTS.md in this repository)"))
    if dependencies:
        parts.append("# " + dependencies)
    parts.append("# File tree\n\n" + "\n".join(tree))
    head_blocks = [f"## {path}\n```\n{head}\n```" for path, head in heads if head.strip()]
    parts.append("# Head of the most relevant files\n\n" + "\n\n".join(head_blocks))
    parts.append(
        "Choose the minimal set of files to change (2 to 5). Plan new files when the feature needs a new "
        "component or module (for example a toggle component rendered from the header slot). "
        "Give a reason per file and acceptance criteria."
    )
    return "\n\n".join(parts)


def plan_changes(root: Path, req: FeatureRequestInput, issue_title: str, issue_body: str) -> tuple[Plan, str]:
    """Ask the architect for a plan; returns the plan and a one-line summary of the input for the trace."""
    tree = repo.list_source_files(root)
    terms = repo.keywords(req.title, req.description, req.area)
    ranked = repo.rank_files(root, tree, terms, limit=10)
    heads = [(path, repo.read_head(root, path, 40)) for path, _ in ranked]
    agents_md = repo.read_file(root, "AGENTS.md") or ""
    prompt = build_architect_prompt(req, issue_title, issue_body, agents_md, tree, heads, dependency_block(root))
    raw = llm.complete_json(llm.ARCHITECT_MODEL, ARCHITECT_SYSTEM, prompt, "change_plan", PLAN_SCHEMA)
    existing = set(tree)
    files: list[PlannedFile] = []
    for item in raw.get("files", []):
        path = str(item.get("path", "")).strip().lstrip("./")
        if not path or path in {f.path for f in files}:
            continue
        is_new = bool(item.get("is_new")) or path not in existing
        if is_new and (root / path).exists():
            is_new = False
        files.append(PlannedFile(path=path, reason=str(item.get("reason", "")).strip(), is_new=is_new))
    files = files[:MAX_FILES]
    if not files:
        raise RuntimeError("the architect returned no files")
    plan = Plan(
        files=files,
        acceptance_criteria=[str(c).strip() for c in raw.get("acceptance_criteria", []) if str(c).strip()],
        summary=str(raw.get("summary", "")).strip(),
        base_sha=repo.head_sha(root),
    )
    input_summary = f"{len(tree)} files in tree, {len(heads)} heads shown, AGENTS.md {'present' if agents_md else 'missing'}"
    return plan, input_summary


def _plan_block(plan: Plan) -> str:
    lines = [f"- {f.path} ({'new' if f.is_new else 'edit'}): {f.reason}" for f in plan.files]
    criteria = "\n".join(f"- {c}" for c in plan.acceptance_criteria)
    return f"Plan summary: {plan.summary}\n\nFiles in this change:\n" + "\n".join(lines) + f"\n\nAcceptance criteria:\n{criteria}"


def _context_block(context: dict[str, str]) -> str:
    if not context:
        return ""
    blocks = [f"## {path} (current contents, for reference only)\n{content}" for path, content in context.items()]
    return "# Other files in this change\n\n" + "\n\n".join(blocks)


def draft_file(
    req: FeatureRequestInput,
    issue_title: str,
    issue_body: str,
    plan: Plan,
    target: PlannedFile,
    existing: str | None,
    agents_md: str,
    context: dict[str, str],
    dependencies: str = "",
) -> str:
    """Ask the editor for the whole new contents of one file."""
    parts = [_issue_block(req, issue_title, issue_body), "# Repository conventions (AGENTS.md)\n\n" + agents_md.strip()]
    if dependencies:
        parts.append("# " + dependencies)
    parts.append("# Change plan\n\n" + _plan_block(plan))
    context_block = _context_block(context)
    if context_block:
        parts.append(context_block)
    if existing is None:
        parts.append(f"# Task\n\nCreate the new file `{target.path}`. Purpose: {target.reason}")
    else:
        parts.append(f"# Task\n\nRewrite `{target.path}`. Purpose: {target.reason}\n\nCurrent contents of `{target.path}`:\n{existing}")
    parts.append("Return only the complete file contents, no code fences, no commentary.")
    return strip_fences(llm.complete(llm.EDITOR_MODEL, EDITOR_SYSTEM, "\n\n".join(parts)))


def repair_file(
    target_path: str,
    current: str,
    error_output: str,
    agents_md: str,
    context: dict[str, str],
    dependencies: str = "",
) -> str:
    """Feed a failing gate back to the editor for one file."""
    parts = ["# Repository conventions (AGENTS.md)\n\n" + agents_md.strip()]
    if dependencies:
        parts.append("# " + dependencies)
    context_block = _context_block(context)
    if context_block:
        parts.append(context_block)
    parts.append(
        f"# Task\n\nThe build gate failed with the output below. Fix `{target_path}` so that the gate passes. "
        "Keep the feature intact. If a module cannot be found, it is not installed: remove that import and "
        "implement the same thing without it (inline SVG for icons, plain React state for logic).\n\nGate output:\n" + error_output[-6000:] + f"\n\nCurrent contents of `{target_path}`:\n{current}"
    )
    parts.append("Return only the complete file contents, no code fences, no commentary.")
    return strip_fences(llm.complete(llm.EDITOR_MODEL, EDITOR_SYSTEM, "\n\n".join(parts)))
