#!/usr/bin/env -S npx tsx
/**
 * Fills a project's product map from its site.
 *
 * Explores the site with a headless browser into the site graph. Run through your secret manager,
 * the same way as the other scripts:
 *
 *   npm run seed:site                 # project PATCHLET_PROJECT_SLUG (default novaair)
 *
 * The site is PATCHLET_SITE_URL, or the project's stored site address.
 */
import { connect } from "./lib/pg-client.mjs";

const SLUG = process.env.PATCHLET_PROJECT_SLUG ?? "novaair";

async function project(): Promise<{ id: string; siteUrl: string | null }> {
  const client = await connect();
  try {
    const result = await client.query("select id, site_url from project where slug = $1", [SLUG]);
    const row = result.rows[0];
    if (!row) throw new Error(`no project with slug ${SLUG}; run npm run db:seed first`);
    return { id: row.id as string, siteUrl: (row.site_url as string | null) ?? null };
  } finally {
    await client.end();
  }
}

async function main(): Promise<void> {
  const { id, siteUrl: stored } = await project();
  const siteUrl = process.env.PATCHLET_SITE_URL || stored;
  if (!siteUrl) {
    console.error("No site address: set PATCHLET_SITE_URL or the project's site on the Overview page.");
    process.exit(1);
  }

  const { exploreSite } = await import("../apps/web/lib/graph/explorer");
  console.log(`exploring ${siteUrl}`);
  const summary = await exploreSite({ projectId: id, siteUrl, onProgress: (line) => console.log(`  ${line}`) });
  console.log(
    `explored ${summary.pages} pages, ${summary.controls} controls, ${summary.transitions} transitions, ` +
      `${summary.reveals} reveals, ${summary.formsTried} forms in ${(summary.durationMs / 1000).toFixed(1)}s`,
  );
  if (summary.skipped.length > 0) console.log(`  skipped: ${summary.skipped.join(", ")}`);
}

main().catch((error: unknown) => {
  console.error((error as Error).message);
  process.exit(1);
});
