# Patchlet

[![CI](https://github.com/AadiDahake/patchlet_codex_hackathon/actions/workflows/ci.yml/badge.svg)](https://github.com/AadiDahake/patchlet_codex_hackathon/actions/workflows/ci.yml)

**Patchlet turns repeated customer workarounds into verified product PRs.**

Patchlet is a support agent a company embeds in the corner of its own web app. Three things make it
different from a support chatbot.

1. **It shows the user on their own screen.** The widget reads the host page's DOM, the agent
   resolves the answer to real controls, and the widget spotlights them step by step.
2. **When a feature does not exist, it gets built.** The agent proves absence across three checks -
   help documentation, the current interface, and the product capabilities that are known to exist -
   apologises, and offers to report it. Accepting starts a run that files a GitHub issue, drafts the
   implementation, opens a draft pull request, pauses for a human, and after approval merges so the
   live site changes.
3. **Nothing is lost when the user says no.** Every gap the agent finds is grouped with every other
   report of the same gap and filed anyway, at the bottom of the pile. The more people run into it,
   the higher it rises, and once it has real weight behind it the change gets drafted without anyone
   asking twice.

Behind the second point sits the evidence loop, and it runs in four stages. **User workflows**: real
sessions and replays from PostHog, where customers already reached the goal the hard way. **Inferred
intent**: the goal behind each session, recovered from the trajectory. **Semantic capability**: one
capability at the right granularity, not a list of clicks. **Verified implementation**: Codex builds
and verifies it inside isolated Runloop sandboxes, and a human approves the pull request. Then
PostHog again, after the launch, to say whether the change worked. `docs/PLAN.md` is the full plan
and the demo it is built for.

The sponsors are infrastructure. **PostHog** supplies the behavioural evidence before and after the
change. **Codex** is the implementation intelligence. **Reflex / Runloop** gives Codex isolated,
repeatable environments. Patchlet owns the system between them.

The demo host app is **NovaAir**, a consumer airline website, deployed separately and embedding the
widget with a single script tag.

## Architecture

```text
              host page (NovaAir)
              +-----------------------------------------------+
              |  <script src=".../widget.js"                  |
              |          data-key="pk_...">                   |
              |  posthog-js: events + session recording       |
              |                                               |
              |      +---------------------------------+      |
              |      |  Patchlet widget (shadow DOM)   |      |
              |      |  chat, three checks,            |      |
              |      |  spotlight overlay, voice       |      |
              |      +----------------+----------------+      |
              +-----------------------+-----------------+-----+
                                      |                 |
                                      |                 | events, session recordings
               HTTPS, embed key, CORS |                 v
                                      |      +----------+----------+
                                      |      |  PostHog            |  the evidence, before the PR
                                      |      +----------+----------+
                                      |                 | HogQL query + session recording API:
                                      |                 | the trajectories behind the gap
                                      v                 v
        +--------------------------------------------------------------+
        |  apps/web  (Next.js, Vercel project `patchlet-codex`)        |
        |                                                              |
        |  /api/chat  SSE   understand -> 3 probes -> verdict          |
        |                   -> answer + step plan                      |
        |  /api/escalate    starts the escalation engine               |
        |  /api/trace       + /api/trace/stream (console live)         |
        |  /api/documents   ingest, read, embed                        |
        |  /console         overview, knowledge, repository, activity  |
        |                                                              |
        |  lib/posthog  trajectories   packages/capability  the IR     |
        |  lib/agent    the chat turn  lib/forge            sandboxes  |
        +------+---------------------+---------------------+-----------+
               |                     |                     |
               v                     v                     v
     +-------------------+ +-------------------+ +-------------------+
     | Supabase Postgres | | OpenAI API        | | GitHub API        |
     | + pgvector        | | chat, embeddings, | | trees, blobs,     |
     | trace_event       | | vision, STT, TTS  | | issues, PRs       |
     +-------------------+ +-------------------+ +-------------------+
               |
               v
        +--------------------------------------------------------------+
        |  the escalation engine                                       |
        |  local:  services/worker (Python, uv), one process           |
        |  forge:  Reflex personas running Codex in Runloop sandboxes  |
        |  file issue -> draft -> draft PR -> human approval -> merge  |
        +------------------------------+-------------------------------+
                                       |
                                       v
                       the deploy lands, NovaAir changes
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

The loop passes through PostHog twice: the host product sends it events and session recordings,
Patchlet queries it for the trajectories behind a gap, and after the launch it queries it again for
the outcome. Between those two reads sit four stages, always in this order.

```text
user workflows           PostHog sessions and replays on the host product
inferred intent          OS-Genesis reverse task synthesis      packages/capability
semantic capability      ToolCUA granularity, ASIL-shaped IR    packages/capability
verified implementation  Reflex personas run Codex in Runloop sandboxes, then a human-approved PR
the outcome              PostHog again: adoption, completion, support volume
```

`docs/architecture.md` walks the loop stage by stage; `docs/capability-compiler.md` is the compiler
in full.

## Repository layout

```
README.md                 this file
AGENTS.md                 conventions for anyone contributing here
package.json              npm workspaces: packages/*, apps/*
tsconfig.base.json        shared strict TypeScript options
docs/                     PLAN.md, architecture.md, contracts.md, demo.md, deploy.md
packages/shared/          @patchlet/shared - types and pure helpers, zero runtime deps
packages/widget/          @patchlet/widget - Vite library build -> dist/patchlet.js
apps/web/                 @patchlet/web - Next.js landing, console, and API routes
services/worker/          Python worker: the escalation runner
supabase/migrations/      SQL migrations, applied by scripts/db-migrate.mjs
scripts/                  db-migrate.mjs, seed.mjs, reset-demo.mjs
```

## Contracts

`docs/contracts.md` is the source of truth for the data model, the shared types, the HTTP API, the
agent's behaviour and the model ids. Change it in the same commit as the code, never after.

## Setup

Requires Node 20 or newer and a Supabase Postgres database with the `vector` extension.

```bash
npm install
cp .env.example .env.local        # fill in your own values
npm run db:migrate                # applies supabase/migrations/*.sql in order
npm run db:seed                   # creates the seeded project and prints its embed key
```

Every variable is documented in `.env.example`. Nothing in this repository reads a secret from a
file that is committed; supply them through your own environment or secret manager.

### Signing in

The console is behind Supabase Auth (email and password). Open `/signin`, choose **Create account**,
give a company name, an address and a password, and you land on `/console`. `apps/web/proxy.ts`
sends anonymous visits to `/console/**` back to `/signin`.

Creating an account also creates the one project it owns: a slug from the company name, a fresh
embed key, no site and no repository. Every console route resolves the caller to that project and
scopes its queries to it, so accounts never see each other's sources, conversations or repository;
without a session those routes answer `401`. The widget's own routes stay public and resolve by the
project's embed key instead, because they run on a customer's site with no browser session.

Because this Supabase project confirms addresses by email, sign-up goes through
`POST /api/auth/signup`, which creates the account already confirmed with the service role. The
browser then signs in with the password, and sign-in and sign-out use the client SDK from there on.

### Linking GitHub

`/console/repository` links a GitHub account through `GITHUB_OAUTH_CLIENT_ID`,
`GITHUB_OAUTH_CLIENT_SECRET` and `GITHUB_OAUTH_REDIRECT`, and stores the access token encrypted on
the project row. Every GitHub call prefers that token and falls back to `GITHUB_TOKEN`, so the
repository picker and the agent keep working on a deployment with no OAuth app configured; the
page then says it is connected through the server credential.

## Running locally

```bash
npm run dev          # Next.js dashboard on http://localhost:3000
npm run build        # builds the widget, copies it to apps/web/public/widget.js, then builds web
npm run typecheck    # tsc across every workspace
npm test             # vitest across every workspace
npm run lint         # eslint
```

Health check: `curl http://localhost:3000/api/health` returns `{"ok":true,"db":true,"openai":true}`
when the database and the OpenAI API are both reachable.

The Python worker runs separately, see `services/worker/README.md`.

## Deploy

`docs/deploy.md` covers the two Vercel projects, the environment variables each one needs, and
where the worker runs.

## Demo

`docs/PLAN.md` holds the plan and the demo the product is built for. `docs/demo.md` carries the
presenter notes.
