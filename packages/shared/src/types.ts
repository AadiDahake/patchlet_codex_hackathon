/** An interactive element the widget found on the host page. */
export type Affordance = {
  id: string;            // opaque, e.g. "a7"; the only handle the model gets
  role: string;          // button | link | textbox | checkbox | tab | menuitem | switch | combobox
  name: string;          // accessible name
  text?: string;         // visible text when different from name
  landmark?: string;     // nearest landmark or labelled region: "sidebar", "header", "main", "dialog"
  href?: string;         // for links
  visible: boolean;      // in viewport and hit-testable
  disabled?: boolean;
  state?: string;        // "selected", "expanded", "checked" and so on, when the control has one
};

export type PageContext = { url: string; title: string; affordances: Affordance[] };

export type Step = {
  target: string;
  caption: string;
  advanceOn: "click" | "input" | "navigation" | "manual";
};

export type ProbeName = "docs" | "interface" | "repository";

export type ProbeResult = {
  probe: ProbeName;
  hit: boolean;
  score: number | null;
  summary: string;
  evidence: unknown;
  latencyMs: number;
};

export type VerdictOutcome = "answer" | "hedge" | "absent";

export type Verdict = {
  outcome: VerdictOutcome;
  confidence: number;
  reasoning: string;
  feature: string;
};

export type FeatureRequest = {
  title: string;
  description: string;
  area: string;
  quote: string;
  rationale: string;
};

/** How much weight a request group carries. Derived from its two counts, never set by hand. */
export type RequestPriority = "low" | "medium" | "high";

/** Where a request group has got to. `observed` means noticed but not yet on GitHub. */
export type RequestGroupStatus =
  | "observed"
  | "filed"
  | "drafting"
  | "pr_open"
  | "awaiting_approval"
  | "shipped"
  | "rejected";

/**
 * One gap in the product, however many conversations reached it.
 *
 * The counts are what turn a quiet observation into work: `reportCount` is every conversation
 * where the agent found the gap, `userReportCount` the subset where the user asked for it.
 */
export type RequestGroup = {
  id: string;
  title: string;
  description: string;
  area: string;
  reportCount: number;
  userReportCount: number;
  priority: RequestPriority;
  status: RequestGroupStatus;
  issueUrl: string | null;
  issueNumber: number | null;
  prUrl: string | null;
  /** The run currently carrying this group forward, whose trace the console streams. */
  escalationId: string | null;
  firstSeen: string;
  lastSeen: string;
};

/** Body of `POST /api/chat`. */
export type ChatRequest = {
  key: string;
  conversationId?: string;
  /** Random id the widget keeps in the visitor's browser, the key of the agent's memory. */
  visitorId?: string;
  question: string;
  page: PageContext;
  continueFrom?: number;
};

/** Body of `POST /api/escalate`. */
export type EscalateRequest = {
  key: string;
  conversationId?: string;
  messageId: string;
  visitorId?: string;
};

/** How a visitor rated one answer in the widget. */
export type FeedbackRating = "up" | "down";

/** Body of `POST /api/feedback`. */
export type FeedbackRequest = {
  key: string;
  messageId: string;
  rating: FeedbackRating;
  note?: string;
};

/**
 * Whether the agent offered to report a missing feature.
 *
 * `reason` says why it could not: today the only one is a project with no repository bound, which
 * the widget explains rather than offering a button that cannot work.
 */
export type EscalationOffer =
  | { offered: true; request: FeatureRequest }
  | { offered: false; reason?: "no_repository" };

/** `/api/chat` server-sent events, in order of emission. */
export type ChatEvent =
  | { type: "conversation"; conversationId: string; messageId: string }
  | {
      type: "understanding";
      feature: string;
      intent: "howto" | "feature" | "other";
      /** What the agent already knows about this visitor, oldest first. Empty on a first visit. */
      memory: string[];
    }
  | { type: "probe"; probe: ProbeName; status: "running" }
  | { type: "probe"; probe: ProbeName; status: "done"; result: ProbeResult }
  | { type: "verdict"; verdict: Verdict }
  | {
      type: "answer";
      text: string;
      steps: Step[] | null;
      escalation: EscalationOffer;
      /** The gap was recorded for the developers without the user having to ask. */
      noted?: boolean;
    }
  | { type: "error"; message: string };

/**
 * One run of the worker. `updated` is the terminal state of a run that only carried a new count
 * and quote to an issue and pull request that already exist.
 */
export type EscalationStatus =
  | "queued"
  | "filing"
  | "filed"
  | "inspecting"
  | "drafting"
  | "pr_open"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "merging"
  | "deploying"
  | "shipped"
  | "updated"
  | "failed";

/**
 * What builds the change.
 *
 * `local` is the worker's own runner: it files the issue, drafts the diff and opens the pull
 * request in one process. `forge` is the Reflex/Runloop engine, which builds and verifies the
 * capability inside isolated sandboxes. `forge` is a named seam only: nothing implements it yet,
 * and selecting it is refused at the API boundary rather than accepted and dropped.
 */
export type EscalationEngine = "local" | "forge";

export type TraceEvent = {
  id: number;
  projectId: string;
  conversationId: string | null;
  escalationId: string | null;
  source: "agent" | "workflow";
  kind:
    | "probe"
    | "verdict"
    | "decision"
    | "model"
    | "tool"
    | "artifact"
    | "pause"
    | "status"
    | "error";
  status: "running" | "ok" | "failed";
  title: string;
  detail: unknown;
  createdAt: string;
};
