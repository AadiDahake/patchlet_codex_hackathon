"""Labels, the duplicate counter and the gate comment: the parity the console demo shows on GitHub."""

import json

import responses

from models import FeatureRequestInput
from steps import issue
from steps.github import GitHubClient

API = "https://api.github.com/repos/AadiDahake/novaair"


def _req() -> FeatureRequestInput:
    return FeatureRequestInput(
        escalation_id="e1",
        project_id="p1",
        repo_full_name="AadiDahake/novaair",
        title="Add dark mode",
        description="Users want a dark theme for the console.",
        area="Header / appearance",
        quote="How do I turn on dark mode?",
    )


def test_labels_for_every_priority() -> None:
    assert issue.labels_for("high") == ["patchlet", "priority:high"]
    assert issue.labels_for("low") == ["patchlet", "priority:low"]
    # An unknown value never reaches GitHub as a label.
    assert issue.labels_for("urgent") == ["patchlet", "priority:medium"]


def test_issue_body_states_the_priority_and_starts_the_counter() -> None:
    body = issue.build_issue_body(_req(), priority="high")
    assert "Priority: high" in body
    assert "Requested 1 time" in body


def test_bump_request_count_increments_and_appends() -> None:
    body = issue.build_issue_body(_req())
    once, count = issue.bump_request_count(body)
    assert count == 2
    assert "Requested 2 times" in once
    assert "Requested 1 time\n" not in once

    twice, count = issue.bump_request_count(once)
    assert count == 3 and "Requested 3 times" in twice

    appended, count = issue.bump_request_count("An issue somebody filed by hand.")
    assert count == 2 and appended.rstrip().endswith("Requested 2 times")


def test_duplicate_comment_carries_the_new_quote_and_the_count() -> None:
    comment = issue.build_duplicate_comment(_req(), 3)
    assert "Requested 3 times" in comment
    assert "> How do I turn on dark mode?" in comment


def test_gate_comment_lists_durations_and_links_to_the_console() -> None:
    comment = issue.build_gate_comment(
        [("npm run typecheck", True, 12.4), ("npm run build", True, 48.9)],
        "https://patchlet-codex.vercel.app/console/activity",
    )
    assert "| `npm run typecheck` | passed | 12s |" in comment
    assert "| `npm run build` | passed | 49s |" in comment
    assert "https://patchlet-codex.vercel.app/console/activity" in comment


@responses.activate
def test_ensure_labels_creates_only_what_is_missing() -> None:
    client = GitHubClient("AadiDahake/novaair", token="t")
    responses.get(f"{API}/labels/patchlet", json={"name": "patchlet"})
    responses.get(f"{API}/labels/priority%3Ahigh", status=404, json={"message": "Not Found"})
    responses.post(f"{API}/labels", json={"name": "priority:high"})

    created = client.ensure_labels(["patchlet", "priority:high"])

    assert created == ["priority:high"]
    payload = json.loads(responses.calls[-1].request.body)
    assert payload["name"] == "priority:high"
    assert payload["color"]


@responses.activate
def test_ensure_labels_tolerates_a_race_on_creation() -> None:
    client = GitHubClient("AadiDahake/novaair", token="t")
    responses.get(f"{API}/labels/patchlet", status=404, json={"message": "Not Found"})
    responses.post(f"{API}/labels", status=422, json={"message": "already_exists"})
    assert client.ensure_labels(["patchlet"]) == []


@responses.activate
def test_update_issue_body_patches_the_issue() -> None:
    client = GitHubClient("AadiDahake/novaair", token="t")
    responses.get(f"{API}/issues/3", json={"number": 3, "body": "Requested 1 time"})
    responses.patch(f"{API}/issues/3", json={"number": 3})

    body = client.get_issue(3)["body"]
    updated, count = issue.bump_request_count(body)
    client.update_issue_body(3, updated)

    assert count == 2
    assert json.loads(responses.calls[-1].request.body) == {"body": "Requested 2 times"}
