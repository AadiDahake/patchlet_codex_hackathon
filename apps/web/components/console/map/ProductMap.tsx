"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatRelativeTime } from "@/lib/console/format";
import type { KnownRoute, StoredGraph } from "@/lib/graph/store";
import { ControlsPanel, KnownRoutesPanel, PagesPanel, TransitionsPanel } from "./MapPanels";

type Props = {
  initialGraph: StoredGraph;
  initialRoutes: KnownRoute[];
  siteUrl: string | null;
};

type ExploreSummary = {
  pages: number;
  controls: number;
  transitions: number;
  reveals: number;
  formsTried: number;
  visited: string[];
  skipped: string[];
  durationMs: number;
};

/** The graph as a whole, the action that fills it, and the lists that show what is in it. */
export function ProductMap({ initialGraph, initialRoutes, siteUrl }: Props) {
  const [graph, setGraph] = useState(initialGraph);
  const [routes, setRoutes] = useState(initialRoutes);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // Exploring a site is a minute of browser work, so silence would read as a hang.
  useEffect(() => {
    if (startedAt === null) return;
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/site/map");
    const body = (await response.json()) as { graph?: StoredGraph; routes?: KnownRoute[]; error?: string };
    if (!response.ok || !body.graph) throw new Error(body.error ?? "The product map could not be read.");
    setGraph(body.graph);
    setRoutes(body.routes ?? []);
  }, []);

  const explore = useCallback(async () => {
    setStartedAt(Date.now());
    setElapsed(0);
    setResult("");
    setError("");
    try {
      const response = await fetch("/api/site/explore", { method: "POST" });
      const body = (await response.json()) as { summary?: ExploreSummary; error?: string };
      if (!response.ok || !body.summary) throw new Error(body.error ?? "The site could not be explored.");
      setResult(summaryLine(body.summary));
      await refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The site could not be explored.");
    } finally {
      setStartedAt(null);
    }
  }, [refresh]);

  const exploring = startedAt !== null;
  const lastExplored = useMemo(() => latestExplorerVisit(graph), [graph]);
  const empty = graph.pages.length === 0;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" className="primary-action" disabled={exploring || !siteUrl} onClick={() => void explore()}>
          {exploring ? "Exploring..." : "Explore site"}
        </button>
        {exploring ? (
          <span className="field-hint m-0" aria-live="polite">
            {elapsed}s elapsed
          </span>
        ) : null}
        {!siteUrl ? <span className="field-hint m-0">Set the site address on the Overview page first.</span> : null}
        {siteUrl && !exploring ? (
          <span className="field-hint m-0 mono" title={siteUrl}>
            {siteUrl}
          </span>
        ) : null}
      </div>

      {result ? (
        <div className="notice mb-6" role="status">
          {result}
        </div>
      ) : null}

      {error ? (
        <div className="notice is-error mb-6" role="alert">
          {error}
        </div>
      ) : null}

      <div className="stat-grid mb-6">
        <Stat value={String(graph.pages.length)} label="Pages" />
        <Stat value={String(graph.controls.length)} label="Controls" />
        <Stat value={String(graph.transitions.length)} label="Transitions" />
        <Stat value={String(routes.length)} label="Known routes" />
        <Stat value={lastExplored ? formatRelativeTime(lastExplored) : "never"} label="Last explored" live />
      </div>

      {empty ? (
        <div className="empty-state mb-6">
          <p className="empty-state__title">No pages yet</p>
          <p className="empty-state__text">
            Explore the site to read it in one go, or wait for a visitor&apos;s first question: the
            widget reports every page it scans and every move it sees.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid items-start gap-6 lg:grid-cols-2">
            <PagesPanel graph={graph} />
            <TransitionsPanel graph={graph} />
          </div>
          <div className="mb-6">
            <ControlsPanel graph={graph} />
          </div>
        </>
      )}

      <KnownRoutesPanel graph={graph} routes={routes} />
    </>
  );
}

/** The most recent visit by the explorer, or null when it has never run. */
function latestExplorerVisit(graph: StoredGraph): string | null {
  let latest: string | null = null;
  for (const page of graph.pages) {
    if (page.source !== "explorer" || !page.lastSeen) continue;
    if (latest === null || page.lastSeen > latest) latest = page.lastSeen;
  }
  return latest;
}

function summaryLine(summary: ExploreSummary): string {
  const seconds = Math.round(summary.durationMs / 1000);
  const forms = summary.formsTried > 0 ? `, tried ${count(summary.formsTried, "form")}` : "";
  const skipped = summary.skipped.length > 0 ? ` Skipped ${count(summary.skipped.length, "page")} that would not load.` : "";
  return `Read ${count(summary.pages, "page")} and ${count(summary.controls, "control")}, recorded ${count(
    summary.transitions,
    "transition",
  )} and ${count(summary.reveals, "reveal")}${forms}, in ${seconds}s.${skipped}`;
}

function count(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? "" : "s"}`;
}

function Stat({ value, label, live }: { value: string; label: string; live?: boolean }) {
  return (
    <div className="stat">
      <span className="stat__num" suppressHydrationWarning={live}>
        {value}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
