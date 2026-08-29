// Contract types shared with the API. Once @patchlet/shared is available this file
// becomes a re-export of it, so nothing else in the widget imports the contract
// from anywhere but here.

export type Affordance = {
  id: string;
  role: string;
  name: string;
  text?: string;
  landmark?: string;
  href?: string;
  visible: boolean;
  disabled?: boolean;
  state?: string;
};

export type PageContext = { url: string; title: string; affordances: Affordance[] };

export type Step = {
  target: string;
  caption: string;
  advanceOn: 'click' | 'input' | 'navigation' | 'manual';
};

export type ProbeName = 'docs' | 'interface' | 'repository';

export type ProbeResult = {
  probe: ProbeName;
  hit: boolean;
  score: number | null;
  summary: string;
  evidence: unknown;
  latencyMs: number;
};

export type VerdictOutcome = 'answer' | 'hedge' | 'absent';

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

/** Why the widget cannot report a missing feature: refused up front, or refused when it tried. */
export type ReportBlock = 'no_repository' | 'failed';

export type EscalationOffer =
  | { offered: true; request: FeatureRequest }
  | { offered: false; reason?: 'no_repository' };

export type ChatEvent =
  | { type: 'conversation'; conversationId: string; messageId: string }
  | { type: 'understanding'; feature: string; intent: 'howto' | 'feature' | 'other'; memory: string[] }
  | { type: 'probe'; probe: ProbeName; status: 'running' }
  | { type: 'probe'; probe: ProbeName; status: 'done'; result: ProbeResult }
  | { type: 'verdict'; verdict: Verdict }
  | {
      type: 'answer';
      text: string;
      steps: Step[] | null;
      escalation: EscalationOffer;
      /** The gap was recorded for the developers without the user having to ask. */
      noted?: boolean;
    }
  | { type: 'error'; message: string };

export type EscalationStatus =
  | 'queued'
  | 'filing'
  | 'filed'
  | 'inspecting'
  | 'drafting'
  | 'pr_open'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'merging'
  | 'deploying'
  | 'shipped'
  | 'updated'
  | 'failed';

/** Response shape of GET /api/escalations/:id. */
export type EscalationView = {
  id: string;
  status: EscalationStatus;
  issueUrl?: string | null;
  issueNumber?: number | null;
  prUrl?: string | null;
  prNumber?: number | null;
  deploymentUrl?: string | null;
  request?: FeatureRequest | null;
  approval?: { approved: boolean; note?: string; decidedAt?: string } | null;
  createdAt?: string;
};

/** How a visitor rated one answer. */
export type FeedbackRating = 'up' | 'down';

/** Body of POST /api/feedback. */
export type FeedbackRequest = {
  key: string;
  messageId: string;
  rating: FeedbackRating;
  note?: string;
};

/** Body of POST /api/chat. */
export type ChatRequest = {
  key: string;
  conversationId?: string;
  /** Random id kept in this browser, the key of what the agent remembers. */
  visitorId?: string;
  question: string;
  page: PageContext;
  continueFrom?: number;
};
