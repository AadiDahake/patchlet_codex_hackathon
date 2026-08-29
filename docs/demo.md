# Demo notes

The demo is the NovaAir seat-selection story, start to finish. `docs/PLAN.md` holds it: the
scenario, every fixed number, what each sponsor does at each beat, and the lines to say.

The presenter script lives here. It is being written next.

## Before you start

- Two browser tabs, both already loaded: the host app (NovaAir) and the Patchlet console on
  `/console/activity`. Switching tabs mid-demo is faster than navigating.
- The knowledge base has NovaAir's help documentation ingested. Check `/console/knowledge` shows
  the documents as ready with a chunk count.
- The repository is connected on `/console/repository` and the overview reports the worker online.
- Run `npm run demo:reset` beforehand so the host app is back to its pre-demo state and old
  escalations are cleared.
- Window at 1440x900 or larger. Everything is sized to read on a projector, but the widget panel is
  380 px wide, so do not shrink the window.

## If something goes wrong

- **A check hangs.** The widget shows an elapsed counter rather than a spinner. Keep talking; the
  probes have their own timeouts and the turn completes.
- **The deployment is slow.** The trace stays on `deploying`. Move to questions and come back to the
  reload at the end.
- **You need to run it twice.** `npm run demo:reset` restores the host app and clears the last
  escalation, so the second run is as clean as the first.
