/**
 * The three independent checks behind every answer.
 *
 * Absence is only asserted when all three come back empty, so each one is kept
 * cheap, independent, and honest about what it actually saw.
 */
import { concepts } from "@patchlet/shared";
import type { Affordance, PageContext, ProbeResult } from "@patchlet/shared";
import { embed } from "../openai";
import { serviceClient } from "../supabase";
import { activeGithubToken } from "../github/connection";

/** Words that mean the same thing to a user but not to a string comparison. */
const SYNONYMS: Record<string, string[]> = {
  dark: ["theme", "appearance", "night"],
  theme: ["dark", "appearance"],
  username: ["name", "profile", "account", "display"],
  name: ["username", "profile"],
  key: ["token", "secret", "credential"],
  invite: ["member", "teammate", "collaborator"],
};

function expand(query: string): string {
  const extra: string[] = [];
  for (const token of concepts(query)) {
    const synonyms = SYNONYMS[token];
    if (synonyms) extra.push(...synonyms);
  }
  return extra.length ? `${query} ${extra.join(" ")}` : query;
}

/** One passage the documentation check found, with the article and the address it came from. */
export type DocsEvidence = {
  documentTitle: string;
  url: string | null;
  heading: string | null;
  snippet: string;
  similarity: number;
};

/**
 * Documentation: cosine search over the ingested chunks, damped by OCR confidence.
 *
 * The embedding can be handed in already in flight: it only depends on the question, so the
 * caller starts it next to the understanding call rather than after it.
 */
export async function probeDocs(
  question: string,
  projectId: string,
  embedding?: Promise<number[]> | number[],
): Promise<ProbeResult> {
  const started = Date.now();
  try {
    const vector = embedding ? await embedding : (await embed([question]))[0];
    const { data, error } = await serviceClient().rpc("match_chunks_with_source", {
      query_embedding: vector,
      match_count: 6,
      filter_project: projectId,
    });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as {
      document_title: string | null;
      source_ref: string | null;
      heading: string | null;
      content: string;
      similarity: number;
      confidence: number | null;
    }[];
    if (rows.length === 0) {
      return {
        probe: "docs",
        hit: false,
        score: 0,
        summary: "No documentation covers this.",
        evidence: [],
        latencyMs: Date.now() - started,
      };
    }
    const top = rows[0]!;
    // A passage we parsed badly should not ground a confident answer.
    const damping = top.confidence === null ? 1 : 0.6 + 0.4 * top.confidence;
    const score = top.similarity * damping;
    // Embeddings put unrelated prose surprisingly close together, so distance
    // alone will happily "find" a contact page for a question about theming.
    // Require the passage to actually use the words the question is about.
    const asked = concepts(question);
    const found = concepts(`${top.document_title ?? ""} ${top.heading ?? ""} ${top.content}`);
    let overlap = 0;
    for (const token of asked) if (found.has(token)) overlap += 1;
    const grounded = asked.size === 0 ? false : overlap / asked.size >= 0.34;
    const hit = score >= 0.7 && grounded;
    const evidence: DocsEvidence[] = rows.slice(0, 3).map((row) => ({
      documentTitle: row.document_title ?? "",
      url: row.source_ref,
      heading: row.heading,
      snippet: row.content.slice(0, 240),
      similarity: Number(row.similarity.toFixed(3)),
    }));
    return {
      probe: "docs",
      hit,
      score,
      summary: hit
        ? `The documentation covers this: "${top.document_title ?? top.heading ?? "a passage"}" (${score.toFixed(2)}).`
        : `Nothing in the documentation covers this (best ${score.toFixed(2)}).`,
      evidence,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      probe: "docs",
      hit: false,
      score: 0,
      summary: `The documentation check could not run: ${(error as Error).message}`,
      evidence: [],
      latencyMs: Date.now() - started,
    };
  }
}

/**
 * Interface: does a control on the page in front of the user do this?
 *
 * The question names a capability ("usage export"); a control only counts when
 * its label covers that capability, not merely one of its words. "Usage" in the
 * sidebar is not an export button, and matching it once sent the agent off to
 * invent one.
 */
export function probeInterface(question: string, page: PageContext, feature = ""): ProbeResult {
  const started = Date.now();
  const capability = concepts(expand(feature || question));
  const featureTokens = concepts(feature || question);
  const scored = page.affordances
    .map((affordance: Affordance) => {
      const label = `${affordance.name} ${affordance.text ?? ""}`;
      const have = concepts(expand(label));
      // How much of the capability the control's own label accounts for.
      let covered = 0;
      for (const token of featureTokens) if (have.has(token)) covered += 1;
      const featureCoverage = featureTokens.size === 0 ? 0 : covered / featureTokens.size;
      // And how much of the label is about the capability, so a long generic
      // label does not win on one shared word.
      let shared = 0;
      for (const token of have) if (capability.has(token)) shared += 1;
      const labelFocus = have.size === 0 ? 0 : shared / have.size;
      return { affordance, score: Math.min(featureCoverage, Math.max(labelFocus, 0.5)) };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0]?.score ?? 0;
  // A two-word capability needs both words on the control; longer ones need most of them.
  const needed = featureTokens.size <= 2 ? 1 : 0.75;
  const hit = best >= needed;
  return {
    probe: "interface",
    hit,
    score: best,
    summary: hit
      ? `A control on this page does this (${best.toFixed(2)}).`
      : "No control on this page does this.",
    evidence: scored.slice(0, 5).map((entry) => ({
      id: entry.affordance.id,
      name: entry.affordance.name,
      role: entry.affordance.role,
      score: Number(entry.score.toFixed(2)),
    })),
    latencyMs: Date.now() - started,
  };
}

type TreeCache = { at: number; paths: string[] };
const treeCache = new Map<string, TreeCache>();
const SOURCE = /\.(ts|tsx|js|jsx|css|md)$/;

/** Implementation: is there code for this in the connected repository? */
export async function probeRepository(
  projectId: string,
  question: string,
  repoFullName: string | null,
  branch: string,
): Promise<ProbeResult> {
  const started = Date.now();
  if (!repoFullName) {
    return {
      probe: "repository",
      hit: false,
      score: null,
      summary: "No repository is connected.",
      evidence: [],
      latencyMs: Date.now() - started,
    };
  }
  try {
    const cached = treeCache.get(repoFullName);
    let paths: string[];
    if (cached && Date.now() - cached.at < 60_000) {
      paths = cached.paths;
    } else {
      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`,
        {
          headers: {
            authorization: `Bearer ${await activeGithubToken(projectId)}`,
            accept: "application/vnd.github+json",
          },
        },
      );
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      const body = (await response.json()) as { tree?: { path: string; type: string }[] };
      paths = (body.tree ?? [])
        .filter((entry) => entry.type === "blob" && SOURCE.test(entry.path))
        .map((entry) => entry.path)
        .filter((path) => !path.includes("node_modules"));
      treeCache.set(repoFullName, { at: Date.now(), paths });
    }

    const wanted = [...concepts(expand(question))];
    const matches = paths
      .map((path) => ({
        path,
        score: wanted.filter((token) => path.toLowerCase().includes(token)).length,
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    return {
      probe: "repository",
      hit: matches.length > 0,
      score: null,
      summary:
        matches.length > 0
          ? `The repository has code that mentions this (${matches.length} file(s)).`
          : "Nothing in the repository implements this.",
      evidence: matches.map((entry) => ({ path: entry.path, matches: entry.score })),
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    return {
      probe: "repository",
      hit: false,
      score: null,
      summary: `The repository check could not run: ${(error as Error).message}`,
      evidence: [],
      latencyMs: Date.now() - started,
    };
  }
}
