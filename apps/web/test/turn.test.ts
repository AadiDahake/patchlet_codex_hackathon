/**
 * One turn, end to end, against a stubbed provider and a stubbed database.
 *
 * The two cases are the whole point of intent routing: "Hello, can you hear me?" is answered
 * without a single check and with nothing offered to report, and "Where do I change my seat?"
 * still runs the three checks and still comes back with a walk over the product map.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatEvent } from "@patchlet/shared";
import { CONTROLS, NOVAAIR_GRAPH } from "../../../packages/shared/test/fixtures/novaair-graph";
import type { KnownRoute } from "@/lib/graph/store";
import { TRIP_PAGE } from "./fixtures/intents";

/** Every structured call the turn made, by the name it was sent under. */
const calls: { name: string; user: string }[] = [];
/** What each named call answers with. A call with no answer here is a fault in the test. */
let answers: Record<string, unknown> = {};
/** The rows the documentation search returns. Empty means the knowledge base has nothing. */
let chunks: Record<string, unknown>[] = [];
/** Every write the turn made, in order. */
const writes: { table: string; op: string; values: unknown }[] = [];

vi.mock("@/lib/openai", () => ({
  chatJson: async (
    _model: string,
    messages: { role: string; content: string }[],
    _schema: unknown,
    options: { name?: string },
  ) => {
    const name = options.name ?? "";
    calls.push({ name, user: messages[messages.length - 1]?.content ?? "" });
    if (!(name in answers)) throw new Error(`the turn made an unexpected "${name}" call`);
    return answers[name];
  },
  embed: async (inputs: string[]) => inputs.map(() => new Array(1536).fill(0)),
}));

vi.mock("@/lib/trace", () => ({ emitTrace: async () => undefined }));

class FakeQuery {
  constructor(private readonly table: string) {}

  insert(values: unknown): this {
    writes.push({ table: this.table, op: "insert", values });
    return this;
  }
  update(values: unknown): this {
    writes.push({ table: this.table, op: "update", values });
    return this;
  }
  select(): this {
    return this;
  }
  eq(): this {
    return this;
  }
  async single(): Promise<{ data: { id: string }; error: null }> {
    return { data: { id: `${this.table}-1` }, error: null };
  }
  // `update(...).eq(...)` is awaited without a terminal call of its own.
  then<T>(resolve: (value: { data: null; error: null }) => T): T {
    return resolve({ data: null, error: null });
  }
}

vi.mock("@/lib/supabase", () => ({
  serviceClient: () => ({
    from: (table: string) => new FakeQuery(table),
    rpc: async (name: string) =>
      name === "match_chunks_with_source" ? { data: chunks, error: null } : { data: [], error: null },
  }),
}));

/** The route this question resolved to last time, when the test wants one. */
let remembered: KnownRoute | null = null;

vi.mock("@/lib/graph/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/graph/store")>();
  return {
    ...actual,
    recordScan: async () => "page-1",
    loadGraph: async () => NOVAAIR_GRAPH,
    findKnownRoute: async () => remembered,
    nearestKnownRoute: async () => null,
    saveKnownRoute: async () => undefined,
    touchKnownRoute: async () => undefined,
  };
});

vi.mock("@/lib/agent/memory", () => ({
  loadVisitorFacts: async () => [],
  rememberFromTurn: async () => [],
}));

vi.mock("@/lib/agent/summary", () => ({ closeConversation: async () => "solved" }));

vi.mock("@/lib/agent/requests", () => ({
  noteRequest: async () => ({ noted: true, groupId: "group-1" }),
}));

/** The opportunity pipeline the absence path enqueues, kept off this turn and out of the network. */
const discoveries: unknown[] = [];
vi.mock("@/lib/opportunity/queue", () => ({
  triggerDiscovery: async (input: unknown) => {
    discoveries.push(input);
  },
}));

const { runTurn } = await import("@/lib/agent/turn");

/** The whole stream of one turn, in the order the widget would receive it. */
async function stream(question: string): Promise<ChatEvent[]> {
  const events: ChatEvent[] = [];
  for await (const event of runTurn({
    projectId: "project-1",
    repoFullName: "novaair/novaair",
    defaultBranch: "main",
    question,
    page: TRIP_PAGE,
  })) {
    events.push(event);
  }
  return events;
}

const answerOf = (events: ChatEvent[]) => events.find((event) => event.type === "answer");

beforeEach(() => {
  calls.length = 0;
  writes.length = 0;
  chunks = [];
  answers = {};
  remembered = null;
  discoveries.length = 0;
});

describe('"Hello, can you hear me?"', () => {
  beforeEach(() => {
    answers = {
      understanding: { intent: "chat", feature: "" },
      chat_answer: { answer: "I can read you. Ask me anything about this page.", found: true },
    };
  });

  it("answers from the model, with no check and nothing to report", async () => {
    const events = await stream("Hello, can you hear me?");

    expect(events.filter((event) => event.type === "probe")).toEqual([]);
    expect(events.filter((event) => event.type === "verdict")).toEqual([]);
    const answer = answerOf(events);
    expect(answer?.text).toBe("I can read you. Ask me anything about this page.");
    expect(answer?.steps).toBeNull();
    expect(answer?.escalation).toEqual({ offered: false });
    expect(answer?.noted).toBe(false);
  });

  it("makes exactly two model calls: the read, and the answer", async () => {
    await stream("Hello, can you hear me?");
    expect(calls.map((call) => call.name)).toEqual(["understanding", "chat_answer"]);
  });

  it("says the message is chat, and names no capability", async () => {
    const events = await stream("Hello, can you hear me?");
    const understanding = events.find((event) => event.type === "understanding");
    expect(understanding).toMatchObject({ intent: "chat", feature: "" });
  });

  it("stores the answer with no verdict and no feature request", async () => {
    await stream("Hello, can you hear me?");
    const message = writes.find(
      (write) => write.table === "message" && (write.values as { role?: string }).role === "assistant",
    );
    expect(message?.values).toMatchObject({ role: "assistant", steps: null, probes: [], verdict: null, feature_request: null });
  });
});

describe('"Where do I change my seat?"', () => {
  beforeEach(() => {
    chunks = [
      {
        document_title: "How do I change my seat?",
        source_ref: "http://localhost:4150/help/how-do-i-change-my-seat",
        heading: "Change a seat online",
        content: "Open Manage Trip, go to the Seats section and select Change seats to change your seat.",
        similarity: 0.94,
        confidence: null,
      },
    ];
    answers = {
      understanding: { intent: "product", feature: "changing a seat" },
      resolve_target: {
        target: "c1",
        answer: 'You can do this with "Change seats" on Manage Trip. I will show you.',
        captions: ["Select the Seats tab", "Open Change seats"],
      },
    };
  });

  it("runs the three checks and comes back with a walk", async () => {
    const events = await stream("Where do I change my seat?");

    expect(events.filter((event) => event.type === "probe" && event.status === "done").map((event) => event.probe)).toEqual([
      "docs",
      "interface",
      "repository",
    ]);
    const verdict = events.find((event) => event.type === "verdict");
    expect(verdict?.verdict.outcome).toBe("answer");

    const answer = answerOf(events);
    expect(answer?.steps?.length).toBeGreaterThan(0);
    // The first step is bound to a control the widget really sent, by its identity on the map.
    expect(answer?.steps?.[0]?.target).toBe("a4");
    expect(answer?.steps?.[0]?.control?.name).toBe("Change seats");
    expect(answer?.plan).toMatchObject({ source: "graph", total: answer?.steps?.length });
    expect(answer?.escalation).toEqual({ offered: false });
  });

  it("never drafts a feature request when the product has the control", async () => {
    await stream("Where do I change my seat?");
    expect(calls.map((call) => call.name)).toEqual(["understanding", "resolve_target"]);
  });
});

describe('"What is my confirmation code?"', () => {
  beforeEach(() => {
    answers = {
      understanding: { intent: "page", feature: "" },
      page_answer: { answer: "Your confirmation code is NVA7K2.", found: true },
    };
  });

  it("answers from the page, with no check and nothing to report", async () => {
    const events = await stream("What is my confirmation code?");

    expect(events.filter((event) => event.type === "probe")).toEqual([]);
    expect(calls.map((call) => call.name)).toEqual(["understanding", "page_answer"]);
    const answer = answerOf(events);
    expect(answer?.text).toBe("Your confirmation code is NVA7K2.");
    expect(answer?.escalation).toEqual({ offered: false });
  });

  it("gives the model the page's own words and its controls", async () => {
    await stream("What is my confirmation code?");
    const call = calls.find((entry) => entry.name === "page_answer")!;
    expect(call.user).toContain("Confirmation NVA7K2");
    expect(call.user).toContain('link "Change seats"');
  });
});

describe('a mixed message whose product half is missing', () => {
  beforeEach(() => {
    chunks = [
      {
        document_title: "Traveling with children",
        source_ref: "http://localhost:4150/help/traveling-with-children",
        heading: "Lap infants",
        content: "A lap infant under two years old travels free on domestic flights. Call us to add one.",
        similarity: 0.6,
        confidence: null,
      },
    ];
    answers = {
      understanding: { intent: "mixed", feature: "adding a lap infant" },
      passage_read: { covers: false, reason: "the passage says to call, not that the product does it" },
      verdict: { exists: false, confidence: 0.8, reasoning: "no control and no passage says it can be done" },
      feature_request: {
        title: "Add a lap infant to a booking",
        description: "Let a passenger add an infant under two to an existing booking.",
        area: "booking",
        quote: "Are lap infants free, and how do I add one to this booking?",
        rationale: "The help center sends the customer to the phone.",
      },
      passage_answer: { answer: "A lap infant under two flies free on domestic flights.", found: true },
    };
  });

  it("answers from the documentation first, then states the absence", async () => {
    const events = await stream("Are lap infants free, and how do I add one to this booking?");

    const verdict = events.find((event) => event.type === "verdict");
    expect(verdict?.verdict.outcome).toBe("absent");
    const answer = answerOf(events);
    expect(answer?.text).toMatch(/^A lap infant under two flies free on domestic flights\./);
    expect(answer?.text).toContain("There is still no way of adding a lap infant here today.");
    expect(answer?.escalation).toMatchObject({ offered: true });
    expect(answer?.noted).toBe(true);
    // The gap goes to the opportunity pipeline, off this turn.
    expect(discoveries).toHaveLength(1);
    expect(answer?.sources).toEqual([
      { title: "Traveling with children", url: "http://localhost:4150/help/traveling-with-children" },
    ]);
  });
});

describe("a question asked before", () => {
  it("answers from the product map without waiting for the message to be read", async () => {
    // The read is in flight, as it is on every turn, and this one never comes back. The turn
    // still finishes, which is what "served before the message is read" means.
    answers = { understanding: new Promise(() => undefined) };
    remembered = {
      id: "route-1",
      intent: "change my seat where",
      feature: "changing a seat",
      question: "Where do I change my seat?",
      target: { route: CONTROLS.changeSeats.route, key: CONTROLS.changeSeats.key },
      answer: 'You can do this with "Change seats" on Manage Trip. I will show you.',
      sources: [],
      hitCount: 3,
      similarity: null,
    };

    const events = await stream("Where do I change my seat?");

    expect(calls.map((call) => call.name)).toEqual(["understanding"]);
    const answer = answerOf(events);
    expect(answer?.plan).toMatchObject({ source: "cached", total: 1 });
    expect(events.find((event) => event.type === "understanding")).toMatchObject({ intent: "product" });
  });
});
