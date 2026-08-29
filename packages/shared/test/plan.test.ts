import { describe, expect, it } from "vitest";
import { validatePlan } from "../src/plan";
import type { Affordance, Step } from "../src/types";

const affordances: Affordance[] = [
  { id: "a1", role: "button", name: "Account", visible: true },
  { id: "a2", role: "menuitem", name: "Profile", visible: true },
  { id: "a3", role: "textbox", name: "Username", visible: true },
];

const step = (over: Partial<Step> = {}): Step => ({
  target: "a1",
  caption: "Open the account menu",
  advanceOn: "click",
  ...over,
});

describe("validatePlan", () => {
  it("accepts a plan whose targets are all known", () => {
    const plan = [step(), step({ target: "a2", caption: "Choose Profile" })];
    expect(validatePlan(plan, affordances)).toEqual(plan);
  });

  it("rejects the whole plan when any target is unknown", () => {
    const plan = [step(), step({ target: "a9", caption: "Choose Profile" })];
    expect(validatePlan(plan, affordances)).toBeNull();
  });

  it("rejects a caption longer than fourteen words", () => {
    const caption = Array.from({ length: 15 }, () => "word").join(" ");
    expect(validatePlan([step({ caption })], affordances)).toBeNull();
  });

  it("accepts a caption of exactly fourteen words", () => {
    const caption = Array.from({ length: 14 }, () => "word").join(" ");
    expect(validatePlan([step({ caption })], affordances)).not.toBeNull();
  });

  it("rejects an empty plan and one longer than five steps", () => {
    expect(validatePlan([], affordances)).toBeNull();
    expect(validatePlan(Array.from({ length: 6 }, () => step()), affordances)).toBeNull();
  });

  it("rejects an unknown advanceOn value", () => {
    const bad = { target: "a1", caption: "Open it", advanceOn: "hover" } as unknown as Step;
    expect(validatePlan([bad], affordances)).toBeNull();
  });

  it("rejects a blank caption and trims the ones it keeps", () => {
    expect(validatePlan([step({ caption: "   " })], affordances)).toBeNull();
    expect(validatePlan([step({ caption: "  Open the menu  " })], affordances)?.[0]?.caption).toBe(
      "Open the menu",
    );
  });

  it("rejects a plan when there are no affordances at all", () => {
    expect(validatePlan([step()], [])).toBeNull();
  });
});
