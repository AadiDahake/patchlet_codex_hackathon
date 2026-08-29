# The forge engine

`forge` is the escalation engine for capability-scale work. It takes a compiled capability
specification and a target repository, has Codex build and verify the capability in isolated
sandboxes through three personas, keeps the candidate that verified best, serves its preview, and
opens a draft pull request for a person to approve. Nothing it does touches the target
repository's default branch. The code lives in `apps/web/lib/forge`.

## Strategies

One engine, three places a candidate can be built. The engine only knows the `SandboxStrategy`
interface in `strategy.ts`; every strategy writes the same trace, the same candidate rows, and
the same pull request.

| Strategy | Where the personas run | When it is used |
|---|---|---|
| `reflex` | Reflex agents, launched from the three personas by id. Each persona runs in a devbox seeded from a snapshot of the previous one. | The primary path. Selected when `REFLEX_API_KEY` is set. |
| `runloop` | A Runloop devbox per candidate, created by the engine with a code mount of the repository and the Codex CLI installed, driven with `codex exec --json`. | When `RUNLOOP_API_KEY` is set and no Reflex key is. |
| `local` | A git worktree on this machine, with the machine's own `codex` on its saved login, `npm test` locally and `next start` on a free port. | Development, and the fallback when no key is present. |

`FORGE_STRATEGY` selects one explicitly. Without it, the keys that are present decide: Reflex,
then Runloop, then local. `forgeAvailability()` in `config.ts` checks the selected strategy's
variables before anything is written; `POST /api/escalate` and the forge route answer `503
engine_unavailable` when it cannot run.

### Reflex

The three personas are created once in the Reflex web app, from the prompts in
`apps/web/lib/forge/prompts/*.md`, and their `prs_...` ids go in `REFLEX_PERSONA_CAPABILITY_BUILDER`,
`REFLEX_PERSONA_UX_BUILDER` and `REFLEX_PERSONA_CAPABILITY_VERIFIER`. Every call carries
`x-organization-id` (`REFLEX_ORGANIZATION_ID`, default `doing_something`) and the `rfx_` key.

One candidate is a chain of three agents (`reflex.ts`):

1. `POST /agent-personas/{builder}/launch` with the run's prompt, `repoSlug` and `repoBranch`.
   The launch prompt carries the specification, the trajectories and the acceptance criteria
   inline and tells the persona to write them under `.patchlet/` first.
2. The agent's events are read from `GET /agents/{id}/stream?fromSeq=` and written to the trace
   until the agent reaches a terminal status. One `needs_input` is answered with a nudge; a second
   stops the agent and fails the candidate.
3. `POST /agents/{id}/snapshots` captures the disk. Reflex ends the run and shuts that box down.
   The UX Builder launches from its persona with `sandboxOptions.snapshotId`; the Verifier the
   same way after it. Peak devboxes per candidate: one.
4. The Verifier's devbox stays up. The repository's own tests, the preview build and server, the
   push and `gh pr create` run on it through the Runloop API (`RunloopSandbox` on the agent's
   `devboxId`), which is the one thing Reflex does not expose on an agent. The preview URL is the
   agent's `tunnelKey`. `RUNLOOP_API_KEY` is therefore required beside the Reflex key.

Teardown stops the agent, shuts the devbox down and deletes the run's snapshots.

### Runloop

`runloop.ts` creates a `LARGE` devbox per candidate: a code mount of the repository with the
GitHub token and `npm ci`, `npm i -g @openai/codex@0.151.0` in `launch_commands` (or a blueprint
named by `RUNLOOP_BLUEPRINT` that already carries it), `keep_alive_time_seconds` of one hour,
`metadata.patchlet_candidate` for the sweeper, and a tunnel with `auth_mode: "open"`. Codex runs
as `codex exec --sandbox workspace-write -c sandbox_workspace_write.network_access=true
--skip-git-repo-check --json -m gpt-5.6-sol -C <repo> -o <file>` with the prompt on stdin. The
model key reaches the box as `PATCHLET_OPENAI_KEY` and is handed to the Codex process alone as
`CODEX_API_KEY` on that one command. If Codex's own Landlock sandbox cannot start inside the
container, the run is retried with `--dangerously-bypass-approvals-and-sandbox` and a `status`
event says so; the devbox is the sandbox. The preview is `next build && next start` bound to
`0.0.0.0:3000`; the tunnel URL is health-checked before it is announced. The branch is pushed with
the token the code mount installed and the pull request is opened with `gh pr create --draft`.

`npm run forge:sweep` lists every devbox tagged by the engine that is still alive and shuts it
down. Run it after a crash.

### Local

`local.ts` clones the repository once into `FORGE_LOCAL_CACHE_DIR` (default
`<tmpdir>/patchlet-forge`), fetches and installs it once per run, and gives each candidate a
`git worktree` on its own branch with the clone's `node_modules` through a symlink. Codex is the
machine's `codex`; without `OPENAI_API_KEY` it runs on the saved login. The dependency tree is
added to Codex's writable roots so a test runner can write its cache. The preview is `next start`
on a free port. The push always goes to `https://github.com/<owner>/<name>.git`, never to the
clone's source, so a run against a local checkout (`--source`) cannot push into it.

## Personas

`personas.ts` holds the three personas as data in the shape Reflex's `AgentPersona` uses: name,
agent type, system prompt, model `gpt-5.6-sol`, sandbox size `LARGE`, blueprint name, environment
variable names. The prompts are Markdown in `prompts/`:

- **Capability Builder** finds the existing primitives, composes them into one library function
  and one API route, writes no UI, keeps the existing tests green, deletes a test whose only
  purpose was to assert the capability is absent.
- **UX Builder** continues the builder's thread (`codex exec resume`) and implements the
  product-native interface at `proposed_ui.location` with the repository's own components.
- **Capability Verifier** writes one test per scenario in `success.scenarios`, runs the suite,
  and reports per scenario as JSON. Its final message is constrained by `--output-schema`
  (`VERIFIER_REPORT_SCHEMA`). It fixes nothing.

Every persona receives `.patchlet/spec.json` (the IR), `.patchlet/trajectories.json`,
`.patchlet/acceptance.md` (rendered from the IR's postconditions, constraints, preferences and
scenarios), and the target repository's `AGENTS.md` when it has one. Each prompt carries an
"Authority" section: the specification is a product decision backed by real sessions and reviewed
by a person, so it supersedes a repository rule that exists only to keep the capability absent
(NovaAir's `AGENTS.md` tells an agent to raise group seating rather than add it, and its guard test
bans the names). Every other rule of the repository stands. Without that section the first live
run's Capability Builder obeyed the guard and changed nothing. The two candidates get one
line each that differs: candidate A is told to prefer the most direct composition, candidate B to
enumerate every result and rank it. The verifier decides between them.

## The pipeline

`engine.ts` runs steps 8 to 18 of the evidence loop and writes every step as a `trace_event`
with `source: "forge"`.

| Step | What happens | Trace |
|---|---|---|
| 8 | The escalation moves to `drafting`. | `status` "Forge started" |
| 9 | Two candidates provision in parallel (`Promise.all`). | `candidate` "Candidate A provisioning", "Candidate B provisioning" |
| 10 | Capability Builder. Every `item.completed` command becomes a `tool` row, every `file_change` an `artifact`. | `tool`, `artifact`, `model` rows prefixed with the persona |
| 11 | UX Builder, in the same sandbox, resuming the builder's thread. | same |
| 12 | Capability Verifier, then the repository's own `npm test -- --reporter=json`. `verify.ts` scores against the specification's scenario ids: a scenario the verifier did not report counts as failed. | `candidate` "Candidate A: 18/21", "Candidate B: 21/21", detail holds the failing ids |
| 13 | `select.ts`: highest scenarios passed, tie-break on fewest changed files. | `decision` "Selected candidate B, 21/21" |
| 14 | The winner builds and serves; the URL is health-checked. | `preview` "Preview live" with `{url, candidate}` |
| 15 | The loser's sandbox is torn down. | `status` "Candidate A torn down" |
| 16 | Branch pushed, draft pull request opened with the body from `pr.ts`. | `tool` "Pushed ...", `artifact` "Draft PR #182" |
| 17 | Pause for a person. | `pause` "Approve & merge?" |
| 18 | On approval: mark ready, squash merge, watch the Vercel deployment (`deploy.ts`), tear the winner down. On rejection: close the pull request, tear the winner down. | `status` rows, `artifact` "Deployment is live" |

A candidate that fails at any step tears its own sandbox down and the other continues. When no
candidate finishes, or the winner's preview cannot be built, the run fails and every sandbox is
torn down in a `finally`. On success only the winner's sandbox stays up, on purpose: it is the
preview and the branch until the decision. Its handle (devbox id and tunnel key, or the local
path and port) is on the candidate row, never a URL: `GET /api/forge/:id/preview` rebuilds the URL
and health-checks it on every read, and answers `null` once the box is gone.

## The trust boundary

- The engine never checks out, commits to, or pushes the default branch. Every candidate works on
  `patchlet/<intent>-<label>`; the pull request is a draft; a person approves it in the console.
- Model output is untrusted. The verifier's report is parsed into a checked shape; an unknown
  scenario id is ignored and a missing one counts as failed. Codex's JSONL is narrowed by
  `asThreadEvent` before it is read.
- The model key is never in a command line or a trace row. Under Runloop it is an environment
  variable of the box, expanded by the box's shell for the Codex process only. Under Reflex the
  organization holds the key and Patchlet hands nothing over. The GitHub token reaches `git`
  through a credential helper that reads it from the environment.
- `.patchlet/` (the specification, the prompts, the reports) never travels with the change: the
  commit excludes it and the changed-file list drops it.
- An open tunnel exposes every port on the box. The preview is a built app with nothing else
  listening, and the box lives at most `keep_alive_time_seconds`.

## Why two candidates

A Runloop trial allows three running devboxes. The plan's picture has two candidates, a UX
Builder and a Verifier at once, which is four. The engine runs two candidates in parallel and the
UX Builder and the Verifier as later personas inside each candidate's own sandbox. That keeps the
peak at two boxes with one slot spare, and it is more honest: the interface and the verification
belong to the candidate they judge. Two `LARGE` boxes for thirty minutes cost about $0.42.

## Running it locally

```bash
# offline: the engine end to end with a fake strategy replaying recorded Codex output
npm test

# for real, on this machine, against a clone of the target repository
npm run forge:local -- --spec apps/web/lib/forge/fixtures/seat-party-together.ir.json
npm run forge:local -- --spec <ir.json> --repo AadiDahake/novaair --base main --no-push --hold 120
npm run forge:local -- --spec <ir.json> --source ~/workspace/projects/novaair --base fm/nova-site --no-push

# clean up devboxes a crash left behind
npm run forge:sweep
```

`--no-push` stops before the push and prints the branch, the changed files and the pull request
body that would have been opened. `--hold <seconds>` keeps the winner's preview up before tearing
it down; `--keep` leaves it up. `--trace-out <path>` writes every trace row as JSON lines.

From the console: `POST /api/opportunities/:groupId/forge` starts a run for the group's latest
compiled specification (or the `spec` in the body while none is stored), answers `202` with the
escalation id, and the run continues after the response. `GET /api/forge/:escalationId` lists the
candidates; `GET /api/forge/:escalationId/preview` gives the live preview URL or `null`. Approval
goes through the existing `POST /api/escalations/:id/approve`, which under `forge` merges, watches
the deployment and tears the winner down after it answers.

The run continues after the HTTP response through `after()` from `next/server`. On a laptop
running `next dev` or `next start` that is the whole story. On a hosted deployment the function's
maximum duration bounds it, so a hosted console starts the run and a long-lived process should
carry it; the engine takes explicit dependencies (`buildForgeDeps`) so that process can be a
script, as `forge-local.ts` is.
