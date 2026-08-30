# Contributing to Patchlet

Guidance for anyone working in this repository, human or automated. Read `docs/contracts.md`
before changing anything that crosses a boundary.

## Layout

| Path | Owns |
|---|---|
| `packages/shared` | Types and pure helpers shared by the widget, the web app and the tests. Zero runtime dependencies. |
| `packages/capability` | The capability compiler: user workflows in, a validated Capability IR out. Pure TypeScript; see "The capability compiler stays pure". |
| `packages/widget` | The embeddable script. Builds to a single IIFE at `dist/patchlet.js`, copied into `apps/web/public/widget.js`. |
| `apps/web` | The Next.js dashboard: landing page, console, and every HTTP route. |
| `services/worker` | The Python escalation worker. Independent toolchain (`uv`), independent tests. |
| `supabase/migrations` | Schema. Additive migrations only after the first release. |
| `scripts` | Node maintenance scripts run through the root `package.json`. |
| `docs` | The plan, architecture, contracts, demo notes, deploy notes. |

`docs/PLAN.md` is what the product is for. Read it before changing anything a demo beat depends on.

## The contracts file

`docs/contracts.md` holds the data model, the shared TypeScript types, the HTTP API, the agent's
behaviour and the model ids. Several parts of the system are built against it in parallel, so it
wins over local preference. If you need to change a contract, change `docs/contracts.md` and the
code that depends on it in the same commit.

## One provider, two modules

Every model call in `apps/web` goes through `apps/web/lib/openai.ts`, and every model call in the
worker goes through `services/worker/steps/llm.py`. Model ids live in `@patchlet/shared` (`MODELS`,
`EFFORT`) and in `steps/llm.py`, nowhere else, so changing a model is one edit and the provider
stays swappable. Section 5 of `docs/contracts.md` records each choice, the reason and the date.

Tests never reach the network. Mock the provider at the module boundary, as
`apps/web/test/openai.test.ts` does with the `openai` package itself.

## Who a request belongs to

An account owns exactly one project (`project.owner_id`), and that project is the whole tenant:
its sources, conversations, escalations, trace and repository binding.

- Console routes and pages resolve the caller through `apps/web/lib/console/current.ts` and scope
  every query to the project id it returns. Never resolve a project any other way there.
- Widget routes (`/api/chat`, `/api/escalate`, `/api/transcribe`, `/api/speak`, and the widget's
  escalation poll) resolve by the public `embed_key` instead, because they run on a customer's
  site with no session.
- The worker scopes by `escalation.project_id` and prefers the project's linked GitHub token over
  `GITHUB_TOKEN` (`services/worker/steps/github_token.py`).

## An engine that cannot run refuses at the boundary

`ESCALATION_ENGINE` names what builds the change. `local` is the worker's runner. `forge` is the
Reflex/Runloop engine and is a named seam: `POST /api/escalate` answers `503` and writes nothing
rather than queueing a row no runner will claim. Any engine added later follows the same rule -
refuse before the first write, never after it.

## The capability compiler stays pure

`packages/capability` has one rule: no network, no database, no framework imports. It never
imports Supabase, Next, the `openai` package or `fetch`. Trajectories go in, a validated IR comes
out, and the model is an injected `ModelClient` interface that the caller supplies. That is what
makes every test in the package run offline against `test/fixtures/sessions.json`, and what makes
`npm run compile -- --fixtures` demonstrable with no key and no database. The four stages, the
research each one credits, and the IR fields are in `docs/capability-compiler.md`.

## TypeScript

- `strict: true` everywhere, inherited from `tsconfig.base.json`. No `any` in checked-in code.
- Prefer narrow types at boundaries and widen inwards, not the other way round.
- Shared types live in `@patchlet/shared`. Do not redeclare them locally.

## Model output is untrusted

Anything a model returns is input from outside the system. Validate and coerce it at the boundary,
never cast it. Concretely:

- Parse JSON responses into a checked shape before use; on a mismatch, degrade (drop the steps, keep
  the prose) rather than throwing at the user.
- A step plan is only valid if every `target` is an affordance id the widget actually sent, which is
  what `validatePlan` enforces. Ids are opaque handles, never selectors.
- Never interpolate model output into SQL, a shell command, or a file path. The worker's file
  applier guards against path traversal for exactly this reason.
- Never render model output as HTML.

## Guiding a user on their own page

The widget watches the host page; it never drives it. Two rules keep that honest, and both have
regression tests in `packages/widget/test/machine.test.ts`:

- A control that disappears within 1.5 s of the user pressing it counts as that step succeeding.
  Menus and dialogs dismiss on `pointerdown` and unmount their trigger, so the `click` that would
  have confirmed the action never has a node to fire on.
- Nothing is ever bound or drawn against an empty or off-screen rect (`guide/geometry.ts`). A
  detached node still answers `getBoundingClientRect` with zeros, and a caption anchored to one
  lands in the top-left corner pointing at nothing. Treat it as lost and re-plan instead.

Re-planning mid-walkthrough goes to `POST /api/chat` with `continueFrom`, which takes the fast path
in `apps/web/lib/agent/continue.ts`: one small model call over the stored answer and its grounding,
no understanding, probes or verdict.

## When the widget speaks

Never in text mode. The microphone in the composer is dictation: it types the question and the
answer comes back as text. Audio only plays during a call, and `ui/call.ts` is the one place that
decides it (`shouldSpeak`, `shouldListen`); the recorder and the player know nothing about calls
and are driven from those two answers. Both the call machine and the event-to-status mapping in
`ui/status.ts` are pure and covered by `packages/widget/test/call.test.ts` and `status.test.ts`.

The status line under the typing dots comes from real `probe` and `verdict` events, but it is
paced: the three checks run in parallel and land together, so without a dwell the line would jump
from the first stage to the last.

## Secrets

No literal secrets anywhere, including tests and fixtures. Every credential is read from the
environment through a typed accessor (`apps/web/lib/env.ts`) that fails with the variable's name
when it is missing. `.env.example` lists names and one-line descriptions only. The widget and the
console pages never see an API key; the only public identifier is the project's embed key.

## Style

- Small files, one concern each. If a file needs a section comment to be navigable, split it.
- Clear names over short names. Comments explain why, not what.
- No em dashes. Use a plain dash.
- Status is text, not a coloured pill. See the design notes in `docs/architecture.md`.
- Every colour, radius, shadow and blur is a token in `apps/web/app/globals.css`; the widget has
  its own copy in `packages/widget/src/styles.ts`. Use the classes there rather than styling a
  page on its own, and never write a literal colour in a component.

## Commits

Conventional Commits, imperative subject, no trailers of any kind.

```
feat(widget): spotlight the resolved control
fix(web): keep the trace stream open across reconnects
docs: describe the escalation contract
```

## Running things

```bash
npm install
npm run dev          # dashboard on http://localhost:3000
npm run build        # widget, then copy, then web
npm run typecheck    # must pass before you push
npm test             # must pass before you push
npm run db:migrate   # apply supabase/migrations/*.sql in order
npm run db:seed      # idempotent seed, prints the embed key when it creates one
node scripts/screenshots.mjs pages <dir> name=url...   # 1440x900 captures, private headless Chromium
```

Screenshots come from `scripts/screenshots.mjs` (Playwright, one private browser per run), never
from a shared browser session. `docs/screenshots/` holds the captures a pull request refers to.

Anything that needs credentials expects them in the environment. Supply them with your own secret
manager rather than a file in the working tree.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`. Two jobs run in
parallel. `web` uses Node 22 and runs `npm ci`, `npm run typecheck`, `npm run lint`, `npm test` and
`npm run build`. `worker` uses Python 3.12 with `uv` and runs `uv sync --frozen` and
`uv run --frozen pytest` in `services/worker`. Both jobs run with no secrets, so a fork's pull
request is checked the same way as a branch; if a change makes the build need a variable, give it a
safe placeholder in the workflow and teach the code to treat that placeholder as "not configured".
One concurrency group per ref cancels the run a new push supersedes.

Run the same commands locally before you push:

```bash
npm ci && npm run typecheck && npm run lint && npm test && npm run build
cd services/worker && uv sync --frozen && uv run --frozen pytest
```

A dev run leaves the tree clean, and it has to stay that way: `next dev` must end with
`git status --porcelain` empty. Next generates `apps/web/next-env.d.ts` on both `next dev` and
`next build` and writes a different path into it for each, so the file is generated, not committed.

## Maintaining this file

Keep this file short and durable. Record only what almost every future contributor needs. For
anything the codebase already states, link to the authoritative file or command instead of copying
the detail here. Update it in the same commit as the change it describes.
