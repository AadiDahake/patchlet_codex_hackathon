/**
 * The compiler's `ModelClient`, built on the app's one provider module.
 *
 * Goal inference runs on the small fast model. The reward model and the naming call run on the
 * flagship: on the seeded sessions the small model graded half of the completed workflows as
 * unfinished, and the reward is what decides how many sessions count as evidence. Every reply is
 * validated by the compiler against the schema it passed, so nothing here casts.
 */
import type { JsonSchema, ModelClient, ModelPrompt } from "@patchlet/capability";
import { EFFORT, MODELS } from "@patchlet/shared";
import { chatJson } from "../openai";

/** Reasoning tokens count against the budget, so it sits well above the size of any answer. */
const MAX_OUTPUT_TOKENS = 24_000;

export function modelFor(purpose: ModelPrompt["purpose"]): string {
  return purpose === "f_high" ? MODELS.synthesize : MODELS.capability;
}

export function effortFor(purpose: ModelPrompt["purpose"]) {
  return purpose === "f_high" ? EFFORT.synthesize : EFFORT.capability;
}

export function openaiModelClient(): ModelClient {
  return {
    name: `${MODELS.synthesize} (synthesis), ${MODELS.capability} (reward, naming)`,
    async structured(prompt: ModelPrompt, schema: JsonSchema): Promise<unknown> {
      return chatJson<unknown>(
        modelFor(prompt.purpose),
        [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        schema,
        {
          name: prompt.purpose,
          maxTokens: MAX_OUTPUT_TOKENS,
          effort: effortFor(prompt.purpose),
        },
      );
    },
  };
}
