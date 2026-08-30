/**
 * Explores the project's site with a headless browser and writes what it finds into the graph.
 *
 * A console action, so it resolves the caller's project. It runs in the request because the
 * console waits for the summary; the explorer bounds itself so one run stays within the route's
 * time budget.
 */
import { asErrorResponse, currentProject } from "@/lib/console/current";
import { exploreSite } from "@/lib/graph/explorer";
import { emitTrace } from "@/lib/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(): Promise<Response> {
  const project = await currentProject().catch(asErrorResponse);
  if (project instanceof Response) return project;
  if (!project.siteUrl) {
    return Response.json({ error: "Set the site address on the Overview page first." }, { status: 400 });
  }

  const started = Date.now();
  try {
    const summary = await exploreSite({ projectId: project.id, siteUrl: project.siteUrl });
    void emitTrace({
      projectId: project.id,
      source: "agent",
      kind: "tool",
      title: "Explored the site",
      detail: {
        tool: "explorer",
        transport: "shell",
        args_summary: project.siteUrl,
        result_summary: `${summary.pages} pages, ${summary.controls} controls, ${summary.transitions} transitions, ${summary.reveals} reveals`,
        latencyMs: Date.now() - started,
      },
    });
    return Response.json({ summary });
  } catch (error) {
    const message = (error as Error).message;
    void emitTrace({
      projectId: project.id,
      source: "agent",
      kind: "error",
      status: "failed",
      title: "The site could not be explored",
      detail: { message },
    });
    const unavailable = /executable|browser|chromium|launch/i.test(message);
    return Response.json(
      { error: unavailable ? `A browser is not available on this server: ${message}` : message },
      { status: 500 },
    );
  }
}
