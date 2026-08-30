/**
 * The compiler's `ModelClient`, built on the app's one provider module.
 *
 * The batched calls (reverse task synthesis, the reward model) run on the small fast model; the
 * one naming call, whose answer becomes the specification, runs on the flagship. Every reply is
 * validated by the compiler against the schema it passed, so nothing here casts.
 */
import type { JsonSchema, ModelClient, ModelPrompt } from "@patchlet/capability";
import { EFFORT, MODELS } from "@patchlet/shared";
import { chatJson } from "../openai";

/** Reasoning tokens count against the budget, so it sits well above the size of any answer. */
const MAX_OUTPUT_TOKENS = 24_000;

export function modelFor(purpose: ModelPrompt["purpose"]): string {
  return purpose === "tool_synth" ? MODELS.capability : MODELS.synthesize;
}

export function openaiModelClient(): ModelClient {
  return {
    name: `${MODELS.synthesize} (synthesis, reward), ${MODELS.capability} (naming)`,
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
          effort: prompt.purpose === "tool_synth" ? EFFORT.capability : EFFORT.synthesize,
        },
      );
    },
  };
}
