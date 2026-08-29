# Architecture

## The shape of the system

Patchlet is one embeddable script, one Next.js app, one Postgres database and one Python worker.

```
host page --script--> widget (shadow DOM)
widget  --HTTPS/embed key--> apps/web API routes
apps/web --> Supabase Postgres (pgvector) | OpenAI API | GitHub API
apps/web --escalation--> escalation row --> services/worker
services/worker --> GitHub (issue, branch, draft PR, merge) --> Vercel deploy
everything --> trace_event rows --> /api/trace/stream --> console Activity page
```

Nothing in the browser holds a credential. The widget carries a public embed key that identifies a
project and nothing else; every model and repository call happens server-side.

## One chat turn

A question travels through a fixed pipeline. Every stage emits an SSE `ChatEvent` to the widget and
writes a `trace_event` row so the console can replay the same reasoning live.

1. **Understand.** A small fast model extracts `{intent, feature, keywords[]}`. `feature` is the
   short noun phrase the user is asking about, which is what the later stages search for.
2. **Three probes, in parallel.** Each answers "does this exist?" from a different angle.
   - `docs` ("Checking the documentation") embeds the question and searches the project's chunks
     with `match_chunks`. A scanned passage is discounted by how legibly the reader saw it, so a
     blurry scan cannot outvote clean text.
   - `interface` ("Looking at this page") is pure local matching of the keywords against the
     affordances the widget scanned off the live page. No model call, so it is fast and
     deterministic.
   - `repository` ("Checking known product capabilities") ranks the repository's file paths by
     keyword, reads the best candidates, and counts occurrences. The key stays `repository`; the
     user-facing label names the capability, because a customer is asking what the product can do,
     not what is in a source tree.
3. **Route.** `routeProbes` decides without a model where it can: a documentation or interface hit
   means `answer`, a repository-only hit means `hedge`. When all three come back empty a reasoning
   model is asked to confirm absence, and only then does the turn become `absent`.
4. **Answer.** For `answer`, a larger model returns prose plus a step plan whose targets must be
   affordance ids the widget actually sent. `validatePlan` rejects the whole plan if any id is
   unknown or any caption is too long, in which case the prose survives and the steps are dropped.
   For `absent`, the model drafts a `FeatureRequest` and the widget offers to file it.

The three probes are the product. Answering confidently is easy; proving absence is what earns the
right to open a pull request.

## Escalation

Accepting the offer inserts an `escalation` row for the engine named by `ESCALATION_ENGINE`.

- `local` leaves the row `queued`, and the worker's runner claims it. This is the simple-gap path:
  one process, one issue, one draft pull request.
- `forge` is the Reflex/Runloop engine for capability-scale work: Codex personas building and
  verifying inside isolated sandboxes. It is a named seam and nothing more today.
  `POST /api/escalate` answers `503 {error, reason: "engine_unavailable"}` when it is selected, and
  writes nothing, so no run is queued that nobody will claim.

The dashboard never needs to know which engine ran. Every engine writes the same statuses and the
same trace events, so the console renders them identically.

The run files the issue, inspects the repository, drafts the implementation, runs the target
repository's own typecheck and build as gates, opens a draft pull request, and then **pauses on a
human decision**. The console writes `escalation.approval`; approval merges and watches the
deployment until it is live.

## Tracing

`trace_event` is an append-only log with a `bigserial` id that doubles as the SSE cursor. The
console backfills from `GET /api/trace` and then follows `GET /api/trace/stream`, which polls
Postgres, honours `Last-Event-ID`, and closes cleanly on a timer so `EventSource` reconnects on its
own. Because both the request path and the worker write to the same table, the console shows one
continuous story from the user's question to the live deployment.

Event `detail` payloads are free-form JSON. The console renders known shapes specially (probes with
scores, diffs with per-line colouring, the pause as an approve card) and falls back to a key/value
list for anything else, so a new event kind never breaks the page.

## Data

Postgres with `pgvector`. One `project` row per customer, `document` and `chunk` for the knowledge
base, `conversation` and `message` for chat history, `escalation` for the build pipeline, and
`trace_event` for everything observable. Row level security is enabled on every table with no
policies; the application only ever connects with the service role, which bypasses it. See
`docs/contracts.md` for the full schema.

## Design system

The dashboard and the widget share one visual language: liquid glass, minimal, clean.

- Backdrop: a very light warm gradient. Panels are translucent white with a blur, one hairline
  border, 16 px radius, and generous spacing. No decorative gradients inside a panel.
- Type: Inter. Body 14 to 16 px, headings 24 to 32 px at weight 500.
- One accent, `#FA500F`, used for the primary action and the spotlight ring and nothing else.
- Status is text, not a coloured pill.
- Motion only where it carries information, and it honours `prefers-reduced-motion`.

It has to read on a projector, so nothing smaller than 14 px and real contrast throughout. The
tokens and utility classes live in `apps/web/app/globals.css`; the widget carries its own copy in
its shadow root so it can never inherit or leak host styles.
