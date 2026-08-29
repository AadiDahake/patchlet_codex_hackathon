/**
 * The Capability IR as the forge engine consumes it.
 *
 * The specification is compiled elsewhere and validated against its JSON Schema before it is
 * stored. The engine still checks the fields it relies on at its own boundary, because a spec can
 * also arrive inline in a request body, and a malformed one must fail before a sandbox is paid for.
 */

export type IrSlot = {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  enum?: unknown[];
  range?: { min?: number; max?: number };
};

export type IrAction = {
  name: string;
  kind: "read" | "write" | "rank";
  description?: string;
  parameters: IrSlot[];
  returns?: string;
  /** Where the action already exists in the target repository. Absent means Codex builds it. */
  primitive?: { symbol?: string; file?: string; confidence?: number };
  idempotent?: boolean;
};

export type IrConstraint = {
  id: string;
  statement: string;
  source?: "trajectory" | "documentation" | "repository" | "policy" | "inferred";
  evidence_ref?: string;
};

export type IrPreference = {
  id: string;
  statement: string;
  direction: "minimize" | "maximize";
  weight?: number;
};

export type IrScenarioKind = "happy" | "edge" | "adversarial" | "concurrency" | "permission";

/** One test case. The count of these is the demo's denominator. */
export type IrScenario = {
  id: string;
  given: string;
  when?: string;
  then: string;
  kind?: IrScenarioKind;
};

export type IrTrajectoryStep = { t: string; event: string; props?: Record<string, unknown> };

export type IrTrajectory = {
  session_id: string;
  replay_url?: string;
  reward?: { completion?: number; coherence?: number; total?: number };
  steps: IrTrajectoryStep[];
};

export type CapabilityIr = {
  schema_version?: "1";
  intent: string;
  summary?: string;
  state: { inputs: IrSlot[]; observations: IrSlot[]; example?: Record<string, unknown> };
  actions: IrAction[];
  constraints: IrConstraint[];
  preferences?: IrPreference[];
  success: { postconditions: { id: string; statement: string }[]; scenarios: IrScenario[] };
  proposed_ui?: {
    location?: string;
    label?: string;
    affordance?: "button" | "menu_item" | "inline_panel" | "modal" | "toolbar_action";
    result_summary?: string;
  };
  evidence: {
    session_count: number;
    median_manual_actions?: number;
    window?: { from?: string; to?: string };
    trajectories: IrTrajectory[];
  };
  granularity?: {
    replaces_atomic_steps_median?: number;
    rejected_too_low?: string[];
    rejected_too_high?: string[];
    coverage?: number;
  };
  provenance?: {
    compiler_version?: string;
    model?: string;
    created_at?: string;
    opportunity_id?: string;
  };
};

const INTENT = /^[a-z][a-z0-9_]{2,63}$/;
const IDENT = /^[a-z][a-z0-9_]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(path: string, expected: string): never {
  throw new Error(`Capability IR: ${path} must be ${expected}.`);
}

function requireArray(record: Record<string, unknown>, key: string, path: string): unknown[] {
  const value = record[key];
  if (!Array.isArray(value)) fail(`${path}.${key}`, "an array");
  return value;
}

function requireString(record: Record<string, unknown>, key: string, path: string): string {
  const value = record[key];
  if (typeof value !== "string" || value === "") fail(`${path}.${key}`, "a non-empty string");
  return value;
}

/**
 * Checks the shape the engine depends on and returns the spec typed. Everything the schema allows
 * and the engine does not read passes through untouched.
 */
export function parseCapabilityIr(input: unknown): CapabilityIr {
  if (!isRecord(input)) fail("spec", "an object");

  const intent = requireString(input, "intent", "spec");
  if (!INTENT.test(intent)) fail("spec.intent", "snake_case, 3 to 64 characters");

  if (!isRecord(input.state)) fail("spec.state", "an object");
  requireArray(input.state, "inputs", "spec.state");
  requireArray(input.state, "observations", "spec.state");

  const actions = requireArray(input, "actions", "spec");
  if (actions.length === 0) fail("spec.actions", "a non-empty array");
  actions.forEach((action, index) => {
    if (!isRecord(action)) fail(`spec.actions[${index}]`, "an object");
    requireString(action, "name", `spec.actions[${index}]`);
    if (!["read", "write", "rank"].includes(String(action.kind))) {
      fail(`spec.actions[${index}].kind`, "read, write or rank");
    }
  });

  const constraints = requireArray(input, "constraints", "spec");
  if (constraints.length === 0) fail("spec.constraints", "a non-empty array");
  constraints.forEach((constraint, index) => {
    if (!isRecord(constraint)) fail(`spec.constraints[${index}]`, "an object");
    const id = requireString(constraint, "id", `spec.constraints[${index}]`);
    if (!IDENT.test(id)) fail(`spec.constraints[${index}].id`, "snake_case");
    requireString(constraint, "statement", `spec.constraints[${index}]`);
  });

  if (!isRecord(input.success)) fail("spec.success", "an object");
  const postconditions = requireArray(input.success, "postconditions", "spec.success");
  if (postconditions.length === 0) fail("spec.success.postconditions", "a non-empty array");
  const scenarios = requireArray(input.success, "scenarios", "spec.success");
  if (scenarios.length === 0) fail("spec.success.scenarios", "a non-empty array");
  const seen = new Set<string>();
  scenarios.forEach((scenario, index) => {
    if (!isRecord(scenario)) fail(`spec.success.scenarios[${index}]`, "an object");
    const id = requireString(scenario, "id", `spec.success.scenarios[${index}]`);
    if (!IDENT.test(id)) fail(`spec.success.scenarios[${index}].id`, "snake_case");
    if (seen.has(id)) fail(`spec.success.scenarios[${index}].id`, "unique");
    seen.add(id);
    requireString(scenario, "given", `spec.success.scenarios[${index}]`);
    requireString(scenario, "then", `spec.success.scenarios[${index}]`);
  });

  if (!isRecord(input.evidence)) fail("spec.evidence", "an object");
  const sessionCount = input.evidence.session_count;
  if (typeof sessionCount !== "number" || !Number.isInteger(sessionCount) || sessionCount < 1) {
    fail("spec.evidence.session_count", "a positive integer");
  }
  const trajectories = requireArray(input.evidence, "trajectories", "spec.evidence");
  if (trajectories.length === 0) fail("spec.evidence.trajectories", "a non-empty array");

  return input as unknown as CapabilityIr;
}

/** The scenario ids in specification order. The verifier reports against exactly these. */
export function scenarioIds(ir: CapabilityIr): string[] {
  return ir.success.scenarios.map((scenario) => scenario.id);
}

/** `seat_party_together` -> `seat-party-together`, for branch names and paths. */
export function intentSlug(ir: CapabilityIr): string {
  return ir.intent.replace(/_/g, "-");
}

/** `seat_party_together` -> `seat party together`, for prose. */
export function intentWords(ir: CapabilityIr): string {
  return ir.intent.replace(/_/g, " ");
}
