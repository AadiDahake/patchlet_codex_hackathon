/**
 * Development stand-in for the Patchlet API. It implements the routes from the
 * HTTP contract with canned answers and realistic delays so the widget can be
 * built and tested before the real routes exist. It also serves the dev host
 * page and the built bundle, so `npm run dev` needs nothing else.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

type Affordance = { id: string; role: string; name: string; landmark?: string; visible: boolean };
type PageContext = { url: string; title: string; affordances: Affordance[] };

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.MOCK_PORT ?? 4319);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, accept',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
};

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));
const between = (min: number, max: number) => Math.round(min + Math.random() * (max - min));

const server = createServer((request, response) => {
  void route(request, response).catch((error: unknown) => {
    response.writeHead(500, { ...CORS, 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: String(error) }));
  });
});

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    response.writeHead(204, CORS);
    response.end();
    return;
  }

  if (path === '/api/chat') return chat(request, response);
  if (path === '/api/escalate') return escalate(request, response);
  if (path.startsWith('/api/escalations/')) return escalationStatus(path, response);
  if (path === '/api/transcribe') return transcribe(request, response);
  if (path === '/api/speak') return speak(request, response);
  return serveStatic(path, response);
}

/* ------------------------------------------------------------------ chat */

type Plan = { pattern: RegExp; label: string };

/** The username walkthrough, one entry per control the user has to touch. */
const USERNAME_PLAN: Plan[] = [
  { pattern: /aadi dahake|default workspace|account/i, label: 'Open the account menu' },
  { pattern: /^profile$/i, label: 'Choose Profile' },
  { pattern: /username/i, label: 'Type the name you want' },
  { pattern: /update profile/i, label: 'Save with Update profile' },
];

async function chat(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const body = await readJson(request);
  const question = String(body.question ?? '');
  const page = (body.page ?? { affordances: [] }) as PageContext;
  const continueFrom = typeof body.continueFrom === 'number' ? body.continueFrom : 0;
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : randomUUID();

  response.writeHead(200, {
    ...CORS,
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });

  const send = (event: Record<string, unknown>) => {
    response.write(`event: ${String(event.type)}\ndata: ${JSON.stringify(event)}\n\n`);
  };

  const wantsUsername = /user\s?name|display name|my name|profile/i.test(question);
  const wantsDarkMode = /dark mode|dark theme|night mode|appearance|theme/i.test(question);

  send({ type: 'conversation', conversationId, messageId: randomUUID() });
  await sleep(between(150, 300));
  send({
    type: 'understanding',
    feature: wantsDarkMode ? 'dark mode' : wantsUsername ? 'changing the username' : question.slice(0, 40),
    intent: wantsDarkMode ? 'feature' : 'howto',
    memory: ['The visitor is the owner of the workspace.'],
  });

  const probes = [
    { probe: 'docs', hit: wantsUsername, score: wantsUsername ? 0.82 : 0.31, summary: wantsUsername ? 'The handbook explains how to change your username.' : 'Nothing in the documentation covers this.' },
    { probe: 'interface', hit: wantsUsername, score: wantsUsername ? 0.74 : 0.12, summary: wantsUsername ? 'The account menu and the profile dialog match.' : 'No control on this page matches.' },
    { probe: 'repository', hit: false, score: 0.08, summary: 'No source file mentions this.' },
  ];

  for (const probe of probes) {
    send({ type: 'probe', probe: probe.probe, status: 'running' });
    const latencyMs = between(300, 900);
    await sleep(latencyMs);
    send({ type: 'probe', probe: probe.probe, status: 'done', result: { ...probe, evidence: [], latencyMs } });
  }

  const outcome = wantsUsername ? 'answer' : wantsDarkMode ? 'absent' : 'hedge';
  send({
    type: 'verdict',
    verdict: {
      outcome,
      confidence: outcome === 'answer' ? 0.86 : 0.79,
      reasoning:
        outcome === 'absent'
          ? 'The documentation, this page and the repository all came back empty.'
          : 'The documentation and this page both match the question.',
      feature: wantsDarkMode ? 'dark mode' : 'changing the username',
    },
  });
  await sleep(between(200, 400));

  if (outcome === 'answer') {
    send({
      type: 'answer',
      text: 'You can change your username from your profile. I will walk you through it.',
      steps: buildSteps(page, continueFrom),
      escalation: { offered: false },
    });
  } else if (outcome === 'absent') {
    send({
      type: 'answer',
      text: 'Dark mode is not available here today. I can report this to the developers so they can build it. Want me to?',
      steps: null,
      escalation: {
        offered: true,
        request: {
          title: 'Add a dark mode toggle',
          description: 'People working late want a dark theme. Add a toggle in the header that switches the interface to a dark palette and remembers the choice.',
          area: 'appearance',
          quote: question,
          rationale: 'Asked in support after the documentation, this page and the repository all came back empty.',
        },
      },
    });
  } else {
    send({
      type: 'answer',
      text: 'I could not confirm that this exists. I can report it so someone takes a proper look.',
      steps: null,
      escalation: {
        offered: true,
        request: {
          title: 'Investigate a request we could not answer',
          description: 'A user asked about something none of the three checks could confirm.',
          area: 'unknown',
          quote: question,
          rationale: 'Raised from support.',
        },
      },
    });
  }
  response.end();
}

/**
 * Builds steps for the controls that exist right now, stopping at the first one
 * the page does not have yet. The widget asks again with `continueFrom` once the
 * user's click has revealed the rest, which is what the real agent does too.
 */
function buildSteps(page: PageContext, continueFrom: number) {
  const steps: Array<{ target: string; caption: string; advanceOn: string }> = [];
  for (let index = continueFrom; index < USERNAME_PLAN.length; index += 1) {
    const plan = USERNAME_PLAN[index];
    const match = page.affordances.find((affordance) => plan.pattern.test(affordance.name));
    if (!match) break;
    steps.push({
      target: match.id,
      caption: plan.label,
      advanceOn: /username/i.test(plan.label) || match.role === 'textbox' ? 'input' : 'click',
    });
  }
  return steps.length ? steps : null;
}

/* ----------------------------------------------------------- escalations */

type Escalation = {
  id: string;
  status: string;
  issueUrl?: string;
  issueNumber?: number;
  prUrl?: string;
  prNumber?: number;
  deploymentUrl?: string;
  createdAt: string;
};

const STATUS_FLOW = [
  'queued', 'filing', 'inspecting', 'drafting', 'pr_open',
  'awaiting_approval', 'approved', 'merging', 'deploying', 'shipped',
];

const escalations = new Map<string, Escalation>();

async function escalate(request: IncomingMessage, response: ServerResponse): Promise<void> {
  await readJson(request);
  const id = randomUUID();
  const record: Escalation = { id, status: 'queued', createdAt: new Date().toISOString() };
  escalations.set(id, record);
  advance(record, 0);
  response.writeHead(200, { ...CORS, 'content-type': 'application/json' });
  response.end(JSON.stringify({ escalationId: id, status: record.status }));
}

/** Walks the report through the real status list, four seconds per step. */
function advance(record: Escalation, index: number): void {
  if (index >= STATUS_FLOW.length) return;
  record.status = STATUS_FLOW[index];
  if (record.status === 'filing') {
    record.issueUrl = 'https://github.com/AadiDahake/novaair/issues/12';
    record.issueNumber = 12;
  }
  if (record.status === 'pr_open') {
    record.prUrl = 'https://github.com/AadiDahake/novaair/pull/13';
    record.prNumber = 13;
  }
  if (record.status === 'shipped') record.deploymentUrl = 'https://novaair.vercel.app';
  setTimeout(() => advance(record, index + 1), 4000).unref();
}

function escalationStatus(path: string, response: ServerResponse): void {
  const id = decodeURIComponent(path.split('/').pop() ?? '');
  const record = escalations.get(id);
  response.writeHead(record ? 200 : 404, { ...CORS, 'content-type': 'application/json' });
  response.end(JSON.stringify(record ?? { error: 'not found' }));
}

/* ----------------------------------------------------------------- voice */

async function transcribe(request: IncomingMessage, response: ServerResponse): Promise<void> {
  await drain(request);
  await sleep(between(400, 800));
  response.writeHead(200, { ...CORS, 'content-type': 'application/json' });
  response.end(JSON.stringify({ text: 'How do I change my username?' }));
}

/** A short run of silent MPEG frames, enough for the player to exercise itself. */
async function speak(request: IncomingMessage, response: ServerResponse): Promise<void> {
  await readJson(request);
  response.writeHead(200, { ...CORS, 'content-type': 'audio/mpeg' });
  const frame = Buffer.alloc(418);
  frame.set([0xff, 0xfb, 0x90, 0x64]);
  for (let index = 0; index < 20; index += 1) {
    response.write(frame);
    await sleep(60);
  }
  response.end();
}

/* ---------------------------------------------------------------- static */

const STATIC: Record<string, { file: string; type: string }> = {
  '/': { file: resolve(here, 'host.html'), type: 'text/html; charset=utf-8' },
  '/host.html': { file: resolve(here, 'host.html'), type: 'text/html; charset=utf-8' },
  '/patchlet.js': { file: resolve(here, '../dist/patchlet.js'), type: 'text/javascript; charset=utf-8' },
};

async function serveStatic(path: string, response: ServerResponse): Promise<void> {
  const entry = STATIC[path];
  if (!entry) {
    response.writeHead(404, CORS);
    response.end('not found');
    return;
  }
  try {
    const body = await readFile(entry.file);
    response.writeHead(200, { ...CORS, 'content-type': entry.type, 'cache-control': 'no-store' });
    response.end(body);
  } catch {
    response.writeHead(404, CORS);
    response.end('build the widget first: npm run build');
  }
}

/* ----------------------------------------------------------------- utils */

async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await drain(request);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function drain(request: IncomingMessage): Promise<string> {
  return new Promise((done) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => done(Buffer.concat(chunks).toString('utf8')));
  });
}

server.listen(PORT, () => {
  console.log(`[mock] host page and API on http://localhost:${PORT}`);
});
