import type { ChatEvent, EscalationOffer, FeatureRequest, ProbeName, ProbeResult, Step, Verdict } from '../types';

/**
 * Incremental text/event-stream reader. Feed it decoded chunks; it returns the
 * `data:` payloads of every event that completed inside that chunk. Comments
 * (`: ping`) and the `event:` field are ignored: the payload carries `type`.
 */
export class SseDecoder {
  private buffer = '';

  push(chunk: string): string[] {
    this.buffer += chunk.replace(/\r\n/g, '\n');
    const payloads: string[] = [];
    let boundary = this.buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const data = dataOf(this.buffer.slice(0, boundary));
      this.buffer = this.buffer.slice(boundary + 2);
      if (data !== null) payloads.push(data);
      boundary = this.buffer.indexOf('\n\n');
    }
    return payloads;
  }

  /** Returns a final frame that arrived without its blank-line terminator. */
  flush(): string[] {
    const rest = this.buffer.trim();
    this.buffer = '';
    if (!rest) return [];
    const data = dataOf(rest);
    return data === null ? [] : [data];
  }
}

function dataOf(frame: string): string | null {
  const lines: string[] = [];
  for (const line of frame.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    if ((colon === -1 ? line : line.slice(0, colon)) !== 'data') continue;
    const value = colon === -1 ? '' : line.slice(colon + 1);
    lines.push(value.startsWith(' ') ? value.slice(1) : value);
  }
  return lines.length === 0 ? null : lines.join('\n');
}

const PROBE_NAMES: readonly string[] = ['docs', 'interface', 'repository'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Server output is untrusted, so every event is shape-checked before use. */
export function toChatEvent(payload: string): ChatEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  switch (parsed.type) {
    case 'conversation':
      if (typeof parsed.conversationId !== 'string' || typeof parsed.messageId !== 'string') return null;
      return { type: 'conversation', conversationId: parsed.conversationId, messageId: parsed.messageId };

    case 'understanding': {
      if (typeof parsed.feature !== 'string') return null;
      const intent = parsed.intent === 'howto' || parsed.intent === 'feature' ? parsed.intent : 'other';
      const memory = Array.isArray(parsed.memory)
        ? parsed.memory.filter((fact): fact is string => typeof fact === 'string')
        : [];
      return { type: 'understanding', feature: parsed.feature, intent, memory };
    }

    case 'probe': {
      if (typeof parsed.probe !== 'string' || !PROBE_NAMES.includes(parsed.probe)) return null;
      const probe = parsed.probe as ProbeName;
      if (parsed.status === 'running') return { type: 'probe', probe, status: 'running' };
      if (parsed.status === 'done' && isRecord(parsed.result)) {
        return { type: 'probe', probe, status: 'done', result: coerceProbeResult(probe, parsed.result) };
      }
      return null;
    }

    case 'verdict':
      if (!isRecord(parsed.verdict)) return null;
      return { type: 'verdict', verdict: coerceVerdict(parsed.verdict) };

    case 'answer':
      if (typeof parsed.text !== 'string') return null;
      return {
        type: 'answer',
        text: parsed.text,
        steps: coerceSteps(parsed.steps),
        escalation: toEscalationOffer(parsed.escalation),
        noted: parsed.noted === true,
      };

    case 'error':
      return {
        type: 'error',
        message: typeof parsed.message === 'string' ? parsed.message : 'Something went wrong.',
      };

    default:
      return null;
  }
}

function coerceProbeResult(probe: ProbeName, value: Record<string, unknown>): ProbeResult {
  return {
    probe,
    hit: value.hit === true,
    score: typeof value.score === 'number' ? value.score : null,
    summary: typeof value.summary === 'string' ? value.summary : '',
    evidence: value.evidence ?? null,
    latencyMs: typeof value.latencyMs === 'number' ? value.latencyMs : 0,
  };
}

function coerceVerdict(value: Record<string, unknown>): Verdict {
  const outcome = value.outcome;
  return {
    outcome: outcome === 'answer' || outcome === 'absent' ? outcome : 'hedge',
    confidence: typeof value.confidence === 'number' ? value.confidence : 0,
    reasoning: typeof value.reasoning === 'string' ? value.reasoning : '',
    feature: typeof value.feature === 'string' ? value.feature : '',
  };
}

const ADVANCE_ON: readonly string[] = ['click', 'input', 'navigation', 'manual'];

export function coerceSteps(value: unknown): Step[] | null {
  if (!Array.isArray(value)) return null;
  const steps: Step[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    if (typeof item.target !== 'string' || typeof item.caption !== 'string') continue;
    steps.push({
      target: item.target,
      caption: item.caption,
      advanceOn:
        typeof item.advanceOn === 'string' && ADVANCE_ON.includes(item.advanceOn)
          ? (item.advanceOn as Step['advanceOn'])
          : 'click',
    });
  }
  return steps.length ? steps : null;
}

/** The offer, or the reason there was none. Anything unrecognised reads as a plain refusal. */
function toEscalationOffer(value: unknown): EscalationOffer {
  if (!isRecord(value)) return { offered: false };
  if (value.offered === true && isRecord(value.request)) {
    return { offered: true, request: value.request as FeatureRequest };
  }
  return value.reason === 'no_repository' ? { offered: false, reason: 'no_repository' } : { offered: false };
}
