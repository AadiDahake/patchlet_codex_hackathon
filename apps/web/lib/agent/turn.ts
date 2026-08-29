/**
 * One chat turn: understand, check three independent sources, route on the
 * evidence, then answer, hedge, or state plainly that the feature is missing.
 */
import { EFFORT, MODELS, routeProbes, validatePlan } from "@patchlet/shared";
import type {
  ChatEvent,
  EscalationOffer,
  FeatureRequest,
  PageContext,
  ProbeResult,
  Step,
  Verdict,
} from "@patchlet/shared";
import { chatJson, embed } from "../openai";
import { serviceClient } from "../supabase";
import { emitTrace } from "../trace";
import { loadVisitorFacts, rememberFromTurn } from "./memory";
import { affordanceList, dropRepeats } from "./page";
import { probeDocs, probeInterface, probeRepository } from "./probes";
import { noteRequest } from "./requests";
import { closeConversation } from "./summary";

/**
 * What the widget is told about reporting.
 *
 * A drafted request with no repository to file it against is not an offer: the widget says so
 * instead of showing a button that would come back with an error.
 */
function escalationOffer(request: FeatureRequest | null, repoFullName: string | null): EscalationOffer {
  if (!request) return { offered: false };
  return repoFullName ? { offered: true, request } : { offered: false, reason: "no_repository" };
}

export type TurnInput = {
  projectId: string;
  repoFullName: string | null;
  defaultBranch: string;
  question: string;
  page: PageContext;
  conversationId?: string;
  /** Random id from the visitor's browser; the key of everything the agent remembers. */
  visitorId?: string;
};

const UNDERSTANDING_SCHEMA = {
  type: "object",
  properties: {
    intent: { type: "string", enum: ["howto", "feature", "other"] },
    feature: { type: "string" },
  },
  required: ["intent", "feature"],
  additionalProperties: false,
};

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
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
  required: ["answer", "steps"],
  additionalProperties: false,
};

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    exists: { type: "boolean" },
    confidence: { type: "number" },
    reasoning: { type: "string" },
  },
  required: ["exists", "confidence", "reasoning"],
  additionalProperties: false,
};

const REQUEST_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    area: { type: "string" },
    quote: { type: "string" },
    rationale: { type: "string" },
  },
  required: ["title", "description", "area", "quote", "rationale"],
  additionalProperties: false,
};

/** The remembered facts as a prompt block, empty when this is a first visit. */
function memoryBlock(memory: string[]): string {
  if (memory.length === 0) return "";
  return `\n\nWhat we know about this visitor:\n${memory.map((fact) => `- ${fact}`).join("\n")}`;
}

export async function* runTurn(input: TurnInput): AsyncGenerator<ChatEvent> {
  const db = serviceClient();
  const { projectId, question, page } = input;

  // 1. Persist the conversation and the user's message.
  let conversationId = input.conversationId;
  if (!conversationId) {
    const { data } = await db
      .from("conversation")
      .insert({
        project_id: projectId,
        page_url: page.url,
        page_title: page.title,
        visitor_id: input.visitorId ?? null,
      })
      .select("id")
      .single();
    conversationId = (data?.id as string) ?? "";
  }
  const { data: userMessage } = await db
    .from("message")
    .insert({ conversation_id: conversationId, role: "user", content: question })
    .select("id")
    .single();
  const messageId = (userMessage?.id as string) ?? "";
  yield { type: "conversation", conversationId, messageId };

  // 2. Understand what the user is actually asking about.
  //
  // The question embedding and the visitor's remembered facts depend on nothing the model is
  // about to say, so all three run together and the slowest one bounds this stage.
  const questionEmbedding = embed([question]).then(([vector]) => {
    if (!vector) throw new Error("The embedding service returned nothing for the question");
    return vector;
  });
  // Claimed here so a failure surfaces at the probe that uses it, not as an unhandled rejection.
  questionEmbedding.catch(() => undefined);
  const understandStarted = Date.now();
  const [understanding, memory] = await Promise.all([
    chatJson<{ intent: "howto" | "feature" | "other"; feature: string }>(
      MODELS.understand,
      [
        {
          role: "system",
          content:
            "Read one support question. Name the product capability it is about in two or three words. Answer with JSON only.",
        },
        { role: "user", content: question },
      ],
      UNDERSTANDING_SCHEMA,
      { name: "understanding", maxTokens: 2000, effort: EFFORT.understand },
    ),
    // What the agent already knows about this person, so the answer can speak to their situation.
    loadVisitorFacts(projectId, input.visitorId),
  ]);
  const understandMs = Date.now() - understandStarted;
  void emitTrace({
    projectId,
    conversationId,
    kind: "model",
    title: "Understood the question",
    detail: {
      model: MODELS.understand,
      purpose: "name the capability the question is about",
      output_summary: understanding.feature,
      latencyMs: understandMs,
    },
    source: "agent",
  });
  yield {
    type: "understanding",
    feature: understanding.feature,
    intent: understanding.intent,
    memory,
  };

  // 3. Three independent checks, run together so the slowest bounds the turn.
  for (const probe of ["docs", "interface", "repository"] as const) {
    yield { type: "probe", probe, status: "running" };
  }
  const [docs, ui, repository] = await Promise.all([
    probeDocs(`${question} ${understanding.feature}`, projectId, questionEmbedding),
    Promise.resolve(probeInterface(question, page, understanding.feature)),
    probeRepository(projectId, understanding.feature, input.repoFullName, input.defaultBranch),
  ]);
  const probes: ProbeResult[] = [docs, ui, repository];
  for (const result of probes) {
    yield { type: "probe", probe: result.probe, status: "done", result };
    void emitTrace({
      projectId,
      conversationId,
      kind: "probe",
      title: `Checked ${result.probe}`,
      status: result.hit ? "ok" : "failed",
      detail: result,
      source: "agent",
    });
  }

  // 4. Route on the evidence. Absence is confirmed by a reasoning model.
  let outcome = routeProbes(probes);
  let verdict: Verdict = {
    outcome,
    confidence: 0.8,
    reasoning: probes.map((p) => p.summary).join(" "),
    feature: understanding.feature,
  };
  let verdictMs: number | null = null;
  if (outcome === "absent") {
    const verdictStarted = Date.now();
    const confirmed = await chatJson<{ exists: boolean; confidence: number; reasoning: string }>(
      MODELS.verdict,
      [
        {
          role: "system",
          content:
            "Three independent checks looked for a product capability and found nothing. Decide whether the capability exists. Be conservative: say it does not exist only when the evidence supports it. JSON only.",
        },
        {
          role: "user",
          content: `Capability: ${understanding.feature}\nQuestion: ${question}\n\n${probes
            .map((p) => `${p.probe}: ${p.summary}`)
            .join("\n")}`,
        },
      ],
      VERDICT_SCHEMA,
      { name: "verdict", maxTokens: 4000, effort: EFFORT.verdict },
    );
    verdictMs = Date.now() - verdictStarted;
    outcome = confirmed.exists ? "hedge" : "absent";
    verdict = {
      outcome,
      confidence: confirmed.confidence,
      reasoning: confirmed.reasoning,
      feature: understanding.feature,
    };
  }
  yield { type: "verdict", verdict };
  void emitTrace({
    projectId,
    conversationId,
    kind: "verdict",
    title: `Verdict: ${outcome}`,
    detail: verdictMs === null ? verdict : { ...verdict, model: MODELS.verdict, latencyMs: verdictMs },
    source: "agent",
  });

  // 5. Answer.
  let text: string;
  let steps: Step[] | null = null;
  let request: FeatureRequest | null = null;

  // The docs passages behind this answer, kept on the message so continuing the
  // guidance later does not have to search for them again.
  let grounding: unknown = null;

  if (outcome === "answer") {
    grounding = docs.evidence;
    const planStarted = Date.now();
    const plan = await chatJson<{ answer: string; steps: Step[] }>(
      // The evidence is already gathered and the shape is fixed, so this is a small
      // structured task. A faster model here is what keeps guidance feeling live.
      MODELS.plan,
      [
        {
          role: "system",
          content:
            "You are a support agent embedded in a web page. Answer ONLY from the documentation passages and the listed page elements. If they do not describe how to do exactly what was asked, say plainly that you could not find it and return no steps; never invent a button, page, or setting. Otherwise answer in one or two short sentences, then give the steps the user takes on the page in front of them. Every step target MUST be one of the listed element ids, exactly as written. Order the steps so the first one is a control that is on the page right now: if the flow continues inside a menu or dialog that is not open yet, make the first step the control that opens it and stop there. Never invent an id. Use at most 5 steps. Each caption is at most 12 words and starts with a verb. JSON only.",
        },
        {
          role: "user",
          content: `Question: ${question}${memoryBlock(memory)}\n\nDocumentation:\n${JSON.stringify(docs.evidence)}\n\nElements on this page:\n${affordanceList(page.affordances)}`,
        },
      ],
      PLAN_SCHEMA,
      { name: "plan", maxTokens: 4000, effort: EFFORT.plan },
    );
    void emitTrace({
      projectId,
      conversationId,
      kind: "model",
      title: "Planned the answer and the steps",
      detail: {
        model: MODELS.plan,
        purpose: "answer from the documentation and name the controls to point at",
        output_summary: plan.answer,
        latencyMs: Date.now() - planStarted,
      },
      source: "agent",
    });
    text = plan.answer;
    // A flow often continues behind a menu that is still closed, so the later
    // targets do not exist yet. Guide as far as this page allows rather than
    // dropping the whole plan; the widget re-plans once the page changes.
    const known = new Set(page.affordances.map((a) => a.id));
    const reachable: Step[] = [];
    for (const step of dropRepeats(plan.steps ?? [])) {
      if (!known.has(step.target)) break;
      reachable.push(step);
    }
    steps = validatePlan(reachable, page.affordances);
  } else {
    const draftStarted = Date.now();
    const drafted = await chatJson<FeatureRequest>(
      MODELS.answer,
      [
        {
          role: "system",
          content:
            "Turn one support request into a feature request for the developers. The quote must be copied exactly from the user's message. Any notes about the visitor are context for the rationale, never part of the quote. JSON only.",
        },
        { role: "user", content: `${question}${memoryBlock(memory)}` },
      ],
      REQUEST_SCHEMA,
      { name: "feature_request", maxTokens: 4000, effort: EFFORT.answer },
    );
    void emitTrace({
      projectId,
      conversationId,
      kind: "model",
      title: "Drafted the feature request",
      detail: {
        model: MODELS.answer,
        purpose: "turn the question into something the developers can build",
        output_summary: drafted.title,
        latencyMs: Date.now() - draftStarted,
      },
      source: "agent",
    });
    request = {
      ...drafted,
      quote: question.includes(drafted.quote.trim()) ? drafted.quote.trim() : question,
    };
    // Only offer what can actually happen: without a repository there is nothing to file against.
    const offer = input.repoFullName
      ? outcome === "absent"
        ? " I can report this to the developers so they can build it. Would you like me to?"
        : " I can report it to the developers so they can look. Would you like me to?"
      : "";
    text =
      outcome === "absent"
        ? `I am sorry, ${understanding.feature} is not available here today. I checked the documentation, this page, and what this product is known to do, and found nothing.${offer}`
        : `I could not confirm that ${understanding.feature} exists here. I did not find it in the documentation or on this page.${offer}`;
  }

  const { data: assistantMessage } = await db
    .from("message")
    .insert({
      conversation_id: conversationId,
      role: "assistant",
      content: text,
      steps,
      probes,
      verdict,
      feature_request: request,
      grounding,
    })
    .select("id")
    .single();

  // Even when the user never asks for it, a gap the agent found is worth the developers knowing.
  // It joins the other reports of the same gap and rises with them.
  const noted = request
    ? await noteRequest({
        projectId,
        request,
        conversationId,
        messageId: (assistantMessage?.id as string) ?? null,
      })
    : false;

  yield {
    type: "answer",
    text,
    steps,
    escalation: escalationOffer(request, input.repoFullName),
    noted,
  };

  // The widget escalates against the assistant message, so hand its id back.
  yield {
    type: "conversation",
    conversationId,
    messageId: (assistantMessage?.id as string) ?? messageId,
  };

  // 6. Remember anything durable the visitor said about themselves, for their next visit.
  try {
    const learned = await rememberFromTurn({
      projectId,
      visitorId: input.visitorId,
      conversationId,
      question,
      answer: text,
      known: memory,
    });
    if (learned.length > 0) {
      await emitTrace({
        projectId,
        conversationId,
        kind: "model",
        title: "Remembered about this visitor",
        detail: {
          model: MODELS.understand,
          purpose: "keep durable facts about the visitor",
          output_summary: learned.join(" "),
          facts: learned,
        },
        source: "agent",
      });
    }
  } catch {
    // Memory is a convenience. A failed extraction must never cost the user their answer.
  }

  // 7. Record how this ended. The user already has the answer; this is only for the console.
  try {
    await closeConversation({ conversationId, question, answer: text, steps, verdict });
  } catch {
    // A missing outcome shows as "in progress" in the console and is not worth failing a turn.
  }
}
