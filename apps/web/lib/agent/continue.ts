/**
 * Continuing a walkthrough that is already under way.
 *
 * The user is mid-flow with a caption on their screen and their hand on the mouse, so this path
 * spends nothing on work the first turn already did. It reuses that turn's answer and its
 * documentation evidence, reads the page as it looks now, and asks one small model for the steps
 * that are left. No understanding call, no probes, no verdict.
 */
import { EFFORT, MODELS, validatePlan } from "@patchlet/shared";
import type { PageContext, Step } from "@patchlet/shared";
import { chatJson } from "../openai";
import { serviceClient } from "../supabase";
import { emitTrace } from "../trace";
import { affordanceList, dropRepeats, visibleAffordances } from "./page";

export type ContinueInput = {
  projectId: string;
  conversationId: string;
  question: string;
  page: PageContext;
  /** How many steps of the original plan the user has already completed. */
  continueFrom: number;
};

export type ContinueResult = { text: string; steps: Step[] | null };

const STEPS_SCHEMA = {
  type: "object",
  properties: {
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          target: { type: "string" },
          caption: { type: "string" },
          advanceOn: { type: "string", enum: ["click", "input", "navigation", "manual"] },
        },
        required: ["target", "caption", "advanceOn"],
        additionalProperties: false,
      },
    },
  },
  required: ["steps"],
  additionalProperties: false,
};

const SYSTEM = [
  "You are guiding one user through a task on the page they are looking at.",
  "Earlier steps are already done. Return only the steps that are still left, in order.",
  "Each element is listed as `id: role \"name\"`. A step's target is the id, and nothing else: \"a3\", never \"textbox Username\".",
  "Never invent an id.",
  "Every element listed is on the screen right now, so whatever reveals them has already happened.",
  "A control marked (selected) or (expanded) is already active, so it is not a step: skip it.",
  "Start at the first thing the user still has to do themselves.",
  "Use advanceOn 'input' for a field they type into and 'click' for anything they press.",
  "Return an empty list when the task is finished and nothing on this page is left to do.",
  "At most 3 steps. Each caption is at most 12 words and starts with a verb. JSON only.",
].join(" ");

type LastAnswer = { content: string; steps: Step[] | null; grounding: unknown };

/** The answer this walkthrough came from, with whatever it was grounded in. */
async function lastAssistantMessage(conversationId: string): Promise<LastAnswer | null> {
  const { data } = await serviceClient()
    .from("message")
    .select("content, steps, grounding")
    .eq("conversation_id", conversationId)
    .eq("role", "assistant")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    content: String(data.content ?? ""),
    steps: (data.steps as Step[] | null) ?? null,
    grounding: data.grounding ?? null,
  };
}

/** What the user has been told so far, so the continuation does not repeat a step. */
function doneSoFar(previous: LastAnswer, continueFrom: number): string {
  const done = (previous.steps ?? []).slice(0, Math.max(continueFrom, 0));
  if (done.length === 0) return "The user has just started.";
  return `Already done:\n${done.map((step, index) => `${index + 1}. ${step.caption}`).join("\n")}`;
}

export async function continueGuidance(input: ContinueInput): Promise<ContinueResult> {
  const started = Date.now();
  const previous = await lastAssistantMessage(input.conversationId);
  if (!previous) return { text: "", steps: null };

  const reachableAffordances = visibleAffordances(input.page);
  const grounding = previous.grounding ? JSON.stringify(previous.grounding).slice(0, 4000) : "none";
  const { steps: proposed } = await chatJson<{ steps: Step[] }>(
    MODELS.plan,
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          `Task: ${input.question}`,
          `What we told the user: ${previous.content}`,
          doneSoFar(previous, input.continueFrom),
          `Documentation:\n${grounding}`,
          `Elements on this page now:\n${affordanceList(reachableAffordances)}`,
        ].join("\n\n"),
      },
    ],
    STEPS_SCHEMA,
    { name: "remaining_steps", maxTokens: 3000, effort: EFFORT.plan },
  );

  // One id the model invented should cost that step, not the whole continuation.
  const known = new Set(reachableAffordances.map((affordance) => affordance.id));
  const reachable: Step[] = [];
  for (const step of dropRepeats(proposed ?? [])) {
    if (!known.has(step.target)) break;
    reachable.push(step);
  }
  const steps = validatePlan(reachable, reachableAffordances);
  const latencyMs = Date.now() - started;
  void emitTrace({
    projectId: input.projectId,
    conversationId: input.conversationId,
    kind: "model",
    title: "Continued the walkthrough",
    detail: {
      model: MODELS.plan,
      purpose: "name the steps that are left now that the page has changed",
      output_summary: (steps ?? []).map((step) => step.caption).join(" / ") || "nothing left",
      latencyMs,
    },
    source: "agent",
  });

  return { text: previous.content, steps };
}
