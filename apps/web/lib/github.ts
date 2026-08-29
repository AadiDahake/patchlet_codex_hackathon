import { activeGithubToken } from "./github/connection";

export type GithubRepository = {
  id: number;
  fullName: string;
  owner: string;
  name: string;
  private: boolean;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
  updatedAt: string | null;
};

type RepoPayload = {
  id: number;
  full_name: string;
  name: string;
  owner?: { login?: string };
  private: boolean;
  default_branch?: string;
  description?: string | null;
  html_url: string;
  updated_at?: string | null;
};

const API = "https://api.github.com";

async function headers(projectId: string): Promise<Record<string, string>> {
  return {
    authorization: `Bearer ${await activeGithubToken(projectId)}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
}

function toRepository(payload: RepoPayload): GithubRepository {
  return {
    id: payload.id,
    fullName: payload.full_name,
    owner: payload.owner?.login ?? payload.full_name.split("/")[0] ?? "",
    name: payload.name,
    private: Boolean(payload.private),
    defaultBranch: payload.default_branch ?? "main",
    description: payload.description ?? null,
    htmlUrl: payload.html_url,
    updatedAt: payload.updated_at ?? null,
  };
}

/**
 * Every repository this project's token can reach, newest activity first.
 *
 * A fine-grained token scoped to a single repository returns exactly that one, which is the honest
 * answer: the list is what Patchlet is actually allowed to open issues and pull requests in.
 */
export async function listRepositories(projectId: string): Promise<GithubRepository[]> {
  const collected: GithubRepository[] = [];
  const auth = await headers(projectId);
  for (let page = 1; page <= 3; page += 1) {
    const response = await fetch(
      `${API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`,
      { headers: auth, cache: "no-store" },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`GitHub rejected the repository list (${response.status}). ${detail.slice(0, 160)}`);
    }
    const payload = (await response.json()) as RepoPayload[];
    collected.push(...payload.map(toRepository));
    if (payload.length < 100) break;
  }
  return collected;
}

/** Confirms the token can read `owner/name`, and returns what GitHub knows about it. */
export async function getRepository(
  projectId: string,
  fullName: string,
): Promise<GithubRepository | null> {
  const response = await fetch(`${API}/repos/${fullName}`, {
    headers: await headers(projectId),
    cache: "no-store",
  });
  if (response.status === 404 || response.status === 403) return null;
  if (!response.ok) {
    throw new Error(`GitHub rejected the repository check (${response.status}).`);
  }
  return toRepository((await response.json()) as RepoPayload);
}
