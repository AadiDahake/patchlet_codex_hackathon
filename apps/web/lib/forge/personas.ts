/**
 * The three personas as data.
 *
 * The shape is the one Reflex's own `AgentPersona` uses (name, agent type, system prompt, model,
 * sandbox options, environment variable names), so a persona can be handed to Reflex unchanged
 * the day the account has one. Until then Patchlet stores them and applies one by rendering its
 * prompt into a `codex exec` run inside a sandbox created from its size and blueprint.
 *
 * The prompts live beside this file as Markdown so a change to one is reviewable in a diff.
 */
import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { CODEX_MODEL } from "./codex";
import type { CapabilityIr } from "./ir";

export type PersonaKey = "capability_builder" | "ux_builder" | "capability_verifier";

export type Persona = {
  key: PersonaKey;
  name: string;
  agentType: "codex";
  systemPrompt: string;
  model: typeof CODEX_MODEL;
  /** Reflex's launch modes. Builders implement; the verifier reviews. */
  promptMode: "implement" | "review";
  sandboxOptions: { resourceSize: "LARGE"; blueprintName: string | null };
  /** Names only. The values are injected by the sandbox strategy, never stored here. */
  envVarNames: string[];
  /** The verifier's report is constrained to this schema through `--output-schema`. */
  outputSchema: Record<string, unknown> | null;
  /** The UX Builder continues the Capability Builder's thread instead of re-reading the repo. */
  resumesThread: boolean;
};

export type Personas = Record<PersonaKey, Persona>;

/** Every property is required and no extra property is allowed, which is what strict output needs. */
export const VERIFIER_REPORT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["scenarios", "test_command", "test_file", "summary"],
  properties: {
    scenarios: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "passed", "test_name", "notes"],
        properties: {
          id: { type: "string" },
          passed: { type: "boolean" },
          test_name: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
    test_command: { type: "string" },
    test_file: { type: "string" },
    summary: { type: "string" },
  },
};

const PROMPT_FILES: Record<PersonaKey, string> = {
  capability_builder: "capability-builder.md",
  ux_builder: "ux-builder.md",
  capability_verifier: "capability-verifier.md",
};

/**
 * The prompts directory, wherever the process was started: `apps/web` under `next`, the
 * repository root under the scripts, or a bundle that kept the path.
 */
function promptsDir(): string {
  const candidates = [
    join(process.cwd(), "lib", "forge", "prompts"),
    join(process.cwd(), "apps", "web", "lib", "forge", "prompts"),
  ];
  for (const candidate of candidates) {
    if (existsSync(join(candidate, PROMPT_FILES.capability_builder))) return candidate;
  }
  throw new Error(
    `The persona prompts were not found. Looked in: ${candidates.join(", ")}. ` +
      "Start the process from apps/web or from the repository root.",
  );
}

export function readPrompt(key: PersonaKey): string {
  return readFileSync(join(promptsDir(), PROMPT_FILES[key]), "utf8");
}

/** The three personas, prompts loaded from disk once per call. */
export function loadPersonas(options: { blueprintName?: string | null } = {}): Personas {
  const blueprintName = options.blueprintName ?? null;
  const base: Pick<Persona, "agentType" | "model" | "sandboxOptions" | "envVarNames"> = {
    agentType: "codex",
    model: CODEX_MODEL,
    sandboxOptions: { resourceSize: "LARGE", blueprintName },
    envVarNames: ["CODEX_API_KEY", "GH_TOKEN"],
  };
  return {
    capability_builder: {
      ...base,
      key: "capability_builder",
      name: "Capability Builder",
      systemPrompt: readPrompt("capability_builder"),
      promptMode: "implement",
      outputSchema: null,
      resumesThread: false,
    },
    ux_builder: {
      ...base,
      key: "ux_builder",
      name: "UX Builder",
      systemPrompt: readPrompt("ux_builder"),
      promptMode: "implement",
      outputSchema: null,
      resumesThread: true,
    },
    capability_verifier: {
      ...base,
      key: "capability_verifier",
      name: "Capability Verifier",
      systemPrompt: readPrompt("capability_verifier"),
      promptMode: "review",
      outputSchema: VERIFIER_REPORT_SCHEMA,
      resumesThread: false,
    },
  };
}

/** The order the personas run in, inside one candidate's sandbox. */
export const PERSONA_ORDER: PersonaKey[] = ["capability_builder", "ux_builder", "capability_verifier"];

export type PromptContext = {
  ir: CapabilityIr;
  repo: { fullName: string; defaultBranch: string };
  candidate: { label: string; approach: string };
  /** The target repository's own AGENTS.md, when it has one. */
  agentsMd: string | null;
};

/** The acceptance criteria, rendered once from the specification and given to every persona. */
export function renderAcceptance(ir: CapabilityIr): string {
  const lines: string[] = [];
  lines.push(`# Acceptance criteria for \`${ir.intent}\``, "");
  if (ir.summary) lines.push(ir.summary, "");

  lines.push("## Postconditions", "");
  for (const item of ir.success.postconditions) lines.push(`- \`${item.id}\`: ${item.statement}`);
  lines.push("");

  lines.push("## Constraints (hard rules, a violation is a failure)", "");
  for (const item of ir.constraints) {
    const source = item.source ? ` (source: ${item.source})` : "";
    lines.push(`- \`${item.id}\`: ${item.statement}${source}`);
  }
  lines.push("");

  if (ir.preferences && ir.preferences.length > 0) {
    lines.push("## Preferences (soft rules, used to rank valid results)", "");
    for (const item of ir.preferences) {
      lines.push(`- \`${item.id}\` (${item.direction}): ${item.statement}`);
    }
    lines.push("");
  }

  lines.push("## Scenarios (one test each)", "");
  lines.push("| id | kind | given | when | then |", "| --- | --- | --- | --- | --- |");
  for (const scenario of ir.success.scenarios) {
    const cells = [scenario.id, scenario.kind ?? "", scenario.given, scenario.when ?? "", scenario.then];
    lines.push(`| ${cells.map((cell) => cell.replace(/\|/g, "\\|")).join(" | ")} |`);
  }
  lines.push("");

  if (ir.proposed_ui) {
    lines.push("## Proposed interface", "");
    for (const [key, value] of Object.entries(ir.proposed_ui)) {
      if (value) lines.push(`- ${key}: ${value}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/**
 * The prompt one persona runs with: its system prompt, then the run's context. `codex exec`
 * takes one prompt, so the two parts of a Reflex launch (persona prompt, launch prompt) become
 * two sections of one file.
 */
export function renderPrompt(persona: Persona, context: PromptContext): string {
  const { ir, repo, candidate } = context;
  const parts: string[] = [persona.systemPrompt.trim(), "", "---", "", "# This run", ""];
  parts.push(`- Repository: \`${repo.fullName}\`, base branch \`${repo.defaultBranch}\`.`);
  parts.push(`- Capability: \`${ir.intent}\`.${ir.summary ? ` ${ir.summary}` : ""}`);
  parts.push(`- Candidate ${candidate.label}. Approach for this candidate: ${candidate.approach}`);
  parts.push(
    `- Authority: this run adds \`${ir.intent}\`. It is the product decision a repository guard asks for. Do not raise it; build it.`,
  );
  parts.push(
    `- Evidence: ${ir.evidence.session_count} user sessions did this by hand` +
      (typeof ir.evidence.median_manual_actions === "number"
        ? `, a median of ${ir.evidence.median_manual_actions} actions each.`
        : "."),
  );
  parts.push(
    "- Files: `.patchlet/spec.json`, `.patchlet/trajectories.json`, `.patchlet/acceptance.md`.",
  );
  parts.push("- The `.patchlet` directory is Patchlet's. Do not edit it and do not add it to a commit.");
  if (persona.key === "capability_verifier") {
    parts.push(
      `- Scenario ids, in order: ${ir.success.scenarios.map((scenario) => `\`${scenario.id}\``).join(", ")}.`,
    );
  }
  parts.push("");
  if (context.agentsMd) {
    parts.push("# The repository's AGENTS.md", "", context.agentsMd.trim(), "");
  }
  return parts.join("\n");
}
