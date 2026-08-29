/**
 * Who is asking, and which project the answer may come from.
 *
 * Every console route and every console page resolves the caller here, and then scopes its queries
 * to the project id this returns. Nothing else decides what an account can see.
 */
import { currentAccount } from "@/lib/auth/server";
import type { ConsoleProject } from "@/lib/console/project";
import { ensureProject } from "@/lib/console/provision";

/**
 * The signed-in caller's project.
 *
 * Throws a 401 `Response` when there is no session, so a route can answer with it directly:
 *
 * ```ts
 * const project = await currentProject().catch(asErrorResponse);
 * if (project instanceof Response) return project;
 * ```
 */
export async function currentProject(): Promise<ConsoleProject> {
  const account = await currentAccount();
  if (!account) {
    throw Response.json({ error: "Sign in to use the console." }, { status: 401 });
  }
  return ensureProject(account);
}

/** The same, for pages, which redirect rather than answer with a status code. */
export async function currentProjectOrNull(): Promise<ConsoleProject | null> {
  const account = await currentAccount();
  return account ? ensureProject(account) : null;
}

/** Turns the thrown 401 into a value a route can return, and lets every other failure through. */
export function asErrorResponse(error: unknown): Response {
  if (error instanceof Response) return error;
  throw error;
}
