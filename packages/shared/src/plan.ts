import type { Affordance, Step } from "./types";

/** Captions have to fit a bubble beside a control and be read aloud in one breath. */
const MAX_CAPTION_WORDS = 14;

/** Beyond this a guided walkthrough stops being guidance. */
const MAX_STEPS = 5;

const ADVANCE_ON = new Set<Step["advanceOn"]>(["click", "input", "navigation", "manual"]);

/**
 * Checks a model-produced step plan against the affordances the widget actually sent.
 *
 * Model output is untrusted, and a step whose target does not exist would spotlight nothing, so
 * one bad step rejects the whole plan: the caller keeps the prose and drops the guidance rather
 * than walking the user through a partly imaginary interface.
 */
export function validatePlan(steps: readonly Step[], affordances: readonly Affordance[]): Step[] | null {
  if (steps.length === 0 || steps.length > MAX_STEPS) return null;

  const known = new Set(affordances.map((affordance) => affordance.id));
  const validated: Step[] = [];

  for (const step of steps) {
    if (typeof step?.target !== "string" || !known.has(step.target)) return null;
    if (typeof step.caption !== "string") return null;

    const caption = step.caption.trim();
    if (caption.length === 0) return null;
    if (caption.split(/\s+/).length > MAX_CAPTION_WORDS) return null;

    if (!ADVANCE_ON.has(step.advanceOn)) return null;

    validated.push({ target: step.target, caption, advanceOn: step.advanceOn });
  }

  return validated;
}
