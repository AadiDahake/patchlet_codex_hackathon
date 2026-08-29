import type { Affordance, Step } from '../types';
import type { ScanResult } from '../scan/affordances';
import { isPointable } from './geometry';
import { domSettled } from './navigation';

export type GuideState = 'SPOTLIGHTING' | 'VERIFYING' | 'SNAPSHOTTING' | 'DONE' | 'FAILED';

export type GuideSnapshot = {
  state: GuideState;
  stepIndex: number;
  total: number;
  step: Step | null;
  target: Element | null;
  message: string | null;
};

export type GuideDeps = {
  /** A fresh scan of the host page. */
  rescan: () => ScanResult;
  /**
   * Asks the agent for the steps that are still outstanding, given the page as
   * it looks now. Returns the scan those step ids belong to.
   */
  replan: (continueFrom: number) => Promise<(ScanResult & { steps: Step[] }) | null>;
  onChange: (snapshot: GuideSnapshot) => void;
  /** Navigation plus debounced mutations; the machine only needs "something moved". */
  watch?: (onPageChanged: () => void) => () => void;
  /** Resolves once the DOM has stopped changing after an action. */
  settle?: () => Promise<void>;
  doc?: Document;
  settleMs?: number;
};

/**
 * How long after a press the control may vanish and still count as that press
 * having worked. Menus and dialogs unmount their trigger before the browser can
 * deliver a click, so the press is the only evidence the action happened.
 */
const ACTIVATION_WINDOW_MS = 1500;

/** How many times a step may be re-planned before guidance gives up on it. */
const MAX_RECOVERIES = 3;

/** When to look for the pressed control having gone, inside that window. */
const VANISH_CHECKS_MS = [0, 120, 400, 900, ACTIVATION_WINDOW_MS];

/**
 * Drives one guidance run. It never focuses anything: the user keeps control of
 * the host page and the machine only observes what they do.
 */
export class GuideMachine {
  private state: GuideState = 'DONE';
  private steps: Step[] = [];
  private index = 0;
  private lookup = new Map<string, Element>();
  private affordances = new Map<string, Affordance>();
  private target: Element | null = null;
  private message: string | null = null;
  private unwatch: (() => void) | null = null;
  private replanning = false;
  /** Consecutive re-plans that have not moved the user on. */
  private recoveries = 0;
  /** The control the user pressed, and when, while we wait to see what it did. */
  private pressed: { element: Element; at: number; index: number } | null = null;
  private vanishTimers: ReturnType<typeof setTimeout>[] = [];

  private readonly doc: Document;
  private readonly settleMs: number;

  constructor(private readonly deps: GuideDeps) {
    this.doc = deps.doc ?? document;
    this.settleMs = deps.settleMs ?? 300;
  }

  get snapshot(): GuideSnapshot {
    return {
      state: this.state,
      stepIndex: this.index,
      total: this.steps.length,
      step: this.steps[this.index] ?? null,
      target: this.target,
      message: this.message,
    };
  }

  start(scan: ScanResult, steps: Step[]): void {
    this.stopListening();
    this.steps = steps;
    this.index = 0;
    this.message = null;
    this.adoptScan(scan);
    for (const type of ['pointerdown', 'click', 'keydown', 'input', 'change'] as const) {
      this.doc.addEventListener(type, this.onUserEvent, true);
    }
    if (this.deps.watch) this.unwatch = this.deps.watch(this.onPageChanged);
    this.enterSpotlight();
  }

  /** The Next button: advance whatever the step said it was waiting for. */
  next(): void {
    if (this.state !== 'SPOTLIGHTING' && this.state !== 'VERIFYING') return;
    void this.enterSnapshot();
  }

  /**
   * The view could not draw the current target. Treat it as gone rather than
   * leaving a caption pinned to a control nobody can see.
   *
   * Only while the machine is actually pointing at something: in every other
   * state it is already dealing with the change, and a control that vanished
   * because the user pressed it is a success, not a loss.
   */
  lost(): void {
    if (this.state !== 'SPOTLIGHTING') return;
    void this.recover();
  }

  stop(): void {
    this.stopListening();
    this.target = null;
    this.transition('DONE');
  }

  dispose(): void {
    this.stopListening();
  }

  private stopListening(): void {
    this.clearVanishChecks();
    this.pressed = null;
    for (const type of ['pointerdown', 'click', 'keydown', 'input', 'change'] as const) {
      this.doc.removeEventListener(type, this.onUserEvent, true);
    }
    this.unwatch?.();
    this.unwatch = null;
  }

  private adoptScan(scan: ScanResult): void {
    this.lookup = scan.lookup;
    this.affordances = new Map(scan.page.affordances.map((affordance) => [affordance.id, affordance]));
  }

  private transition(state: GuideState): void {
    this.state = state;
    this.deps.onChange(this.snapshot);
  }

  private enterSpotlight(): void {
    const step = this.steps[this.index];
    if (!step) {
      this.stopListening();
      this.target = null;
      this.transition('DONE');
      return;
    }
    const element = this.lookup.get(step.target) ?? null;
    if (!isPointable(element)) {
      this.target = null;
      void this.recover();
      return;
    }
    this.target = element;
    this.message = null;
    this.transition('SPOTLIGHTING');
  }

  private readonly onUserEvent = (event: Event): void => {
    if (this.state !== 'SPOTLIGHTING' || !this.target) return;
    const step = this.steps[this.index];
    if (!step) return;
    if (!hits(event, this.target)) return;

    // A press is not an advance on its own, but it is proof the user acted. If
    // the control disappears right after it, the action landed and the click
    // that would have confirmed it never had a node to fire on.
    if (event.type === 'pointerdown') {
      if (step.advanceOn !== 'click' && step.advanceOn !== 'navigation') return;
      this.arm(this.target);
      return;
    }

    if (!acceptsEvent(step.advanceOn, event.type)) return;
    if (event.type === 'keydown') {
      const key = (event as KeyboardEvent).key;
      if (key !== 'Enter' && key !== ' ' && key !== 'Spacebar') return;
    }
    this.enterVerifying();
  };

  /** Starts the window in which the pressed control may vanish and still count. */
  private arm(element: Element): void {
    this.clearVanishChecks();
    this.pressed = { element, at: Date.now(), index: this.index };
    for (const delay of VANISH_CHECKS_MS) {
      this.vanishTimers.push(setTimeout(() => this.checkPressedVanished(), delay));
    }
  }

  private clearVanishChecks(): void {
    for (const timer of this.vanishTimers) clearTimeout(timer);
    this.vanishTimers = [];
  }

  private checkPressedVanished(): void {
    const pressed = this.pressed;
    if (!pressed || this.state !== 'SPOTLIGHTING' || pressed.index !== this.index) return;
    if (Date.now() - pressed.at > ACTIVATION_WINDOW_MS) {
      this.clearVanishChecks();
      this.pressed = null;
      return;
    }
    if (isPointable(pressed.element)) return;
    this.clearVanishChecks();
    this.pressed = null;
    this.enterVerifying();
  }

  private enterVerifying(): void {
    this.clearVanishChecks();
    this.pressed = null;
    this.transition('VERIFYING');
    void this.settle().then(() => {
      if (this.state !== 'VERIFYING') return;
      void this.enterSnapshot();
    });
  }

  private settle(): Promise<void> {
    if (this.deps.settle) return this.deps.settle();
    return domSettled(this.settleMs, ACTIVATION_WINDOW_MS, this.doc.body);
  }

  /** Re-reads the page after an action and binds the next step to it. */
  private async enterSnapshot(): Promise<void> {
    this.clearVanishChecks();
    this.pressed = null;
    this.transition('SNAPSHOTTING');
    this.index += 1;
    this.recoveries = 0;
    if (this.index >= this.steps.length) {
      // A flow often continues behind whatever the last click opened, so the
      // plan we hold is only as far as the page could be read at the time.
      // Ask for the rest before deciding the user is finished.
      await this.continueOrFinish();
      return;
    }
    // Ids are positional, so a re-render can point the same id at a different
    // control. Rebind the next step by identity instead of trusting its id.
    const step = this.steps[this.index];
    const wanted = this.affordances.get(step.target);
    const scan = this.deps.rescan();
    const rebound = wanted ? findEquivalent(scan, wanted) : null;
    this.adoptScan(scan);
    if (wanted && !rebound) {
      await this.recover();
      return;
    }
    if (rebound && rebound !== step.target) {
      this.steps = this.steps.map((current, position) =>
        position === this.index ? { ...current, target: rebound } : current,
      );
    }
    this.enterSpotlight();
  }

  /**
   * The host re-rendered. If the step's control simply came back as a new node,
   * rebind to it. If it is really gone, ask the agent for a fresh plan.
   */
  private readonly onPageChanged = (): void => {
    if (this.state === 'DONE' || this.state === 'FAILED' || this.replanning) return;
    const step = this.steps[this.index];
    if (!step) return;
    // The user pressed this control and it is gone: that is the step succeeding,
    // not the step being lost.
    if (this.pressed) {
      this.checkPressedVanished();
      return;
    }
    if (step.advanceOn === 'navigation' && this.state === 'SPOTLIGHTING') {
      this.enterVerifying();
      return;
    }
    if (isPointable(this.target)) return;
    void this.recover();
  };

  /**
   * Asks the agent whether anything is left now that the page has changed.
   * Guidance ends only when the answer is "nothing".
   */
  private async continueOrFinish(): Promise<void> {
    if (this.replanning) return;
    this.replanning = true;
    // Nothing can be drawn while the next plan is being fetched, and the control
    // that was just used is usually gone by now.
    this.target = null;
    this.transition('SNAPSHOTTING');
    try {
      const replanned = await this.deps.replan(this.index);
      if (replanned && replanned.steps.length > 0) {
        this.steps = [...this.steps.slice(0, this.index), ...replanned.steps];
        this.adoptScan(replanned);
        this.replanning = false;
        this.enterSpotlight();
        return;
      }
    } catch {
      // Fall through: finishing quietly is better than an error the user
      // cannot act on, because every step so far already succeeded.
    }
    this.replanning = false;
    this.stopListening();
    this.target = null;
    this.transition('DONE');
  }

  private async recover(): Promise<void> {
    if (this.replanning) return;
    // A plan that keeps pointing at something unreachable would otherwise ask the
    // agent again forever, once per re-render.
    if (this.recoveries >= MAX_RECOVERIES) {
      this.message = 'That control is no longer on the page.';
      this.stopListening();
      this.target = null;
      this.transition('FAILED');
      return;
    }
    this.recoveries += 1;
    this.replanning = true;
    this.target = null;
    this.transition('SNAPSHOTTING');
    try {
      const step = this.steps[this.index];
      const wanted = step ? this.affordances.get(step.target) : undefined;
      const scan = this.deps.rescan();
      const rebound = wanted ? findEquivalent(scan, wanted) : null;
      if (rebound) {
        this.adoptScan(scan);
        // The fresh scan renumbers ids, so point the step at the new one.
        this.steps = this.steps.map((current, position) =>
          position === this.index ? { ...current, target: rebound } : current,
        );
        this.replanning = false;
        this.enterSpotlight();
        return;
      }

      const replanned = await this.deps.replan(this.index);
      if (!replanned || replanned.steps.length === 0) {
        this.message = 'That control is no longer on the page.';
        this.stopListening();
        this.transition('FAILED');
        return;
      }
      this.steps = [...this.steps.slice(0, this.index), ...replanned.steps];
      this.adoptScan(replanned);
      this.replanning = false;
      this.enterSpotlight();
    } catch {
      this.message = 'Guidance stopped because the page changed.';
      this.stopListening();
      this.transition('FAILED');
    } finally {
      this.replanning = false;
    }
  }
}

/** Whether the event was aimed at the target, across shadow boundaries. */
function hits(event: Event, target: Element): boolean {
  const path =
    typeof (event as Event & { composedPath?: () => EventTarget[] }).composedPath === 'function'
      ? event.composedPath()
      : [];
  if (path.includes(target)) return true;
  return event.target instanceof Node && target.contains(event.target);
}

function acceptsEvent(advanceOn: Step['advanceOn'], eventType: string): boolean {
  switch (advanceOn) {
    case 'click':
      return eventType === 'click' || eventType === 'keydown';
    case 'input':
      return eventType === 'input' || eventType === 'change';
    case 'navigation':
      return eventType === 'click' || eventType === 'keydown';
    case 'manual':
      return false;
  }
}

/**
 * Same role and accessible name is a good enough identity for a remount, as long
 * as the candidate is somewhere the user can actually see and reach. A detached
 * or collapsed node reports an empty rect, and binding to one is what puts a
 * caption in the top-left corner of the screen.
 */
function findEquivalent(scan: ScanResult, wanted: Affordance): string | null {
  const name = wanted.name.trim().toLowerCase();
  if (!name) return null;
  for (const affordance of scan.page.affordances) {
    if (affordance.role !== wanted.role) continue;
    if (affordance.name.trim().toLowerCase() !== name) continue;
    if (isPointable(scan.lookup.get(affordance.id))) return affordance.id;
  }
  return null;
}
