// Publishes the built bundle as the web app's /widget.js so the embed snippet
// can point at the dashboard origin. Skipped when the web app is not present.
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = resolve(here, '../dist/patchlet.js');
const target = resolve(here, '../../../apps/web/public/widget.js');

try {
  await stat(resolve(here, '../../../apps/web'));
} catch {
  console.log('[widget] apps/web not present, skipping public/widget.js copy');
  process.exit(0);
}

await mkdir(dirname(target), { recursive: true });
await copyFile(source, target);
console.log(`[widget] copied dist/patchlet.js -> ${target}`);
