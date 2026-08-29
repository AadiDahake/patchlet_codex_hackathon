import { DEFAULT_THRESHOLDS } from "./models";
import type { ProbeResult, VerdictOutcome } from "./types";

export type Thresholds = {
  docsThreshold?: number;
  interfaceThreshold?: number;
};

/**
 * Decides what kind of answer the three probes justify, without a model call where the evidence
 * is already clear.
 *
 * - The documentation or the live page found it, so answer it.
 * - Only the repository found it, so it may exist but the user cannot be shown it: hedge.
 * - Nothing found it, so absence is plausible. The caller then asks the verdict model to confirm
 *   before telling a user a feature does not exist.
 */
export function routeProbes(
  results: readonly ProbeResult[],
  thresholds: Thresholds = {},
): VerdictOutcome {
  const docsThreshold = thresholds.docsThreshold ?? DEFAULT_THRESHOLDS.docsThreshold;
  const interfaceThreshold = thresholds.interfaceThreshold ?? DEFAULT_THRESHOLDS.interfaceThreshold;

  const hit = (probe: ProbeResult["probe"], threshold: number): boolean => {
    const result = results.find((candidate) => candidate.probe === probe);
    if (!result) return false;
    if (!result.hit) return false;
    return result.score === null || result.score >= threshold;
  };

  if (hit("docs", docsThreshold) || hit("interface", interfaceThreshold)) return "answer";

  const repository = results.find((candidate) => candidate.probe === "repository");
  if (repository?.hit) return "hedge";

  return "absent";
}
