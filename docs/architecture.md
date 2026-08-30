# Architecture

## The shape of the system

Patchlet is one embeddable script, one Next.js app, one Postgres database, one Python worker, and
one behavioural evidence layer. The evidence layer is PostHog, and the loop runs through it twice.
Before the pull request, PostHog says how many other customers worked around the same gap and what
they did instead. After the launch, PostHog says whether the change actually solved it.

```text
        the customer's product (NovaAir in the demo)
        widget script tag + posthog-js
             |                               |
             | embed key, HTTPS              | events, session recordings
             |                               v
             |                    +----------+----------+
             |                    |  PostHog            |  the evidence, before the pull request
             |                    +----------+----------+
             |                               |
             |                               | HogQL query API,
             |                               | session recording API
             v                               v
        +--------------------------------------------------------------+
        |  apps/web (Next.js)                                          |
        |  /api/chat  /api/escalate  /api/trace  /console              |
        |  lib/agent   lib/posthog   lib/forge                         |
        +------+---------------------+---------------------+-----------+
               |                     |                     |
               v                     v                     v
     +-------------------+ +-------------------+ +-------------------+
     | Supabase Postgres | | OpenAI API        | | GitHub API        |
     | + pgvector        | | chat, embeddings, | | trees, blobs,     |
     | trace_event       | | vision, voice     | | issues, PRs       |
     +-------------------+ +-------------------+ +-------------------+
               |
               v
        +--------------------------------------------------------------+
        |  services/worker (Python), or a Reflex/Runloop sandbox       |
        |  issue -> draft -> draft PR -> human approval -> merge       |
        +------------------------------+-------------------------------+
                                       |
                                       v
                     the deploy lands, the product changes
                                       |
                                       v
                      the customer's product, weeks later
                                       |
                                       | events, session recordings
                                       v
                            +----------+----------+
                            |  PostHog            |  the outcome, after the launch
                            +----------+----------+
                                       |
                                       | adoption, completion, support volume
                                       v
                               apps/web /console
```

Every stage on that path also writes a `trace_event` row, so `/api/trace/stream` replays the whole
story live on the console's Activity page.

Nothing in the browser holds a credential. The widget carries a public embed key that identifies a
project and nothing else; every model, analytics and repository call happens server-side. The
PostHog personal API key stays on the server, and the only PostHog key on the host page is the
customer's own project key in their own `posthog-js` install.

## The evidence loop

The story is not "PostHog data goes in, an AI writes a pull request". It is four stages, always in
this order, and the middle two are Patchlet's own work.

```text
user workflows  ->  inferred intent  ->  semantic capability  ->  verified implementation
```

**1. User workflows.** The host product loads `posthog-js` with session recording and a small
explicit event contract. When the three checks prove a feature is absent, Patchlet asks the second
question: is this one person, or a pattern? It queries PostHog's HogQL endpoint for historical
sessions with similar behaviour and pulls the matching recordings, which gives one row per session
with its ordered steps. That is the raw material: real people already achieving the goal the hard
way. The mining query and the PostHog client are the design for `apps/web/lib/posthog`, being
built on a parallel branch; the compiler already consumes the row shape it returns.

**2. Inferred intent.** `packages/capability` reads each session as a demonstration and recovers
the goal behind it, following OS-Genesis reverse task synthesis. Every step becomes one line of
prose with no model call, then batches of sessions are lifted to one goal each, and a reward model
grades every trajectory on completion and coherence. A session that wandered and then succeeded
scores high on completion and low on coherence, and that pairing is the workaround signal.
Trajectories are kept with a weight rather than filtered to the winners.

**3. Semantic capability.** The same package picks the granularity, using ToolCUA's bottom-up
merging and grounding, and shapes the answer as ASIL does: structured state, semantic actions,
constraints, success criteria. It merges adjacent steps at four levels, scores each candidate on
support, steps replaced, next-state grounding and argument semantics, and takes the largest merge
that is still grounded. That is what yields `seat_party_together`, not `clickSeat` below it and not
`manage_trip` above it. The result is a Capability IR validated against a JSON schema, or a
reasoned `none` when no capability is warranted.

**4. Verified implementation.** The IR, the host repository and the acceptance scenarios go into
isolated sandboxes. Reflex Automations and Personas orchestrate the run, Runloop devboxes hold the
candidates, and Codex does the implementation inside them: read the repository, find the existing
primitives, build the capability and its UI, write tests, fix failures. The verifier persona runs
the scenarios the compiler derived, the winning candidate produces a preview, and a person merges
the draft pull request or does not. This is the `forge` engine, and `apps/web/lib/forge` owns it.

Then PostHog again. The same events that exposed the gap now measure the fix: adoption, completion,
dropoff and support volume, before and after the launch. The answer either closes the loop or
starts the next one.

`docs/capability-compiler.md` is the compiler in full, stage by stage, with the research each stage
credits and the IR field by field. `docs/PLAN.md` is the demo the whole loop is built for.

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

A plan today is built from the affordances of the page in front of the user, so a route that
crosses pages is announced short and then re-planned after each navigation. The design that fixes
it is a site capability graph: discover the product's functional structure once, plan the route
over the graph, and re-bind to real nodes on arrival instead of asking a model again. The graph and
its route planner are being built on a parallel branch; `packages/widget/src/guide` owns the
binding and the spotlight, and `apps/web/lib/agent` owns the planning.

## Escalation

Accepting the offer inserts an `escalation` row for the engine named by `ESCALATION_ENGINE`.

- `local` leaves the row `queued`, and the worker's runner claims it. This is the simple-gap path:
  one process, one issue, one draft pull request.
- `forge` is the Reflex/Runloop engine for capability-scale work: Codex personas building and
  verifying inside isolated sandboxes, driven by the Capability IR that `packages/capability`
  produced. `apps/web/lib/forge` owns it and is in progress on a parallel branch. Until it lands,
  `forge` is a named seam: `POST /api/escalate` answers `503 {error, reason: "engine_unavailable"}`
  when it is selected, and writes nothing, so no run is queued that nobody will claim.

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
list for anything else, so a new event kind never breaks the page. The evidence loop reuses the
same table: the compiler's decision trail arrives as `capability` events, and the sandboxes report
as `candidate` and `preview` events from the `forge` source.

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
