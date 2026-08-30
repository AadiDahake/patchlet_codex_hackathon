import type { TraceEvent } from "@patchlet/shared";
import { formatClock } from "@/lib/console/format";
import { ApprovalCard } from "./ApprovalCard";

type Detail = Record<string, unknown>;

function asDetail(value: unknown): Detail {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Detail) : {};
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * One row of the live trace, rendered by its `kind` and, for artefacts, by which artefact it is.
 * Anything without a shape of its own falls back to a key and value list, so a new event kind from
 * the worker still shows up rather than disappearing.
 */
export function TraceRow({
  event,
  escalationId,
  onDecision,
}: {
  event: TraceEvent;
  escalationId: string | null;
  onDecision: () => void;
}) {
  const detail = asDetail(event.detail);
  const artifact = str(detail.artifact);
  const tone =
    event.status === "failed"
      ? "is-failed"
      : event.status === "running"
        ? "is-running"
        : event.kind === "pause"
          ? "is-pause"
          : event.kind === "artifact"
            ? "is-artifact"
            : "";

  return (
    <article className={`trace-row ${tone}`.trim()}>
      <div className="trace-row__head">
        <span className="trace-row__kind">{artifact ?? event.kind}</span>
        <h3 className="trace-row__title">{event.title}</h3>
        <span className="trace-row__time">{formatClock(event.createdAt)}</span>
      </div>
      <Body
        kind={event.kind}
        artifact={artifact}
        detail={detail}
        escalationId={escalationId}
        onDecision={onDecision}
      />
    </article>
  );
}

function Body({
  kind,
  artifact,
  detail,
  escalationId,
  onDecision,
}: {
  kind: TraceEvent["kind"];
  artifact: string | null;
  detail: Detail;
  escalationId: string | null;
  onDecision: () => void;
}) {
  if (kind === "probe") return <ProbeBody detail={detail} />;
  if (kind === "verdict") return <VerdictBody detail={detail} />;
  if (kind === "model") return <ModelBody detail={detail} />;
  if (kind === "tool") return <KeyValues detail={detail} keys={["tool", "transport", "args_summary", "result_summary"]} />;
  if (kind === "pause") {
    return (
      <ApprovalCard
        label={str(detail.label) ?? "Merge this pull request?"}
        escalationId={escalationId}
        onDecision={onDecision}
      />
    );
  }
  if (kind === "artifact") {
    if (artifact === "issue_draft") return <DraftBody detail={detail} />;
    if (artifact === "issue") return <LinkBody detail={detail} label="Open issue" />;
    if (artifact === "pr") return <LinkBody detail={detail} label="Open pull request" showBranch />;
    if (artifact === "diff") return <DiffBody detail={detail} />;
    if (artifact === "deployment") return <LinkBody detail={detail} label="Open the deployment" />;
  }
  return <Fallback detail={detail} />;
}

function ProbeBody({ detail }: { detail: Detail }) {
  const score = num(detail.score);
  const hit = detail.hit === true;
  const summary = str(detail.summary);
  const evidence = Array.isArray(detail.evidence) ? detail.evidence : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`outcome-badge ${hit ? "is-good" : "is-muted"}`}>
          {hit ? "found" : "nothing"}
        </span>
        {score !== null ? (
          <>
            <span className="trace-score">{score.toFixed(2)}</span>
            <span className="trace-meter">
              <span
                className="trace-meter__fill"
                style={{ width: `${Math.round(Math.min(Math.max(score, 0), 1) * 100)}%` }}
              />
            </span>
          </>
        ) : null}
        {num(detail.latencyMs) !== null ? (
          <span className="trace-row__aside">{num(detail.latencyMs)} ms</span>
        ) : null}
      </div>
      {summary ? <p className="trace-row__text">{summary}</p> : null}
      {evidence.length > 0 ? <Evidence items={evidence} /> : null}
    </>
  );
}

function Evidence({ items }: { items: unknown[] }) {
  return (
    <ul className="trace-files">
      {items.slice(0, 5).map((item, index) => {
        const row = asDetail(item);
        const title =
          str(row.documentTitle) ?? str(row.path) ?? str(row.name) ?? str(row.heading) ?? `Item ${index + 1}`;
        const note =
          str(row.snippet) ?? str(row.heading) ?? (num(row.matches) !== null ? `${num(row.matches)} matches` : null);
        const score = num(row.similarity) ?? num(row.score);
        return (
          <li key={index}>
            <code>{title}</code>
            {note ? <span>{note}</span> : null}
            {score !== null ? <span>score {score.toFixed(2)}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

function VerdictBody({ detail }: { detail: Detail }) {
  const outcome = str(detail.outcome);
  const confidence = num(detail.confidence);
  const reasoning = str(detail.reasoning);
  const feature = str(detail.feature);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {outcome ? (
          <span className={`outcome-badge ${outcome === "answer" ? "is-good" : outcome === "absent" ? "is-bad" : "is-wait"}`}>
            {outcome}
          </span>
        ) : null}
        {feature ? <span className="trace-row__aside is-plain">{feature}</span> : null}
        {confidence !== null ? (
          <span className="trace-score">confidence {confidence.toFixed(2)}</span>
        ) : null}
      </div>
      {reasoning ? <p className="trace-row__text">{reasoning}</p> : null}
    </>
  );
}

function ModelBody({ detail }: { detail: Detail }) {
  const files = Array.isArray(detail.files) ? detail.files : [];
  return (
    <>
      <KeyValues detail={detail} keys={["model", "purpose", "input_summary", "output_summary"]} />
      {files.length > 0 ? (
        <ul className="trace-files">
          {files.map((file, index) => {
            const row = asDetail(file);
            return (
              <li key={index}>
                <code>{str(row.path) ?? "file"}</code>
                {str(row.reason) ? <span>{str(row.reason)}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );
}

function DraftBody({ detail }: { detail: Detail }) {
  return (
    <div className="trace-doc">
      <h4>{str(detail.title) ?? "Draft issue"}</h4>
      {str(detail.body) ? <p>{str(detail.body)}</p> : null}
    </div>
  );
}

function LinkBody({
  detail,
  label,
  showBranch = false,
}: {
  detail: Detail;
  label: string;
  showBranch?: boolean;
}) {
  const url = str(detail.url);
  const number = num(detail.number);
  const branch = str(detail.branch);

  return (
    <>
      {showBranch && branch ? (
        <p className="trace-row__text">
          Branch <code className="mono">{branch}</code>
        </p>
      ) : null}
      <div className="trace-links">
        {url ? (
          <a className="trace-link" href={url} target="_blank" rel="noreferrer">
            {label}
            {number !== null ? ` #${number}` : ""}
            <span aria-hidden>&rarr;</span>
          </a>
        ) : (
          <span className="trace-row__text">No link was recorded.</span>
        )}
      </div>
    </>
  );
}

function DiffBody({ detail }: { detail: Detail }) {
  const files = Array.isArray(detail.files) ? detail.files : [];
  if (files.length === 0) return <Fallback detail={detail} />;

  return (
    <div className="grid gap-3">
      {files.map((file, index) => {
        const row = asDetail(file);
        const patch = str(row.patch) ?? "";
        return (
          <div className="trace-diff" key={index}>
            <div className="trace-diff__path">{str(row.path) ?? "file"}</div>
            <pre className="trace-diff__body">
              {patch.split("\n").map((line, lineIndex) => (
                <span key={lineIndex} className={`trace-diff__line ${diffTone(line)}`}>
                  {line === "" ? " " : line}
                </span>
              ))}
            </pre>
          </div>
        );
      })}
    </div>
  );
}

function diffTone(line: string): string {
  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) return "is-meta";
  if (line.startsWith("+")) return "is-add";
  if (line.startsWith("-")) return "is-del";
  return "";
}

function KeyValues({ detail, keys }: { detail: Detail; keys: string[] }) {
  const rows = keys
    .map((key) => [key, detail[key]] as const)
    .filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (rows.length === 0) return null;

  return (
    <dl className="trace-kv">
      {rows.map(([key, value]) => (
        <div key={key}>
          <dt>{key.replace(/_/g, " ")}</dt>
          <dd>{typeof value === "string" ? value : JSON.stringify(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Fallback({ detail }: { detail: Detail }) {
  const entries = Object.entries(detail).filter(([key]) => key !== "artifact");
  if (entries.length === 0) return null;
  return (
    <dl className="trace-kv">
      {entries.slice(0, 8).map(([key, value]) => (
        <div key={key}>
          <dt>{key.replace(/_/g, " ")}</dt>
          <dd>{typeof value === "string" ? value : JSON.stringify(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
