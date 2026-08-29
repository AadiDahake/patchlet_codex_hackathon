# The plan

Patchlet is a support agent a company embeds in the corner of its own product. It is consumer
facing: the person talking to it is a customer with a problem, not a developer with a ticket.

> **Patchlet turns repeated customer workarounds into verified product PRs.**

The long form:

> Patchlet is a support agent that learns what your product is missing from how customers already
> use it. If something exists, Patchlet guides you directly to it. If customers repeatedly work
> around something that does not exist, Patchlet infers the missing capability, uses Codex inside
> isolated Runloop environments to build and verify it, and gives the product team a tested pull
> request with real behavioural evidence behind it. Nothing reaches production without human
> approval.

## 1. The core loop

```text
user asks for help
        |
Patchlet understands the live page
        |
feature exists?
   /             \
 YES              NO
  |                |
highlight it   investigate why
                   |
              draft improvement
                   |
                  PR
                   |
            human approval
                   |
            product changes
```

Three things carry that loop, and they are the product.

**Guided answers.** The widget scans the host page for interactive elements and sends the agent
opaque ids, never selectors. The agent answers from the company's own documentation and returns a
step plan whose every target must be one of those ids. The widget then spotlights the real control
on the user's own screen, step by step. A plan that names an id the widget did not send is thrown
away whole; the prose survives, the steps do not.

**The three-check absence proof.** Answering confidently is easy. Proving a feature is missing is
what earns the right to open a pull request. Three independent checks run in parallel:

| Check | What it asks | How |
|---|---|---|
| Help documentation | Does the company's own writing cover this? | Embedding search over the ingested chunks, damped by how legibly each passage was read |
| Current interface | Does a control on the page in front of the user do this? | Local keyword matching against the scanned affordances. No model call, so it is fast and deterministic |
| Known product capabilities | Is there an implementation of this at all? | Ranks the connected repository's paths by keyword, reads the best candidates, counts occurrences |

A documentation or interface hit answers. A capability-only hit hedges. Only when all three come
back empty does a reasoning model get asked to confirm absence, and only then is the turn `absent`.

**The human-approved pull request.** Patchlet never silently changes a production website. A gap
becomes an issue, then a draft pull request, then a pause. A person merges it or does not.

## 2. The evidence loop

The core loop's NO branch used to turn one customer's complaint into a coding prompt. That is not
enough. One complaint is an anecdote; the same workaround performed sixty-three times is a
specification.

```text
POSTHOG TRAJECTORIES
        |
OS-GENESIS INSIGHT          actions -> infer task
        |
TOOLCUA INSIGHT             GUI workflow -> useful semantic capability
        |
ASIL INSIGHT                capability as structured state + semantic actions
        |
PATCHLET SPECIFICATION      seat_party_together
        |
REFLEX / RUNLOOP            Codex implementations + verification
        |
PATCHLET DASHBOARD          preview + evidence + draft PR
        |
HUMAN MERGE
```

### Behavioural evidence

When the three checks find nothing, Patchlet asks a second question: is this an isolated request?
It searches PostHog for historical sessions with similar behaviour. Different users take different
paths to the same end. Patchlet treats a successful session as a demonstration of what the user was
trying to accomplish, not merely as a product session.

### The capability compiler

Three research ideas shape three stages of the compiler. They are ideas, not components; none of
them is a sponsor-facing feature.

- **OS-Genesis: reverse task synthesis.** An interaction trajectory - state, action, state, action -
  yields the inferred user goal. This is the strongest conceptual fit for PostHog data: observed
  behaviour to inferred goal.
- **ToolCUA: the abstraction idea only.** Which repeated GUI operations should become one
  higher-level semantic action? This chooses the granularity. It is what produces
  `seat_party_together()` rather than useless primitives like `clickSeat()` and `clickNextRow()`.
  Patchlet does not reproduce the paper's model or its training pipeline.
- **ASIL: the interface representation.** A capability is structured state, semantic executable
  actions, constraints and success criteria. This shapes Patchlet's internal Capability IR. The gap
  ASIL leaves open is that it assumes the semantic interface has already been discovered; discovery
  from real usage is exactly what Patchlet does. Patchlet emits no MCP or WebMCP output: it would be
  redundant here and would distract from the product.

The compiler's output is a Patchlet capability specification. It is not an implementation. It
describes what the product should be able to do:

```yaml
intent: seat_party_together

inputs:
  flight_id
  passengers

constraints:
  same_row: true
  contiguous: true
  available_only: true
  respect_passenger_restrictions: true

preferences:
  minimize_additional_cost
  keep_children_adjacent_to_parent

actions:
  - get_available_seats
  - rank_seat_groups
  - assign_seat

success:
  all_passengers_adjacent: true

proposed_ui:
  location: seat_map_toolbar
  label: Find seats together
```

And the structured state Codex receives, instead of a list of coordinates to click:

```json
{
  "state": {
    "party_size": 3,
    "current_seats": ["12A", "18C", "24F"],
    "available_seats": ["21A", "21B", "21C"]
  },
  "actions": ["get_available_seats", "assign_seat"],
  "goal": { "all_passengers_adjacent": true }
}
```

### Build and verify in isolation

`missing_capability.discovered` triggers a Reflex Automation. Patchlet sends the host repository,
the capability specification, representative PostHog trajectories and acceptance criteria into
isolated Runloop environments running Codex.

Three reusable Reflex Personas:

- **Capability Builder.** Determine the cleanest way to implement this capability using the host
  product's existing architecture. It usually finds the primitives already there -
  `getAvailableSeats(flightId)`, `getPassengerRestrictions(passengerId)`,
  `assignSeat(passengerId, seatId)`, `calculateSeatPrice(seatId)` - and discovers that the missing
  piece is their composition.
- **UX Builder.** Implement a host-native interface for the capability using the product's existing
  design system, so the resulting pull request looks like the product rather than like arbitrary
  generated UI.
- **Capability Verifier.** Try to break the feature. Contiguous seats available; only
  aisle-separated seats available; no three-seat group available; a blocked accessibility seat;
  exit-row restrictions; a seat that becomes unavailable during checkout; an existing paid seat
  assignment; a child who cannot sit apart from a parent; a duplicate submission; insufficient
  permission.

Candidates run in parallel devboxes and are scored against the same scenarios. Patchlet picks the
winner on the verification result, not on style.

### The opportunity dashboard and the pull request

The developer opens the opportunity in the Patchlet console: the evidence behind it, the generated
implementation, the test result, the sandbox preview, the code. Three actions: **Open Preview**,
**View Code**, **Create Draft PR**.

The pull request carries the evidence with it - why, what, safety, validation - which is a much
stronger case than "a customer requested this". A human reviews and merges. Only then does the
product change.

### Measuring the outcome

PostHog's first job is to discover the workaround. Its second is to say whether the change actually
solved it: adoption, completion, dropoff, support volume, and the change in behaviour. That closes
the loop, and the answer can trigger the next improvement.

```text
POSTHOG    observe user friction
   |
PATCHLET   understand the missing capability
   |
REFLEX + CODEX   build and verify
   |
PR         human approval
   |
PRODUCT    real users
   |
POSTHOG    measure the outcome
   |
PATCHLET
```

## 3. The demo: NovaAir

Patchlet is installed on NovaAir, a consumer airline website. A customer is travelling with two
children. Their reservation shows:

```text
Parent      12A
Child 1     18C
Child 2     24F
```

NovaAir lets a customer change individual seats. It has no feature for automatically finding seats
together. So the customer has to inspect the seat map, search row after row, assign each passenger
individually, and hope a valid group turns up.

### Wow 1: the guided answer

The customer asks:

> "Where do I change my seat?"

Patchlet answers:

> You can change seats under Manage Trip. I'll show you.

The spotlight walks the real NovaAir controls:

```text
Manage Trip -> Seats -> Change Seats
```

Natural language, to live DOM understanding, to actual product controls, to visual guidance. Every
customer action here is also a primitive an API could use.

### The real problem

The seat map opens. The three passengers are visibly scattered.

```text
        A  B  C     D  E  F

12     [A] X  X     O  O  X
...
18      O  O [C1]   X  O  O
...
24      O  X  O     O  X [C2]
```

The customer asks:

> "I'm traveling with my two kids. Can you find us three seats together?"

They are not asking anyone to build software. They want their problem solved.

### The absence check

```text
Checking NovaAir...

Help documentation           x
Current interface            x
Known product capabilities   x

No automatic family seating feature exists.
```

Patchlet says so:

> NovaAir doesn't currently have a way to automatically find seats together. I can still show you
> how to change seats manually.

Then it spotlights the existing seat-selection controls, so the customer still gets immediate help.
Patchlet does not promise that a customer request will instantly modify an airline's production
website.

### Wow 2: what the product is missing

Behind the scenes Patchlet asks whether this is isolated. PostHog answers:

```text
63 similar successful sessions
```

Three of them, taking three different routes:

```text
Family A     seat map -> scan rows -> select 21A -> select 21B -> select 21C -> confirm
Family B     seat map -> row 14 unavailable -> row 17 unavailable -> row 22 -> choose D/E/F -> confirm
Family C     seat map -> inspect availability -> move passenger -> move child -> move child -> confirm
```

Sixty-three human workflows - scan, compare, backtrack, assign, confirm - collapse into one thing:

```text
seat_party_together()
```

> "PostHog normally treats these as product sessions. Patchlet treats successful sessions as
> demonstrations of what users are actually trying to accomplish."

The compiler runs, the capability specification appears in the developer dashboard, and the Reflex
Automation launches Codex into two Runloop devboxes.

```text
                 PATCHLET
          seat_party_together
                   |
           Reflex Automation
                   |
        +----------+----------+
        |                     |
    Runloop A             Runloop B
      Codex                 Codex
   Algorithm A           Algorithm B
        |                     |
        +----------+----------+
                   |
              UX Builder (Codex)
                   |
          Capability Verifier (Codex)
```

```text
Candidate A     18 / 21 tests
  x treats aisle-separated seats as adjacent
  x includes blocked seat
  x child restriction failure

Candidate B     21 / 21 tests
  contiguous correctly defined
  aisle boundaries respected
  blocked seats excluded
  passenger restrictions respected
  concurrent reservation handled
```

Patchlet selects B. Open its sandbox and show
`.patchlet/seat-party-together/solver.ts`:

```ts
export async function findSeatsTogether(ctx: Context) {
    const seats = await ctx.actions.getAvailableSeats(ctx.flightId);
    const validGroups = findContiguousGroups(seats, ctx.passengers.length);
    const compatible = validGroups.filter((group) =>
        satisfiesRestrictions(group, ctx.passengers),
    );
    return rankSeatGroups(compatible, ctx.preferences)[0];
}
```

> "The sessions didn't teach Codex where to click. They taught Patchlet what capability users were
> missing. Codex then inspected NovaAir and implemented that capability using the real product
> primitives."

Then `npm test -- seat-party-together`: 21 passed.

The new UI appears only in the sandbox preview, never on the customer's real NovaAir page. Open the
preview, show the seat map, click **Find seats together**, and the preview identifies 21A, 21B, 21C.
The Patchlet spotlight highlights those three seats.

> "This is running against an isolated copy of NovaAir. Nothing has touched production."

### Wow 3: the pull request, upgraded

The Patchlet developer dashboard:

```text
PATCHLET OPPORTUNITY
Seat families together

Evidence
  63 matching PostHog sessions
  Median manual seat-map interactions   14
  Common intent   Seat traveling party together

Generated implementation
  Capability        ok
  UI                ok
  Integration       ok
  Tests             21/21
  Sandbox preview   ok

[Open Preview]   [View Code]   [Create Draft PR]
```

Click **Create Draft PR**. Reflex packages the winning Codex work into a reviewable branch:

```text
Draft PR #182
Add automatic family seat selection
```

Changed files:

```text
components/SeatMap.tsx
components/FindSeatsTogether.tsx
api/flights/seats/together.ts
lib/seat-groups.ts
tests/seat-together.test.ts
```

Summary:

```text
Why
PostHog identified 63 successful sessions where customers manually searched for adjacent seats for
their traveling party.

What
Adds "Find seats together" to the existing seat selection experience.

Safety
  passenger restrictions
  accessibility seats
  concurrent reservations
  existing seat purchases
  no-availability handling

Validation
21 / 21 sandbox scenarios passed
```

The NovaAir developer reviews it in the Patchlet dashboard or on GitHub, then **Approve & Merge**.
Only now does NovaAir change.

```text
AI discovers opportunity -> AI proposes implementation -> AI verifies implementation
  -> HUMAN reviews -> merge -> production changes
```

No silent feature injection.

### Back to the customer

Refresh NovaAir. The native control is there: **Find seats together**.

Ask Patchlet:

> "Okay, how do I get seats together now?"

> NovaAir now supports this directly. I'll show you.

The spotlight highlights **Find seats together**. Click it. NovaAir finds 21A, 21B, 21C, and
Patchlet highlights those seats too. Then **Move everyone**:

```text
Aadi      12A -> 21A
Child 1   18C -> 21B
Child 2   24F -> 21C
```

Refresh. Still there. The feature is native now.

### PostHog closes the loop

```text
30 DAYS LATER

Before launch
  63 matching manual workflows
  14.2 median seat-map actions

After launch
  Eligible travelers    1,428
  Feature used            917
  Successful              884
  Median interactions   14.2 -> 2.1
  Seat-related support   -41%
```

Where a number comes from a real system - the PostHog counts, the test counts - the system produces
it. Where it is future data, it is seeded honestly and labelled as seeded.

### The closing line

> "At the beginning, this customer asked support how to sit with their kids. At the end, NovaAir has
> a tested, human-approved feature solving that problem for every customer."

## 4. The sponsors

**PostHog** is the behavioural evidence layer. Before the pull request: session replay, interaction
traces, repeated workaround discovery, frequency, successful outcomes. After it: feature adoption,
completion, dropoff, support reduction, behaviour change.

**Codex** is the software implementation intelligence. It reads the host repository, finds existing
primitives, implements the semantic capability, builds native UI, writes tests, fixes failures and
packages the pull request. It can iterate later on new PostHog evidence.

**Reflex / Runloop** is the safe agent execution environment. A Reflex Automation fires on
`missing_capability.discovered`. Three Personas do the work. Runloop devboxes hold candidate A,
candidate B and the verification environment. The winning sandbox produces the preview and the draft
pull request.

So:

> Patchlet decides what the product is missing.
> Codex figures out how to build it.
> Reflex/Runloop gives Codex isolated, repeatable environments to build and verify it in.
> PostHog supplies the real behavioural evidence before and after the change.

## 5. What Patchlet owns

The sponsors are infrastructure. Patchlet owns the system:

```text
customer intent understanding
live DOM understanding
spotlight and highlighting
feature absence detection
PostHog trajectory interpretation
workflow clustering
reverse task synthesis
semantic capability discovery
Capability IR
feature specification
candidate requirements
verification policy
candidate selection
PR evidence generation
product opportunity dashboard
post-deployment learning loop
```

## 6. Working decisions

**Model provider.** OpenAI, for chat, structured output, embeddings, document reading, speech to
text and text to speech. It lives behind one module in `apps/web/lib/openai.ts` and one in
`services/worker/steps/llm.py`, with the ids in `@patchlet/shared`, so it stays swappable. The
choices and their reasons are in `docs/contracts.md` section 5.

**Escalation engines.** `local` is the worker's own runner and does the simple-gap path: issue,
draft, pull request. `forge` is the Reflex/Runloop engine for capability-scale work discovered from
PostHog evidence. `forge` is a named seam today and is refused at the API boundary until it is
built.

**Database.** Supabase Postgres with `pgvector`. Unit tests need neither a database nor the network.

**Hosting.** Vercel: `patchlet-codex` for `apps/web`, `novaair` for the host app.

**Analytics.** A real PostHog project. NovaAir loads `posthog-js` with session recording and custom
events. Patchlet queries PostHog through its API - the HogQL query endpoint and the session
recording endpoints - with a personal API key.

**Sandboxes.** Runloop devboxes through the Runloop API, and Reflex Automations and Personas.
Codex runs inside the devbox.

**No hardcoded demo results** where a real integration is feasible. Seeded data is produced by
scripts that drive the real systems, not pasted into the UI.

## 7. Style

**Writing.** Short sentences, active voice, one idea per sentence. Exact quotes and URLs kept
verbatim. Plain dash, never an em dash.

**Commits.** Conventional Commits, imperative subject, no trailers.

**Design system.** Liquid glass, minimal, clean. One accent, `#FA500F`, on the primary action and
the spotlight ring and nothing else. Inter. Status is text, not a coloured pill. Nothing under 14 px
and real contrast throughout, because it has to read on a projector. Details in
`docs/architecture.md`. NovaAir carries its own design system, so the widget visibly lives inside a
different product.
