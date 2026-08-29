/**
 * Typed access to every environment variable the app reads.
 *
 * Every accessor resolves at call time, never at import time, so a missing variable fails the one
 * request that needed it with a message naming it, rather than taking the whole build or the whole
 * server down at boot.
 */
import type { EscalationEngine } from "@patchlet/shared";

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable ${name}. See .env.example.`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

/** OpenAI API key. Server-side only. */
export const openaiApiKey = (): string => required("OPENAI_API_KEY");

/** Supabase project URL, `https://<ref>.supabase.co`. */
export const supabaseUrl = (): string => required("SUPABASE_URL");

/** Service role key. Server-side only; it bypasses row level security. */
export const supabaseServiceRoleKey = (): string => required("SUPABASE_SERVICE_ROLE_KEY");

/** Anon key. The public value behind NEXT_PUBLIC_SUPABASE_ANON_KEY. */
export const supabaseAnonKey = (): string => required("SUPABASE_ANON_KEY");

/** GitHub token used by the repository probe and the repository connection check. */
export const githubToken = (): string => required("GITHUB_TOKEN");

/**
 * The GitHub OAuth app that lets a console user link their own account.
 *
 * All three variables travel together, so this returns null unless the whole set is present. The
 * repository page then falls back to the server credential in GITHUB_TOKEN.
 */
export function githubOauthApp(): { clientId: string; clientSecret: string; redirect: string } | null {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const redirect = process.env.GITHUB_OAUTH_REDIRECT;
  if (!clientId || !clientSecret || !redirect) return null;
  return { clientId, clientSecret, redirect };
}

/** Vercel token used to watch the target project's deployments. */
export const vercelToken = (): string => required("VERCEL_TOKEN");

/**
 * Which engine runs an escalation.
 *
 * `local` is the worker's own runner and is the default. `forge` is the named seam for the
 * Reflex/Runloop engine that builds a capability inside a sandbox; nothing implements it yet, so
 * `POST /api/escalate` refuses the run instead of writing a row nobody will pick up.
 */
export const escalationEngine = (): EscalationEngine =>
  optional("ESCALATION_ENGINE", "local") === "forge" ? "forge" : "local";

/** Public origin of this app, used to build the widget script URL and the embed snippet. */
export const appUrl = (): string => optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

/** Vercel project whose deployment the worker waits for after a merge. */
export const targetVercelProject = (): string => optional("TARGET_VERCEL_PROJECT", "novaair");

/** Optional Slack webhook, posted to when an issue and a pull request are drafted. */
export const slackWebhookUrl = (): string | null => process.env.SLACK_WEBHOOK_URL || null;
