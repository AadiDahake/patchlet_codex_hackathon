import type { TraceEvent } from "@patchlet/shared";
import { toTraceEvent } from "@/lib/trace";
import { serviceClient } from "@/lib/supabase";

export type TraceFilters = {
  projectId: string;
  conversationId: string | null;
  escalationId: string | null;
  /** One trace kind, when a caller only wants those rows (the heartbeat asks for `status`). */
  kind: string | null;
  since: number;
  limit: number;
  /** Newest first. The live tail reads forward; a caller after the latest row reads back. */
  newestFirst: boolean;
};

/** Parses the filters both `/api/trace` and `/api/trace/stream` accept. */
export function readFilters(url: URL, projectId: string): TraceFilters {
  const since = Number(url.searchParams.get("since") ?? "0");
  const limit = Number(url.searchParams.get("limit") ?? "300");
  return {
    projectId,
    conversationId: url.searchParams.get("conversationId") || null,
    escalationId: url.searchParams.get("escalationId") || null,
    kind: url.searchParams.get("kind") || null,
    since: Number.isFinite(since) && since > 0 ? since : 0,
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 300,
    newestFirst: url.searchParams.get("order") === "desc",
  };
}

/**
 * Rows for one selection, oldest first.
 *
 * When both a conversation and an escalation are given the two are ORed, because one escalation's
 * story starts in the chat that produced it and the console shows that as a single trace.
 */
export async function fetchTrace(filters: TraceFilters): Promise<TraceEvent[]> {
  let query = serviceClient()
    .from("trace_event")
    .select("id, project_id, conversation_id, escalation_id, source, kind, status, title, detail, created_at")
    .eq("project_id", filters.projectId)
    .gt("id", filters.since)
    .order("id", { ascending: !filters.newestFirst })
    .limit(filters.limit);

  if (filters.kind) query = query.eq("kind", filters.kind);

  if (filters.conversationId && filters.escalationId) {
    query = query.or(
      `conversation_id.eq.${filters.conversationId},escalation_id.eq.${filters.escalationId}`,
    );
  } else if (filters.conversationId) {
    query = query.eq("conversation_id", filters.conversationId);
  } else if (filters.escalationId) {
    query = query.eq("escalation_id", filters.escalationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toTraceEvent(row as Record<string, unknown>));
}
