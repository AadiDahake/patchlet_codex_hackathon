from models import FeatureRequestInput
from steps import issue


def _req() -> FeatureRequestInput:
    return FeatureRequestInput(
        escalation_id="e1",
        project_id="p1",
        repo_full_name="AadiDahake/novaair",
        title="Add dark mode",
        description="Users want a dark theme for the console.",
        area="Header / appearance",
        quote="How do I turn on dark mode?",
        rationale="Working at night is hard on the eyes.",
        site_url="https://novaair.vercel.app",
    )


def test_issue_body_has_every_section() -> None:
    body = issue.build_issue_body(_req())
    for heading in ("## What the user asked", "## Why it matters", "## Where it belongs", "## Acceptance criteria"):
        assert heading in body
    assert "> How do I turn on dark mode?" in body
    assert "Header / appearance" in body
    assert body.rstrip().endswith(issue.FOOTER)
    assert "- [ ]" in body


def test_issue_body_without_quote_or_area() -> None:
    req = _req().model_copy(update={"quote": "", "area": "", "rationale": ""})
    body = issue.build_issue_body(req, ["It works."])
    assert ">" not in body.split("## Why")[0]
    assert "To be decided by the maintainers." in body
    assert "- [ ] It works." in body


def test_pr_body_lists_files_and_closes_issue() -> None:
    body = issue.build_pr_body(_req(), 12, ["styles/tokens.css", "components/ThemeToggle.tsx"], ["Toggle appears in the header."], "Adds a theme toggle.")
    assert body.startswith("Closes #12")
    assert "`components/ThemeToggle.tsx`" in body
    assert "- Toggle appears in the header." in body
