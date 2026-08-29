/**
 * Starting a forge run from the console: the escalation row, the target repository, the
 * specification, and the engine wired from the environment.
 *
 * The run itself is long (each candidate is three Codex sessions and a test run). The route that
 * calls this answers as soon as the row exists and lets the run continue after the response.
 */
import type { FeatureRequest, RequestGroup } from "@patchlet/shared";
import { attachRun } from "../agent/runner";
import { appUrl, forgeStrategy, forgeTargetRepo } from "../env";
import { activeGithubToken } from "../github/connection";
import { serviceClient } from "../supabase";
import { buildForgeDeps, forgeAvailability } from "./config";
import { runForge, type ForgeRunResult } from "./engine";
import type { CapabilityIr } from "./ir";
import { SupabaseForgeStore } from "./store";
import type { TargetRepo } from "./strategy";

export type ForgeProject = {
  id: string;
  repoFullName: string | null;
  repoDefaultBranch: string | null;
};

export type StartedRun = {
  escalationId: string;
  /** Resolves when the run pauses for approval, or fails. Never rejects. */
  run: () => Promise<ForgeRunResult>;
};

export class ForgeStartError extends Error {
  constructor(
    message: string,
    readonly reason: "engine_unavailable" | "no_github_token",
    readonly status: number,
  ) {
    super(message);
    this.name = "ForgeStartError";
  }
}

/** The repository a run targets: the project's, else the configured default. */
export async function targetRepoFor(project: ForgeProject): Promise<TargetRepo> {
  const fullName = project.repoFullName ?? forgeTargetRepo();
  const [owner, name] = fullName.split("/");
  if (!owner || !name) throw new ForgeStartError(`"${fullName}" is not an owner/name repository.`, "no_github_token", 409);
  let token: string;
  try {
    token = await activeGithubToken(project.id);
  } catch (error) {
    throw new ForgeStartError((error as Error).message, "no_github_token", 409);
  }
  return { fullName, owner, name, defaultBranch: project.repoDefaultBranch ?? "main", token };
}

/** The latest compiled specification for a group, or null when the compiler has stored none. */
export async function latestCapabilitySpec(
  groupId: string,
): Promise<{ id: string; spec: unknown } | null> {
  const { data, error } = await serviceClient()
    .from("capability_spec")
    .select("id, spec, version")
    .eq("group_id", groupId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  // The table arrives with the compiler's migration; until then there is simply no stored spec.
  if (error || !data) return null;
  return { id: String(data.id), spec: data.spec };
}

/**
 * Reuses the group's queued forge escalation when the widget already opened one, else inserts a
 * new run. Either way the group points at it from here.
 */
async function escalationFor(project: ForgeProject, group: RequestGroup, specId: string | null): Promise<string> {
  const db = serviceClient();
  const { data: queued } = await db
    .from("escalation")
    .select("id")
    .eq("group_id", group.id)
    .eq("engine", "forge")
    .eq("status", "queued")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  let escalationId = queued ? String(queued.id) : null;

  if (!escalationId) {
    const request: FeatureRequest = {
      title: group.title,
      description: group.description,
      area: group.area,
      quote: "",
      rationale: `${group.reportCount} conversations reached this gap.`,
    };
    const { data, error } = await db
      .from("escalation")
      .insert({
        project_id: project.id,
        group_id: group.id,
        mode: "full",
        request,
        engine: "forge",
        status: "queued",
        capability_spec_id: specId,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "the run could not be recorded");
    escalationId = String(data.id);
  } else if (specId) {
    await db.from("escalation").update({ capability_spec_id: specId }).eq("id", escalationId);
  }
  await attachRun(group.id, escalationId, "drafting");
  return escalationId;
}

export async function startForgeRun(input: {
  project: ForgeProject;
  group: RequestGroup;
  ir: CapabilityIr;
  capabilitySpecId: string | null;
}): Promise<StartedRun> {
  const availability = forgeAvailability();
  if (!availability.ok) throw new ForgeStartError(availability.reason, "engine_unavailable", 503);
  const repo = await targetRepoFor(input.project);
  const escalationId = await escalationFor(input.project, input.group, input.capabilitySpecId);
  const store = new SupabaseForgeStore({
    projectId: input.project.id,
    escalationId,
    groupId: input.group.id,
  });
  const log = (line: string): void => console.log(`[forge ${escalationId.slice(0, 8)}] ${line}`);
  const deps = buildForgeDeps(store, { name: forgeStrategy(), log });

  return {
    escalationId,
    run: () =>
      runForge(
        {
          escalationId,
          ir: input.ir,
          capabilitySpecId: input.capabilitySpecId,
          repo,
          opportunityUrl: `${appUrl()}/console/activity?escalation=${escalationId}`,
          push: true,
        },
        deps,
      ).catch(async (error: Error) => {
        // runForge reports its own failures; this catches what happens before it can.
        await store.trace({ kind: "error", status: "failed", title: "Forge failed", detail: { message: error.message } });
        await store.updateEscalation({ status: "failed", error: error.message.slice(0, 2000) });
        return {
          status: "failed" as const,
          winner: null,
          candidates: [],
          previewUrl: null,
          pr: null,
          wouldPush: null,
          error: error.message,
        };
      }),
  };
}
