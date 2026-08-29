import responses

from steps import deploy


@responses.activate
def test_wait_for_deployment_returns_production_alias(monkeypatch) -> None:
    monkeypatch.setattr(deploy, "POLL_S", 0)
    responses.get("https://api.vercel.com/v9/projects/novaair", json={"id": "prj_1"})
    responses.get(
        "https://api.vercel.com/v6/deployments",
        json={"deployments": [{"uid": "d1", "meta": {"githubCommitSha": "abc"}, "readyState": "BUILDING", "url": "x.vercel.app", "target": "production"}]},
    )
    responses.get(
        "https://api.vercel.com/v6/deployments",
        json={"deployments": [{"uid": "d1", "meta": {"githubCommitSha": "abc"}, "readyState": "READY", "url": "x-abc.vercel.app", "target": "production"}]},
    )
    assert deploy.wait_for_deployment("abc", "novaair") == "https://novaair.vercel.app"


def test_deployment_url_for_preview() -> None:
    assert deploy.deployment_url({"url": "x-abc.vercel.app", "target": None}, "novaair") == "https://x-abc.vercel.app"
