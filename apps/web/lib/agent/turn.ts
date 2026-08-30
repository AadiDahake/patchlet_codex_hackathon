/**
 * One chat turn: understand, check three independent sources, route on the
 * evidence, then answer, hedge, or state plainly that the feature is missing.
 *
 * A question that resolved before answers from the site graph with no model call at all. A new
 * question resolves to one control on the site; the route to it is read off the graph, so the
 * number of steps the widget announces is the number the walk takes.
 */
import { EFFORT, MODELS, MAX_ROUTE_STEPS, planRoute, routeProbes, validatePlan } from "@patchlet/shared";
import type {
  AnswerSource,
  ChatEvent,
  EscalationOffer,
  FeatureRequest,
  PageContext,
  PlanSummary,
  ProbeResult,
  Step,
  Verdict,
} from "@patchlet/shared";
import { chatJson, embed } from "../openai";
import { serviceClient } from "../supabase";
import { emitTrace } from "../trace";
import {
  findKnownRoute,
  intentKey,
  loadGraph,
  nearestKnownRoute,
  recordScan,
  saveKnownRoute,
  touchKnownRoute,
  type KnownRoute,
  type StoredGraph,
} from "../graph/store";
import { currentPageOf } from "./bind";
import { loadVisitorFacts, rememberFromTurn } from "./memory";
import { affordanceList, dropRepeats } from "./page";
import { probeCapabilities, probeDocs, probeInterface, type DocsEvidence } from "./probes";
import { noteRequest } from "./requests";
import { bindFirstStep, candidatesFor, resolveTarget } from "./resolve";
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
  /** The project's own thresholds, from `project.settings`. */
  thresholds?: { docsThreshold?: number; interfaceThreshold?: number };
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

type Understanding = { intent: "howto" | "feature" | "other"; feature: string };

type BoundRoute = {
  steps: Step[];
  target: { route: string; key: string };
  destination: { route: string; title: string };
};

/**
 * A route the graph can walk from this page, bound to the live control it starts with. The
 * model's captions are used when they pass the same checks as any plan; otherwise the route keeps
 * the captions written from the controls themselves, which always pass.
 */
function routeFromHere(
  graph: StoredGraph,
  page: PageContext,
  target: { route: string; key: string },
  captions: string[] = [],
): BoundRoute | { failed: string } {
  const plan = planRoute(graph, currentPageOf(page), target, captions);
  if (!plan) return { failed: "the product map has no route from this page to the target" };
  if (plan.steps.length === 0) return { failed: "the target is already active on this page" };
  const bound = bindFirstStep(plan.steps, page);
  if (!bound) return { failed: `the first control of the route, "${plan.steps[0]?.control.name}", is not on the page as scanned` };
  let steps = validatePlan(bound, page.affordances, MAX_ROUTE_STEPS);
  if (!steps && captions.length > 0) {
    const plain = planRoute(graph, currentPageOf(page), target);
    const rebound = plain ? bindFirstStep(plain.steps, page) : null;
    steps = rebound ? validatePlan(rebound, page.affordances, MAX_ROUTE_STEPS) : null;
  }
  if (!steps) return { failed: "the route did not pass validation" };
  const destination = graph.pages.find((candidate) => candidate.route === plan.target.route);
  return {
    steps,
    target: plan.target,
    destination: { route: plan.target.route, title: destination?.title ?? plan.target.route },
  };
}

type Persisted = { messageId: string };

async function persistAnswer(input: {
  conversationId: string;
  text: string;
  steps: Step[] | null;
  probes: ProbeResult[];
  verdict: Verdict;
  request: FeatureRequest | null;
  grounding: unknown;
}): Promise<Persisted> {
  const { data } = await serviceClient()
    .from("message")
    .insert({
      conversation_id: input.conversationId,
      role: "assistant",
      content: input.text,
      steps: input.steps,
      probes: input.probes,
      verdict: input.verdict,
      feature_request: input.request,
      grounding: input.grounding,
    })
    .select("id")
    .single();
  return { messageId: (data?.id as string) ?? "" };
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

  // 2. The page joins the site graph, and a question asked before answers from it at once.
  //
  // The scan is what makes the current page a node a route can start from, so it is written
  // before the graph is read. The visitor's facts and the exact-intent lookup need no model and
  // run beside it.
  const turnStarted = Date.now();
  const intent = intentKey(question);
  const questionEmbedding = embed([question]).then(([vector]) => {
    if (!vector) throw new Error("The embedding service returned nothing for the question");
    return vector;
  });
  // Claimed here so a failure surfaces at the probe that uses it, not as an unhandled rejection.
  questionEmbedding.catch(() => undefined);

  // The understanding call is the longest thing a new question waits on, so it starts now, beside
  // the lookups. A known route makes it unnecessary, and then its answer is simply not read.
  const understandStarted = Date.now();
  const understandingPromise = chatJson<Understanding>(
    MODELS.understand,
    [
      {
        role: "system",
        content:
          "Read one support question. Name the capability the user wants, in their own terms, in two to five words: what they want to do, not the area of the product it belongs to. For example 'finding seats together' or 'changing a seat', never 'seat selection' for both. Answer with JSON only.",
      },
      { role: "user", content: question },
    ],
    UNDERSTANDING_SCHEMA,
    { name: "understanding", maxTokens: 2000, effort: EFFORT.understand },
  );
  understandingPromise.catch(() => undefined);

  const [, memory, known] = await Promise.all([
    recordScan(projectId, page, "widget").catch(() => undefined),
    loadVisitorFacts(projectId, input.visitorId),
    findKnownRoute(projectId, intent).catch(() => null),
  ]);
  const graph = await loadGraph(projectId);

  let cached: KnownRoute | null = known;
  if (!cached) {
    // A new wording of a known question costs the embedding the docs check needs anyway.
    cached = await questionEmbedding.then((vector) => nearestKnownRoute(projectId, vector)).catch(() => null);
  }
  if (cached) {
    const route = routeFromHere(graph, page, cached.target);
    if (!("failed" in route)) {
      yield { type: "understanding", feature: cached.feature, intent: "howto", memory };
      const plan: PlanSummary = { source: "cached", total: route.steps.length, destination: route.destination };
      const verdict: Verdict = {
        outcome: "answer",
        confidence: 0.9,
        reasoning: `A question with this intent resolved before to "${cached.target.key.split("|")[1] ?? ""}" on ${route.destination.title}.`,
        feature: cached.feature,
      };
      const persisted = await persistAnswer({
        conversationId,
        text: cached.answer,
        steps: route.steps,
        probes: [],
        verdict,
        request: null,
        grounding: null,
      });
      void emitTrace({
        projectId,
        conversationId,
        kind: "decision",
        title: `Known route: ${route.steps.length} step${route.steps.length === 1 ? "" : "s"} from the product map`,
        detail: {
          source: "cached",
          intent: cached.intent,
          feature: cached.feature,
          target: cached.target,
          destination: route.destination,
          steps: route.steps.map((step) => step.caption),
          modelCalls: 0,
          latencyMs: Date.now() - turnStarted,
        },
        source: "agent",
      });
      yield {
        type: "answer",
        text: cached.answer,
        steps: route.steps,
        escalation: { offered: false },
        noted: false,
        plan,
        sources: cached.sources,
      };
      yield { type: "conversation", conversationId, messageId: persisted.messageId || messageId };
      void touchKnownRoute(cached.id, cached.hitCount).catch(() => undefined);
      // The console's outcome, without a model: the walk was shown, and that is the summary.
      await db
        .from("conversation")
        .update({ outcome: "solved", summary: `Showed the way to ${cached.feature} from a known route.` })
        .eq("id", conversationId);
      return;
    }
  }

  // 3. Understand what the user is actually asking about.
  const understanding = await understandingPromise;
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

  // 4. Three independent checks, run together so the slowest bounds the turn.
  for (const probe of ["docs", "interface", "repository"] as const) {
    yield { type: "probe", probe, status: "running" };
  }
  const [docs, ui, capabilities] = await Promise.all([
    probeDocs(`${question} ${understanding.feature}`, projectId, questionEmbedding, input.thresholds?.docsThreshold),
    Promise.resolve(probeInterface(question, page, understanding.feature)),
    probeCapabilities(
      projectId,
      understanding.feature,
      graph,
      input.repoFullName,
      input.defaultBranch,
      input.thresholds?.interfaceThreshold,
    ),
  ]);
  const probes: ProbeResult[] = [docs, ui, capabilities];
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

  // 5. Route on the evidence. Absence is confirmed by a reasoning model.
  let outcome = routeProbes(probes, input.thresholds);
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

  // 6. Answer.
  let text = "";
  let steps: Step[] | null = null;
  let request: FeatureRequest | null = null;
  let plan: PlanSummary | undefined;
  let sources: AnswerSource[] = [];

  // The docs passages behind this answer, kept on the message so continuing the
  // guidance later does not have to search for them again.
  let grounding: unknown = null;

  if (outcome === "answer") {
    grounding = docs.evidence;
    const docsEvidence = (Array.isArray(docs.evidence) ? docs.evidence : []) as DocsEvidence[];
    const candidates = graph.controls.length > 0 ? candidatesFor(graph, understanding.feature, page, docsEvidence) : [];

    let answered = false;
    if (candidates.length > 0) {
      // The graph knows controls for this. The model picks one and writes the words; the route
      // is already computed for every candidate, so the count is fixed before the model speaks.
      const resolution = await resolveTarget({
        question,
        feature: understanding.feature,
        candidates,
        docs: docsEvidence,
        docsHit: docs.hit,
        memory,
      });
      void emitTrace({
        projectId,
        conversationId,
        kind: "model",
        title: resolution.target ? `Resolved the target: "${resolution.target.control.name}"` : "No control does exactly this",
        detail: {
          model: MODELS.plan,
          purpose: "choose the control that does what was asked and write the answer",
          output_summary: resolution.answer,
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.control.name,
            route: candidate.control.route,
            score: Number(candidate.score.toFixed(2)),
            steps: candidate.route?.steps.length ?? null,
          })),
          chosen: resolution.target?.id ?? null,
          latencyMs: resolution.latencyMs,
        },
        source: "agent",
      });
      sources = resolution.sources;
      if (resolution.target) {
        const target = { route: resolution.target.control.route, key: resolution.target.control.key };
        const route = routeFromHere(graph, page, target, resolution.captions);
        if ("failed" in route) {
          void emitTrace({
            projectId,
            conversationId,
            kind: "decision",
            status: "failed",
            title: "The route could not start from this page",
            detail: {
              target,
              reason: route.failed,
              from: currentPageOf(page).route,
              // What the widget saw, so a binding that failed can be explained from the trace.
              scanned: page.affordances.map((a) => `${a.id} ${a.role} "${a.name}"${a.landmark ? ` in ${a.landmark}` : ""}${a.href ? ` -> ${a.href}` : ""}${a.visible ? "" : " (hidden)"}`),
            },
            source: "agent",
          });
        } else {
          text = resolution.answer || `You can do this with "${resolution.target.control.name}" on ${route.destination.title}. I will show you.`;
          steps = route.steps;
          plan = { source: "graph", total: route.steps.length, destination: route.destination };
          answered = true;
          void emitTrace({
            projectId,
            conversationId,
            kind: "decision",
            title: `Planned the route: ${route.steps.length} step${route.steps.length === 1 ? "" : "s"} over the product map`,
            detail: {
              source: "graph",
              from: currentPageOf(page).route,
              target,
              destination: route.destination,
              steps: route.steps.map((step) => step.caption),
              latencyMs: Date.now() - turnStarted,
            },
            source: "agent",
          });
          void saveKnownRoute(projectId, {
            intent,
            feature: understanding.feature,
            question,
            target,
            answer: text,
            sources,
            embedding: await questionEmbedding.catch(() => null),
          }).catch((error: unknown) => console.warn("known route not saved:", (error as Error).message));
        }
      } else if (resolution.answer && docs.hit) {
        // The documentation answers it and no control is the answer: a policy, a fee, a rule.
        text = resolution.answer;
        answered = true;
      }
    }

    if (!answered) {
      // Nothing in the graph to route to: plan over the page in front of the user, as far as it
      // goes. The graph fills in from this scan, so the next question can do better.
      const planStarted = Date.now();
      const pagePlan = await chatJson<{ answer: string; steps: Step[] }>(
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
        title: "Planned the answer and the steps from this page",
        detail: {
          model: MODELS.plan,
          purpose: "answer from the documentation and name the controls on this page to point at",
          output_summary: pagePlan.answer,
          latencyMs: Date.now() - planStarted,
        },
        source: "agent",
      });
      text = pagePlan.answer;
      const known = new Set(page.affordances.map((a) => a.id));
      const reachable: Step[] = [];
      for (const step of dropRepeats(pagePlan.steps ?? [])) {
        if (typeof step.target !== "string" || !known.has(step.target)) break;
        reachable.push(step);
      }
      steps = validatePlan(reachable, page.affordances);
      if (steps) plan = { source: "page", total: steps.length };
      if (docs.hit) sources = sourcesFrom(docsEvidence);
    }
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
    const searched = (capabilities.evidence as { graph?: { pages: number; controls: number } } | null)?.graph;
    const where = searched && searched.controls > 0
      ? `I checked the documentation, this page, and ${searched.pages} ${searched.pages === 1 ? "page" : "pages"} with ${searched.controls} controls of this product, and found nothing.`
      : "I checked the documentation, this page, and what this product is known to do, and found nothing.";
    text =
      outcome === "absent"
        ? `I am sorry, there is no way of ${understanding.feature} here today. ${where}${offer}`
        : `I could not confirm that ${understanding.feature} is possible here. I did not find it in the documentation or on this page.${offer}`;
  }

  const persisted = await persistAnswer({ conversationId, text, steps, probes, verdict, request, grounding });

  // Even when the user never asks for it, a gap the agent found is worth the developers knowing.
  // It joins the other reports of the same gap and rises with them.
  const noted = request
    ? await noteRequest({
        projectId,
        request,
        conversationId,
        messageId: persisted.messageId || null,
      })
    : false;

  yield {
    type: "answer",
    text,
    steps,
    escalation: escalationOffer(request, input.repoFullName),
    noted,
    ...(plan ? { plan } : {}),
    ...(sources.length ? { sources } : {}),
  };

  // The widget escalates against the assistant message, so hand its id back.
  yield { type: "conversation", conversationId, messageId: persisted.messageId || messageId };

  // 7. Remember anything durable the visitor said about themselves, for their next visit.
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

  // 8. Record how this ended. The user already has the answer; this is only for the console.
  try {
    await closeConversation({ conversationId, question, answer: text, steps, verdict });
  } catch {
    // A missing outcome shows as "in progress" in the console and is not worth failing a turn.
  }
}

/** The articles behind a documentation-grounded answer, at most two, in the order they matched. */
function sourcesFrom(docs: DocsEvidence[]): AnswerSource[] {
  const seen = new Set<string>();
  const sources: AnswerSource[] = [];
  for (const entry of docs) {
    const title = entry.documentTitle.trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);
    sources.push({ title, url: entry.url });
  }
  return sources.slice(0, 2);
}
