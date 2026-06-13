import { execFileSync } from "node:child_process";
import type { Commit } from "./types.js";

// Unit + record separators that will never appear in commit text.
const FIELD = "\x1f";
const RECORD = "\x1e";
const FORMAT = ["%H", "%h", "%an", "%aI", "%s", "%b"].join(FIELD) + RECORD;

function git(args: string[], cwd?: string): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // Capture stderr into the thrown error instead of leaking it to our own
    // stderr — `git describe` is allowed to fail when there are no tags yet.
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/** Returns true if `cwd` is inside a git work tree. */
export function isGitRepo(cwd?: string): boolean {
  try {
    git(["rev-parse", "--is-inside-work-tree"], cwd);
    return true;
  } catch {
    return false;
  }
}

/** The most recent tag reachable from HEAD, or undefined if there are none. */
export function lastTag(cwd?: string): string | undefined {
  try {
    return git(["describe", "--tags", "--abbrev=0"], cwd) || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolve the commit range to summarize.
 * - `from` defaults to the most recent tag (so you summarize "since the last release").
 * - `to` defaults to HEAD.
 * When there is no tag, the full history up to `to` is used.
 */
export function resolveRange(
  from: string | undefined,
  to: string | undefined,
  cwd?: string,
): { from?: string; to: string; spec: string } {
  const resolvedTo = to ?? "HEAD";
  const resolvedFrom = from ?? lastTag(cwd);
  const spec = resolvedFrom ? `${resolvedFrom}..${resolvedTo}` : resolvedTo;
  return { from: resolvedFrom, to: resolvedTo, spec };
}

const CONVENTIONAL = /^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/;
const PR_NUMBER = /\(#(\d+)\)\s*$/;

/** Parse conventional-commit metadata out of a subject + body. */
export function parseConventional(
  subject: string,
  body: string,
): Pick<Commit, "type" | "scope" | "breaking" | "description"> {
  const match = CONVENTIONAL.exec(subject);
  const breakingInBody = /(^|\n)BREAKING[ -]CHANGE:/.test(body);
  if (!match) {
    return { breaking: breakingInBody, description: subject };
  }
  const [, type, scope, bang, description] = match;
  return {
    type: type.toLowerCase(),
    scope: scope || undefined,
    breaking: Boolean(bang) || breakingInBody,
    description,
  };
}

/** Read and parse commits in the given range. */
export function getCommits(spec: string, cwd?: string): Commit[] {
  const raw = git(["log", `--pretty=format:${FORMAT}`, spec], cwd);
  if (!raw) return [];

  return raw
    .split(RECORD)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash, shortHash, author, date, subject, body = ""] =
        record.split(FIELD);
      const conventional = parseConventional(subject, body.trim());
      const prMatch = PR_NUMBER.exec(subject);
      return {
        hash,
        shortHash,
        author,
        date,
        subject,
        body: body.trim(),
        prNumber: prMatch ? Number(prMatch[1]) : undefined,
        ...conventional,
      } satisfies Commit;
    });
}
