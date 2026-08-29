"""Waits for the Vercel deployment that corresponds to a merge commit."""

from __future__ import annotations

import time
from typing import Any, Callable

import requests

import config

API = "https://api.vercel.com"
TIMEOUT_S = 8 * 60
POLL_S = 10
REPORT_EVERY_S = 30
PRODUCTION_ALIASES = {"novaair": "https://novaair.vercel.app"}


class DeployError(RuntimeError):
    pass


def _headers() -> dict[str, str]:
    return {"Authorization": f"Bearer {config.vercel_token()}"}


def _get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = requests.get(f"{API}{path}", headers=_headers(), params=params, timeout=30)
    if response.status_code >= 400:
        raise DeployError(f"GET {path} -> {response.status_code}: {response.text[:300]}")
    return response.json()


def resolve_project_id(name: str) -> str:
    return _get(f"/v9/projects/{name}")["id"]


def list_deployments(project_id: str, limit: int = 10) -> list[dict[str, Any]]:
    return _get("/v6/deployments", {"projectId": project_id, "limit": limit}).get("deployments", [])


def _matches(deployment: dict[str, Any], merge_sha: str) -> bool:
    meta = deployment.get("meta") or {}
    return (meta.get("githubCommitSha") or "") == merge_sha


def deployment_url(deployment: dict[str, Any], project_name: str) -> str:
    if deployment.get("target") == "production" and project_name in PRODUCTION_ALIASES:
        return PRODUCTION_ALIASES[project_name]
    url = deployment.get("url") or ""
    return url if url.startswith("http") else f"https://{url}"


def wait_for_deployment(
    merge_sha: str,
    project_name: str | None = None,
    report: Callable[[str, str], None] | None = None,
    timeout_s: int = TIMEOUT_S,
) -> str:
    """Poll until a READY deployment for `merge_sha` exists; returns its https url."""
    project_name = project_name or config.target_vercel_project()
    project_id = resolve_project_id(project_name)
    started = time.monotonic()
    last_report = started
    last_state = "none yet"
    while True:
        for deployment in list_deployments(project_id):
            if not _matches(deployment, merge_sha):
                continue
            state = deployment.get("readyState") or deployment.get("state") or ""
            last_state = state
            if state == "READY":
                return deployment_url(deployment, project_name)
            if state in {"ERROR", "CANCELED"}:
                raise DeployError(f"deployment {deployment.get('uid')} ended in state {state}")
        elapsed = time.monotonic() - started
        if elapsed > timeout_s:
            raise DeployError(f"no READY deployment for {merge_sha[:7]} after {int(elapsed)}s (last state: {last_state})")
        if report and time.monotonic() - last_report >= REPORT_EVERY_S:
            last_report = time.monotonic()
            report(f"Waiting for the Vercel deployment of {merge_sha[:7]} ({int(elapsed)} s elapsed)", last_state)
        time.sleep(POLL_S)
