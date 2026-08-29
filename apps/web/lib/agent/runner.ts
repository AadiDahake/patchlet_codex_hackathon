/**
 * Starting one run against a request group.
 *
 * A run is an `escalation` row. Its `mode` says what it is for: open the issue and stop, draft the
 * pull request, or only carry a new count and quote to what is already on GitHub. The `local`
 * engine needs no call at all - the worker's runner claims queued rows itself.
 *
 * `forge`, the Reflex/Runloop engine, is a named seam and nothing more. Selecting it fails here,
 * before any row is written, so a project cannot queue work that no runner will ever claim.
 */
import type { FeatureRequest, RequestGroup, RequestGroupStatus } from "@patchlet/shared";
import { escalationEngine } from "../env";
import { serviceClient } from "../supabase";

export type RunMode = "full" | "file_only" | "update";

/** Points the group at the run now carrying it, so a second full run cannot start beside it. */
export async function attachRun(
  groupId: string,
  escalationId: string,
  status: RequestGroupStatus,
): Promise<void> {
  await serviceClient()
    .from("feature_request_group")
    .update({ escalation_id: escalationId, status })
    .eq("id", groupId);
}

export type RunProject = {
  id: string;
  repoFullName: string;
  defaultBranch: string;
  siteUrl: string | null;
};

/**
 * Raised when the selected engine cannot run anything. The API boundary turns it into a 503 with
 * this message, and no escalation row is written.
 */
export class EngineNotConfigured extends Error {
  constructor(engine: string) {
    super(`The ${engine} engine is not configured yet.`);
    this.name = "EngineNotConfigured";
  }
}

/**
 * Inserts the run and hands it to the engine.
 *
 * Returns the escalation id of the run, which is also what the widget follows.
 */
export async function startRun(input: {
  project: RunProject;
  group: RequestGroup;
  request: FeatureRequest;
  mode: RunMode;
  conversationId?: string | null;
  messageId?: string | null;
}): Promise<string> {
  const db = serviceClient();
  const engine = escalationEngine();
  if (engine !== "local") throw new EngineNotConfigured(engine);
  const { data, error } = await db
    .from("escalation")
    .insert({
      project_id: input.project.id,
      conversation_id: input.conversationId ?? null,
      message_id: input.messageId ?? null,
      group_id: input.group.id,
      mode: input.mode,
      request: input.request,
      engine,
      status: "queued",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "the run could not be recorded");
  const escalationId = String(data.id);

  // A run that carries the group forward owns it from here, so a second full run cannot start
  // while this one is still drafting.
  if (input.mode === "full") await attachRun(input.group.id, escalationId, "drafting");
  else if (input.mode === "file_only") await attachRun(input.group.id, escalationId, "observed");

  return escalationId;
}
