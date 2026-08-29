import type { Affordance, PageContext, Step } from "@patchlet/shared";

/**
 * The page as the model sees it: one line per control, with the opaque id that a
 * step has to name. The widget holds the elements those ids stand for.
 */
export function affordanceList(affordances: readonly Affordance[]): string {
  return affordances
    .map((a) => {
      const notes = [a.landmark ? `in ${a.landmark}` : "", a.state ?? "", a.visible ? "" : "not on screen yet"]
        .filter(Boolean)
        .join(", ");
      return `${a.id}: ${a.role} "${a.name}"${notes ? ` (${notes})` : ""}`;
    })
    .join("\n");
}

/**
 * Drops a step that points at the same control as the step before it.
 *
 * Pressing one control twice in a row is never a real instruction, and it is what a model reaches
 * for when it knows the next control by name but cannot see it on the page yet.
 */
export function dropRepeats(steps: readonly Step[]): Step[] {
  return steps.filter((step, index) => index === 0 || step.target !== steps[index - 1]?.target);
}

/**
 * Only the controls the user can see and reach right now.
 *
 * The scan also reports matching controls that are hidden behind a closed menu, which are useful
 * context but never a step: a plan that points at one leaves the widget with nothing to spotlight.
 */
export function visibleAffordances(page: PageContext): Affordance[] {
  const visible = page.affordances.filter((affordance) => affordance.visible);
  return visible.length > 0 ? visible : page.affordances;
}
