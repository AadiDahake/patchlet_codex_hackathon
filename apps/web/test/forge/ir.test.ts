import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { intentSlug, intentWords, parseCapabilityIr, scenarioIds } from "@/lib/forge/ir";

const raw = JSON.parse(readFileSync(join(__dirname, "..", "..", "lib", "forge", "fixtures", "seat-party-together.ir.json"), "utf8"));

describe("parseCapabilityIr", () => {
  it("accepts the NovaAir specification with its 21 scenarios", () => {
    const ir = parseCapabilityIr(raw);
    expect(ir.intent).toBe("seat_party_together");
    expect(scenarioIds(ir)).toHaveLength(21);
    expect(new Set(scenarioIds(ir)).size).toBe(21);
    expect(ir.evidence.session_count).toBe(63);
    expect(ir.evidence.median_manual_actions).toBe(14.2);
    expect(ir.actions.map((action) => action.name)).toContain("rank_seat_groups");
    expect(intentSlug(ir)).toBe("seat-party-together");
    expect(intentWords(ir)).toBe("seat party together");
  });

  it("names the field that is wrong", () => {
    expect(() => parseCapabilityIr(null)).toThrow("spec must be an object");
    expect(() => parseCapabilityIr({ ...raw, intent: "ClickSeat" })).toThrow("spec.intent must be snake_case");
    expect(() => parseCapabilityIr({ ...raw, actions: [] })).toThrow("spec.actions must be a non-empty array");
    expect(() => parseCapabilityIr({ ...raw, constraints: [{ id: "x" }] })).toThrow("spec.constraints[0].statement");
    expect(() => parseCapabilityIr({ ...raw, success: { postconditions: [], scenarios: raw.success.scenarios } })).toThrow(
      "spec.success.postconditions",
    );
    expect(() => parseCapabilityIr({ ...raw, evidence: { session_count: 0, trajectories: [] } })).toThrow("session_count");
  });

  it("refuses duplicate scenario ids, because the count is the demo's denominator", () => {
    const twice = { ...raw, success: { ...raw.success, scenarios: [...raw.success.scenarios, raw.success.scenarios[0]] } };
    expect(() => parseCapabilityIr(twice)).toThrow("must be unique");
  });
});
