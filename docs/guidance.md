# Guidance: how a question becomes a walk on the page

This document covers the guidance loop: what was observed when it went wrong, the design that
replaces it, and the measurements that show the design holds. Observed facts and hypotheses are
kept apart throughout.

## 1. What was observed

Setup: NovaAir in development mode with the widget embedded, Patchlet in development mode, one
project with the NovaAir help center in its knowledge base (added through "Web page" on the
Knowledge page: one document, seven pages, 43 passages), no repository connected, a 1440 by 900
window. Times come from the `trace_event` rows of each conversation and from an observer script
that stamped every change of the spotlight in the page.

### Run 1: "Where do I change my seat?" from the home page

Observed:

- The turn made three model calls: understanding (1245 ms), the step plan (2761 ms) and, after
  the first click, a continuation (4438 ms).
- The documentation check hit at 0.77. Its best passage was page chrome from the crawled help
  index ("Skip to main content / Help center Seats"); the passage with the instructions ranked
  third.
- The answer arrived 4.6 s after the question. The widget announced **"Step 1 of 1"** with the
  caption "Open My Booking". The ring covered the "My Booking" link in the hero. That was the
  correct control.
- The stored plan had one step. The plan the model wrote was cut at the first control that was
  not on the page, by design (`turn.ts`, "reachable").
- On the click, the widget hid the spotlight for 4.56 s while it asked the server for the rest,
  then announced **"Step 2 of 2"**, caption "Open your booking details", with the ring on the
  "My Booking" pill in the top navigation. That link leads to the page the user was already on.
- The user filled the form and pressed "Find my booking" themselves. On the Manage Trip page the
  widget still said "Step 2 of 2" and still pointed at the navigation pill. "Change seats" was
  visible and was never pointed at.
- The user pressed "Change seats" themselves. On the seat map the widget still said "Step 2 of
  2". The walk never finished.

### Run 2: the same question from the Manage Trip page

Observed:

- Two model calls before the answer (understanding 1053 ms, plan 1293 ms); the answer arrived
  2.7 s after the question and the spotlight 2.9 s after the status line started.
- **"Step 1 of 1"**, caption "Select Change seats", ring on "Change seats". Correct.
- On the click the widget hid the spotlight and made a third model call (1986 ms) that answered
  "nothing left", then reopened the panel with the walk finished.

### Run 3: "Where do I add a checked bag?" from the Manage Trip page

The Bags tab is on that page and the baggage article is in the knowledge base. Observed:

- The documentation check missed: the best passage, "Checked bags ... Add bags in the Bags section
  of Manage Trip", scored 0.58 against a threshold of 0.70.
- The interface check missed: the "Bags" tab scored 0.33 against "add checked bag".
- The verdict model confirmed absence (1818 ms). The widget said "Add checked bag is not
  available here today". Four model calls, no spotlight.

### "Can you find us three seats together?" on the seat map (through the API)

Observed: the documentation check missed at 0.59 (best passage: "Traveling with children"), the
verdict was absent, and the answer read "Seat selection is not available here today", because
the understanding step had named the capability "Seat selection".

### The divergence

The proven path is a target on the current page: the plan is one step, the id is live, the
spotlight lands. The failing path is a target on another page. The plan is built from the
affordances of the current page only, so it stops at the first navigation and the announced count
is the count of controls on this page, not the count of the route. Every navigation then costs a
model call before the next step can be shown, and that call has to guess the next control from
the new page alone, which is where the ring landed on the wrong "My Booking".

### The smallest counterfactual

The same question was sent through the API from the home page with every control of the whole
route listed as page affordances, the later ones marked not on screen. The plan still came back
with one step: the prompt says to stop at the first control that opens the rest. So the short
count was not only an information gap; it was designed in, because an id on a later page could
not be known.

### Hypotheses, and what would falsify them

- Hypothesis: a plan built over the whole site, with controls identified by what the user sees
  and not by a positional id, announces the right count and needs no model call on navigation.
  Falsified if a walk over such a plan changes its count, or if the first step of a route the
  graph knows fails to bind to the live page.
- Hypothesis: the knowledge base was missing the answers because the crawl stored chrome and the
  threshold was set for near-title matches. Falsified if, with per-article documents and a tuned
  check, the how-to questions in the offline set still miss or the absence cases hit.

## 2. The design

### A site capability graph

Patchlet keeps a graph of the host product: pages (a route such as `/trips/:id/seats`, a title),
controls (identified by role, accessible name, landmark and link target, never a selector) and
transitions (this control on this page led to that page, or revealed that control on the same
page). It is the shape VACP formalises as a capability graph with an action catalog, and it is
filled the way OS-Genesis fills its trajectories: by interaction-driven discovery, recording
`<state before, action, state after>` triplets.

Two sources feed it, through `supabase/migrations/0015_site_graph.sql`:

- The explorer (`apps/web/lib/graph/explorer.ts`) runs where a browser can: the console's
  "Explore site" queues a job (`site_explore_job`), and the forge runner or `npm run explore`
  on a machine of the team's carries it while the console polls. It drives a headless browser
  with the same scanner code the widget uses (`packages/widget/src/scan/standalone.ts`, built to `scanner.js`). It reads
  every page from the site address, follows internal links, presses the controls that are not
  links on a fresh load of each page to see whether they navigate or reveal, and fills the forms
  it meets with values a small model suggests from the page's own text. Bounded: depth 3, 40
  pages, 25 presses per page, 4 forms, no control whose name reads as destructive, at most two of
  a series. On NovaAir it reads 15 pages and 494 controls and records 221 transitions and 58
  reveals in about 50 seconds; the booking form is filled from the hint on the page and leads to
  Manage Trip.
- The widget's live scans. Every question records the page it was asked on (`POST /api/chat`),
  and the widget reports the page after a navigation and the control the user pressed to get
  there (`POST /api/site/observe`). People exploring the product are the second explorer.

The console's "Product map" page lists pages, controls and transitions with last-seen times, the
known routes, and an "Explore site" action.

### Deterministic route planning

A question resolves to one target control, and the plan is the shortest path to it
(`packages/shared/src/planner.ts`, breadth-first over navigation transitions, with a reveal step
inserted when a control is hidden behind a tab or a menu on the page as it is now). The model
never counts steps: the count is the length of the path.

Resolution (`apps/web/lib/agent/resolve.ts`): candidates come from a keyword search over the
graph, from the controls the documentation passages name, and from the current page; the route to
each candidate is computed first and shown to the model with the candidate; the model chooses the
target, writes the answer and writes one caption per step of the chosen route. Captions that do
not pass the plan checks are replaced by ones written from the control's role and name ("Open My
Booking", "Select the Seats tab"), which always pass.

The first step is bound to the live affordance id on the page the widget scanned; later steps
carry the control's identity and are bound by the widget when it gets there. `validatePlan` still
rejects any live id the widget did not send.

### Known routes without a model

A resolved (project, intent) pair is stored as a known route: the intent is the question's
concepts, sorted, so a rewording with the same words is an exact hit with no model and no
embedding; a new wording is matched by the embedding the documentation check needs anyway at
0.92 or above. On a hit the route is planned from the current page and the answer is streamed at
once. This is ToolCUA's move: a repeated procedure becomes one call, `navigate_to(change_seats)`.

An exact hit is served before the message is read, because the same concepts in a question that
already resolved to a control on this site is the same question. The read is in flight, as on
every turn, and its answer is simply not needed. The looser embedding match waits for the read,
so a message that turns out to be small talk can never be answered with somebody else's walk.

### Not every message is a question about the product

The message is classified before anything is searched (`apps/web/lib/agent/understand.ts`, and
the table in section 4 of `docs/contracts.md`). A greeting, a question about the assistant and a
piece of general knowledge are `chat` and are answered from the model in a sentence or two; a
question the page already answers is `page` and is answered from the page's own text and its
controls; only `product` and `mixed` run the three checks, the verdict and the absence path.
Before this, every message ran the absence pipeline, so "Hello, can you hear me?" came back as an
apology for a missing feature and an offer to report it to the developers.

Three rules keep it safe. A `chat` or `page` answer never names a control the scan did not send
and never claims the product does anything; a capability is only ever asserted from a probe hit;
and anything the classifier is unsure of is `mixed`, which still checks its evidence before it
speaks. The page's own words reach the server because the scan sends them: `visibleText` in
`packages/widget/src/scan/text.ts` collapses the rendered text of the host page, skips the
widget's own host and anything hidden, and bounds it at 2000 characters.

### Binding on navigation

The widget binds each step by stable identity, on every scan. After a navigation it rescans,
waits for the page to settle and rescans once more, and only then asks the server, which
recomputes the route over the graph from the new page with no model. When the count differs from
what was announced the answer says so ("The route changed: N steps to go."). After the last step
the walk is done; there is no call to ask whether anything is left.

### Highlighting that never lies

The spotlight draws the live rect, scrolls the control into view, follows resize and mutation,
dims the rest of the page and shows "Step N of M" with M fixed for the walk. A step succeeds on
pointerdown or on the navigation it causes. The geometry rules stand: no empty or off-screen rect
is ever drawn.

### A real knowledge base

"Import help center from the site" reads the help pages the explorer found (or a sitemap), keeps
the article element only, stores one document per article with its address, and chunks by
heading with the article's title carried into every section chunk. The documentation check ranks
passages by similarity damped by the share of the question's concepts the passage uses, counts a
sure hit above 0.62 and a sure miss below 0.40, and in between reads the passage with a small
model that answers whether the product does what was asked or the passage describes a manual
workaround. The answer cites the article.

### Absence with evidence

The "Known product capabilities" check searches the graph before the repository: its evidence
says how many pages and controls were searched, and its summary names the control it found. A
control found elsewhere on the site routes the turn to `answer`; code alone stays a hedge.

## 3. Measurements

All against NovaAir in development mode on this machine, with Patchlet in development mode, the
project's graph explored and its help center imported. Numbers come from `npm run e2e:guide`
(`e2e/guide.spec.ts`), from `trace_event` rows, from `npm run eval:docs`, and from posting to
`POST /api/chat` against the running stack.

### The walk

- From the home page, "Where do I change my seat?" announces **3 steps** (My Booking, Find my
  booking, Change seats). Every ring overlaps the control it names. The counter reads "Step 1 of
  3", "Step 2 of 3", "Step 3 of 3" and never changes; the walk ends on the seat map and the
  answer card reads "3 steps".
- Time from pressing Enter to the first spotlight, new route: 4.8 s and 6.2 s over two runs
  (target under 5 s; the second run was before the understanding call was moved beside the
  lookups and the resolution call trimmed, after which the server side of the turn took 3.1 to
  3.8 s). The turn makes two model calls, understanding and the resolution that chose the
  target and wrote the captions, plus one reading of the documentation passage when its score
  falls in the band that a number alone cannot decide.
- Time to the first spotlight, known route (the same question from the Manage Trip page): 943,
  987 and 1103 ms over three runs (target under 1.5 s). One row lookup and one graph read; the
  answer waits on no model.
- On navigation the widget bound the next step by identity from its own scan; no `continueFrom`
  request was made during the successful walk.

### Intent routing

Measured on 2026-08-29 against the running stack (Patchlet in development mode on this machine,
a project with 15 pages, 501 controls and six help articles), by posting to `POST /api/chat` and
reading the stream.

- The 16 fixture messages in `apps/web/test/fixtures/intents.ts`, four of each class, are
  classified correctly by `MODELS.understand` in five consecutive runs of
  `apps/web/test/understand.live.test.ts`: 16 of 16 each time, 1.3 to 1.8 s for all sixteen in
  parallel. The suite skips itself without `OPENAI_API_KEY`, so CI stays offline.
- "Hello, can you hear me?" now answers "Hello! Yes, I can hear you. How can I help?" in 2.4 to
  4.5 s, with no probe, no verdict and no offer to report anything. Before, it ran the three
  checks and came back with an apology for a missing feature.
- "What time does my flight leave?" on Manage Trip answers "Your flight departs at 22:40." from
  the page's own text in 2.4 s. On a page that does not say, the answer says so and invites the
  question the product path answers, rather than ending in a dead end.
- "Where do I change my seat?" from the home page is unchanged: three probes, verdict `answer`,
  a three-step route over the product map, in 7.2 s server-side including the documentation
  search and the resolution.
- The same question again, from the same page: 350, 550 and 830 ms, served from the product map
  before the read comes back.

### The explorer

One run over NovaAir: 15 pages, 494 controls, 221 transitions and 58 reveals in 49.8 s. The
booking form was filled from the hint on the page (the demonstration code and the last name) and
led to the Manage Trip page, which is the edge the three-step route needs.

### The documentation check

The offline set has seven questions the help center answers and five it does not, including
three wordings of seating a party together. Ranking by similarity alone put the right article
first for every question but could not separate the answered questions from the absent ones:
the weakest right answer scored 0.566 and the strongest absent case 0.655. With the combined
score the strongest absent case fell to 0.486 and the weakest right answer to 0.464, still not
separable by one line. With the reading in the band the set scores 12 of 12: every answered
question hits ("Where do I add a checked bag?" at 0.565, confirmed by reading) and every absent
case misses, including "I'm traveling with my two kids. Can you find us three seats together?"
(0.471, read, does not cover) and "seats together" (0.486, read, does not cover).

Live, on the seat map, "Can you find us three seats together?" gives: documentation does not
cover it, no control on this page, no control on the site ("searched 15 pages and 496
controls"), verdict absent, and the answer "there is no way of finding seats together here
today". On the Manage Trip page, "Where do I add a checked bag?" now hits the "Baggage
allowance" article, resolves to the Bags tab and spotlights it as "Step 1 of 1"; before, it was
answered as absent.

### What changed in the counts

The walk in section 1 announced 1 of 1, then 2 of 2, and never finished. The same question now
announces 3 of 3 from the first message and finishes on the seat map. The counterfactual in
section 1 predicted this: the count was never a model's guess to fix, it was information the
model did not have and a prompt that told it to stop. Both are gone.

## 4. What it borrows

- OS-Genesis (arXiv:2412.19723): interaction-driven functional discovery, the `<s_pre, a, s_post>`
  triplet as the unit of exploration, and a model used only to invent text for input fields.
- VACP (arXiv:2603.29322): a capability graph, a state snapshot and an action catalog with stable
  ids, kept in step with the live application.
- CI4A (arXiv:2601.14790): a component as a semantic state view, an executable toolset and
  interaction metadata, at a granularity between DOM events and business logic.
- ToolCUA (arXiv:2605.12481): a repeated GUI procedure becomes one semantic tool at the right
  granularity, which is what a known route is.
