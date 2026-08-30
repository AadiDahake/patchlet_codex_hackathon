import { describe, expect, it } from "vitest";
import { DOCS_SURE_MISS, docsScore, overlapOf, probeInterface } from "@/lib/agent/probes";
import { DEFAULT_THRESHOLDS } from "@patchlet/shared";

describe("the documentation score", () => {
  it("keeps a passage that uses the question's words and damps one that does not", () => {
    expect(docsScore(0.6, 1)).toBeCloseTo(0.6, 5);
    expect(docsScore(0.6, 0)).toBeCloseTo(0.36, 5);
    expect(docsScore(0.6, 0.5)).toBeGreaterThan(docsScore(0.6, 0.25));
  });

  it("measures overlap on concepts, so inflections and stopwords do not count against a passage", () => {
    expect(overlapOf("Where do I change my seat?", "Changing seats is done under Manage Trip.")).toBe(1);
    expect(overlapOf("Where do I add a checked bag?", "Seat selection fees")).toBe(0);
  });

  it("leaves a band to read between a sure miss and a sure hit", () => {
    expect(DOCS_SURE_MISS).toBeLessThan(DEFAULT_THRESHOLDS.docsThreshold);
  });
});

describe("the interface check", () => {
  it("does not count a link into the help pages as the control that does the thing", () => {
    const page = {
      url: "http://localhost:4150/",
      title: "NovaAir",
      affordances: [
        { id: "a1", role: "link", name: "Change my seat", href: "/help/how-do-i-change-my-seat", visible: true },
        { id: "a2", role: "link", name: "Change seats", href: "/trips/NVA7K2/seats", visible: true },
      ],
    };
    const result = probeInterface("Where do I change my seat?", page, "changing a seat");
    expect(result.hit).toBe(true);
    const top = (result.evidence as { id: string; score: number }[])[0];
    expect(top?.id).toBe("a2");
    const helpOnly = probeInterface("Where do I change my seat?", { ...page, affordances: [page.affordances[0]!] }, "changing a seat");
    expect(helpOnly.hit).toBe(false);
  });
});
