"""PostgREST helpers. Every write the worker makes to Supabase goes through here."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import requests

import config

TIMEOUT = 20


def _headers(prefer: str | None = None) -> dict[str, str]:
    key = config.supabase_service_role_key()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _url(table: str) -> str:
    return f"{config.supabase_url()}/rest/v1/{table}"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _check(response: requests.Response) -> Any:
    if response.status_code >= 400:
        raise RuntimeError(f"PostgREST {response.status_code}: {response.text[:500]}")
    if not response.content:
        return None
    return response.json()


def update_escalation(escalation_id: str, **fields: Any) -> dict[str, Any] | None:
    """Patch an escalation row. `updated_at` is always bumped so the dashboard sees activity."""
    payload = dict(fields)
    payload["updated_at"] = _now()
    response = requests.patch(
        _url("escalation"),
        params={"id": f"eq.{escalation_id}"},
        headers=_headers("return=representation"),
        json=payload,
        timeout=TIMEOUT,
    )
    rows = _check(response)
    return rows[0] if rows else None


def get_escalation(escalation_id: str) -> dict[str, Any] | None:
    response = requests.get(
        _url("escalation"),
        params={"id": f"eq.{escalation_id}", "select": "*"},
        headers=_headers(),
        timeout=TIMEOUT,
    )
    rows = _check(response)
    return rows[0] if rows else None


def get_project(project_id: str) -> dict[str, Any] | None:
    response = requests.get(
        _url("project"),
        params={"id": f"eq.{project_id}", "select": "*"},
        headers=_headers(),
        timeout=TIMEOUT,
    )
    rows = _check(response)
    return rows[0] if rows else None


def get_group(group_id: str) -> dict[str, Any] | None:
    response = requests.get(
        _url("feature_request_group"),
        params={"id": f"eq.{group_id}", "select": "*"},
        headers=_headers(),
        timeout=TIMEOUT,
    )
    rows = _check(response)
    return rows[0] if rows else None


def update_group(group_id: str, **fields: Any) -> dict[str, Any] | None:
    """Patch a request group. The group is what the console lists, so this is what a reader sees."""
    response = requests.patch(
        _url("feature_request_group"),
        params={"id": f"eq.{group_id}"},
        headers=_headers("return=representation"),
        json=dict(fields),
        timeout=TIMEOUT,
    )
    rows = _check(response)
    return rows[0] if rows else None


def emit_trace(
    project_id: str,
    escalation_id: str | None,
    kind: str,
    title: str,
    status: str = "ok",
    detail: Any = None,
    source: str = "workflow",
    conversation_id: str | None = None,
) -> int | None:
    """Insert one trace_event row and return its id."""
    payload = {
        "project_id": project_id,
        "escalation_id": escalation_id,
        "conversation_id": conversation_id,
        "source": source,
        "kind": kind,
        "status": status,
        "title": title,
        "detail": detail,
    }
    response = requests.post(
        _url("trace_event"),
        headers=_headers("return=representation"),
        json=payload,
        timeout=TIMEOUT,
    )
    rows = _check(response)
    return rows[0]["id"] if rows else None


def claim_queued_local() -> dict[str, Any] | None:
    """Pick the oldest queued local escalation and mark it `filing` so no other runner takes it."""
    response = requests.get(
        _url("escalation"),
        params={
            "status": "eq.queued",
            "engine": "eq.local",
            "select": "*",
            "order": "created_at.asc",
            "limit": "1",
        },
        headers=_headers(),
        timeout=TIMEOUT,
    )
    rows = _check(response)
    if not rows:
        return None
    candidate = rows[0]
    response = requests.patch(
        _url("escalation"),
        params={"id": f"eq.{candidate['id']}", "status": "eq.queued"},
        headers=_headers("return=representation"),
        json={"status": "filing", "updated_at": _now()},
        timeout=TIMEOUT,
    )
    claimed = _check(response)
    return claimed[0] if claimed else None


def heartbeat(project_id: str, engine: str = "local") -> int | None:
    """The console shows the worker as online when one of these arrived in the last two minutes."""
    return emit_trace(
        project_id,
        None,
        "status",
        "worker online",
        detail={"engine": engine, "at": _now()},
    )


def list_projects() -> list[dict[str, Any]]:
    response = requests.get(
        _url("project"),
        params={"select": "id,slug,repo_full_name,repo_default_branch,site_url"},
        headers=_headers(),
        timeout=TIMEOUT,
    )
    return _check(response) or []
