import { describe, expect, it } from "vitest";
import { routeProbes } from "../src/route";
import type { ProbeName, ProbeResult } from "../src/types";

const probe = (
  name: ProbeName,
  hit: boolean,
  score: number | null = null,
): ProbeResult => ({
  probe: name,
  hit,
  score,
  summary: "",
  evidence: null,
  latencyMs: 1,
});

describe("routeProbes", () => {
  it("answers when the documentation probe hits", () => {
    const results = [probe("docs", true, 0.82), probe("interface", false, 0.1), probe("repository", false)];
    expect(routeProbes(results)).toBe("answer");
  });

  it("answers when only the interface probe hits", () => {
    const results = [probe("docs", false, 0.2), probe("interface", true, 0.7), probe("repository", false)];
    expect(routeProbes(results)).toBe("answer");
  });

  it("hedges when only the repository probe hits", () => {
    const results = [probe("docs", false, 0.2), probe("interface", false, 0.1), probe("repository", true)];
    expect(routeProbes(results)).toBe("hedge");
  });

  it("reports absence when nothing hits", () => {
    const results = [probe("docs", false, 0.1), probe("interface", false, 0.0), probe("repository", false)];
    expect(routeProbes(results)).toBe("absent");
  });

  it("honours a raised documentation threshold", () => {
    const results = [probe("docs", true, 0.72), probe("interface", false, 0), probe("repository", false)];
    expect(routeProbes(results)).toBe("answer");
    expect(routeProbes(results, { docsThreshold: 0.9 })).toBe("absent");
  });

  it("honours a lowered interface threshold", () => {
    const results = [probe("docs", false, 0), probe("interface", true, 0.4), probe("repository", false)];
    expect(routeProbes(results)).toBe("absent");
    expect(routeProbes(results, { interfaceThreshold: 0.3 })).toBe("answer");
  });

  it("treats a hit with no score as a hit", () => {
    expect(routeProbes([probe("docs", true, null)])).toBe("answer");
  });

  it("reports absence when a probe is missing entirely", () => {
    expect(routeProbes([])).toBe("absent");
  });
});
