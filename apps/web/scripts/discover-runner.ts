/**
 * The discovery runner: claims queued runs of the opportunity pipeline and executes them.
 *
 *   npm run discover:runner            poll forever
 *   npm run discover:runner -- --once  drain the queue, then exit
 *
 * A host that caps a request's duration (Vercel, 300 s) sets `DISCOVERY_MODE=runner` so the
 * routes only enqueue, and this process does the mining and the compiling. Claiming goes through
 * `claim_discovery`, so several runners can share one queue.
 */
import { hostname } from "node:os";
import { claimNextDiscovery } from "../lib/opportunity/queue";
import { executeDiscovery } from "../lib/opportunity/run";

const POLL_MS = 2_000;
const once = process.argv.includes("--once");
const worker = `${hostname()}:${process.pid}`;

const log = (line: string): void => console.log(`${new Date().toISOString()} ${line}`);

async function drain(): Promise<number> {
  let ran = 0;
  for (;;) {
    const claimed = await claimNextDiscovery(worker);
    if (!claimed) return ran;
    ran += 1;
    await executeDiscovery(claimed.id, {
      alreadyClaimed: true,
      log: (line) => log(`[discovery ${claimed.id.slice(0, 8)}] ${line}`),
    });
  }
}

log(`discovery runner ${worker} started${once ? " (once)" : ""}`);
for (;;) {
  try {
    const ran = await drain();
    if (once) {
      log(`drained ${ran} run(s)`);
      break;
    }
  } catch (error) {
    log(`runner error: ${(error as Error).message}`);
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_MS));
}
