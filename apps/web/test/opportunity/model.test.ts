import { describe, expect, it } from "vitest";
import { EFFORT, MODELS } from "@patchlet/shared";
import { effortFor, modelFor } from "@/lib/opportunity/model";

describe("modelFor", () => {
  it("runs goal inference on the small model and the reward and naming calls on the flagship", () => {
    expect(modelFor("f_high")).toBe(MODELS.synthesize);
    expect(modelFor("trm")).toBe(MODELS.capability);
    expect(modelFor("tool_synth")).toBe(MODELS.capability);
    expect(effortFor("f_high")).toBe(EFFORT.synthesize);
    expect(effortFor("trm")).toBe(EFFORT.capability);
  });
});
