/**
 * The developer's decision on a drafted pull request.
 *
 * For a `local` run the `escalation` row itself is the channel: the worker polls `approval` and
 * moves on as soon as the console writes it. For a `forge` run this route carries the decision
 * out itself after answering: it marks the pull request ready, merges it, watches the deployment
 * and tears the winning sandbox down, writing status events as it goes.
 */
import { after } from "next/server";
import { preflight, withCors } from "@/lib/cors";
import { asErrorResponse, currentProject } from "@/lib/console/current";
import { targetVercelProject, vercelTokenIfSet, type ForgeStrategyName } from "@/lib/env";
import { buildStrategy } from "@/lib/forge/config";
import { approveForge } from "@/lib/forge/engine";
import { loadCandidates, SupabaseForgeStore } from "@/lib/forge/store";
import { targetRepoFor } from "@/lib/forge/start";
import { serviceClient } from "@/lib/supabase";
import { emitTrace } from "@/lib/trace";

export const runtime = "nodejs";
export const maxDuration = 800;

export function OPTIONS(): Response {
  return preflight();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const project = await currentProject().catch(asErrorResponse);
  if (project instanceof Response) return project;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { approved?: boolean; note?: string };
  if (typeof body.approved !== "boolean") {
    return withCors(Response.json({ error: "approved is required" }, { status: 400 }));
  }
  const note = typeof body.note === "string" ? body.note : "";

  const db = serviceClient();
  const { data: escalation } = await db
    .from("escalation")
    .select("id, project_id, group_id, engine, status, pr_url, pr_number, request, winning_candidate_id")
    .eq("id", id)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!escalation) return withCors(Response.json({ error: "not found" }, { status: 404 }));

  const approval = { approved: body.approved, note, decidedAt: new Date().toISOString() };
  await db
    .from("escalation")
    .update({ approval, status: body.approved ? "approved" : "rejected" })
    .eq("id", id);

  await emitTrace({
    projectId: escalation.project_id as string,
    escalationId: id,
    kind: "decision",
    title: body.approved ? "A developer approved the change" : "A developer rejected the change",
    detail: approval,
    source: "agent",
  });

  if (escalation.engine === "forge") {
    const candidates = await loadCandidates(id).catch(() => []);
    const winner =
      candidates.find((candidate) => candidate.id === String(escalation.winning_candidate_id ?? "")) ?? null;
    const store = new SupabaseForgeStore({
      projectId: project.id,
      escalationId: id,
      groupId: escalation.group_id === null ? null : String(escalation.group_id),
    });
    const repo = await targetRepoFor({
      id: project.id,
      repoFullName: project.repoFullName,
      repoDefaultBranch: project.repoDefaultBranch,
    });
    const vercelToken = vercelTokenIfSet();
    const title = String((escalation.request as { title?: string } | null)?.title ?? "Patchlet change");
    after(() =>
      approveForge(
        {
          approved: body.approved as boolean,
          note,
          escalation: {
            id,
            prNumber: escalation.pr_number === null ? null : Number(escalation.pr_number),
            prUrl: escalation.pr_url === null ? null : String(escalation.pr_url),
            title,
          },
          winner,
          repo: { fullName: repo.fullName, token: repo.token ?? "" },
          vercel: vercelToken ? { token: vercelToken, projectName: targetVercelProject() } : null,
        },
        {
          store,
          strategy: buildStrategy({ name: (winner?.strategy ?? "local") as ForgeStrategyName }).strategy,
          log: (line) => console.log(`[forge ${id.slice(0, 8)}] ${line}`),
        },
      ).catch((error: Error) => console.error("forge approval failed:", error.message)),
    );
  }

  return withCors(Response.json({ ok: true, status: body.approved ? "approved" : "rejected" }));
}
