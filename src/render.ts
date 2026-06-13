import type { Commit, NotesOptions } from "./types.js";

/** Ordered conventional-commit type → section heading mapping. */
export const SECTIONS: { types: string[]; title: string }[] = [
  { types: ["feat"], title: "✨ Features" },
  { types: ["fix"], title: "🐛 Bug Fixes" },
  { types: ["perf"], title: "⚡ Performance" },
  { types: ["refactor"], title: "♻️ Refactoring" },
  { types: ["docs"], title: "📝 Documentation" },
  { types: ["test"], title: "✅ Tests" },
  { types: ["build", "ci", "chore", "style", "revert"], title: "🔧 Maintenance" },
];

const OTHER_TITLE = "📦 Other Changes";

function commitLink(commit: Commit, repoUrl?: string): string {
  if (!repoUrl) return `\`${commit.shortHash}\``;
  return `[\`${commit.shortHash}\`](${repoUrl}/commit/${commit.hash})`;
}

function prLink(commit: Commit, repoUrl?: string): string | undefined {
  if (commit.prNumber === undefined) return undefined;
  if (!repoUrl) return `#${commit.prNumber}`;
  return `[#${commit.prNumber}](${repoUrl}/pull/${commit.prNumber})`;
}

/** Format a single commit as a markdown bullet. */
export function formatBullet(commit: Commit, repoUrl?: string): string {
  const scope = commit.scope ? `**${commit.scope}:** ` : "";
  // Strip a trailing "(#42)" from the description so it isn't duplicated by the PR link.
  const text = commit.description.replace(/\s*\(#\d+\)\s*$/, "").trim();
  const refs = [prLink(commit, repoUrl), commitLink(commit, repoUrl)]
    .filter(Boolean)
    .join(" ");
  return `- ${scope}${text} (${refs})`;
}

/** Bucket commits into ordered sections, plus breaking changes. */
export function groupCommits(commits: Commit[]): {
  breaking: Commit[];
  sections: { title: string; commits: Commit[] }[];
} {
  const breaking = commits.filter((c) => c.breaking);
  const sections: { title: string; commits: Commit[] }[] = [];

  for (const section of SECTIONS) {
    const matched = commits.filter(
      (c) => c.type !== undefined && section.types.includes(c.type),
    );
    if (matched.length) sections.push({ title: section.title, commits: matched });
  }

  const knownTypes = new Set(SECTIONS.flatMap((s) => s.types));
  const other = commits.filter((c) => c.type === undefined || !knownTypes.has(c.type));
  if (other.length) sections.push({ title: OTHER_TITLE, commits: other });

  return { breaking, sections };
}

/**
 * Deterministic, offline release notes. No network, no API key — always works.
 * This is the fallback when Claude is unavailable, and the baseline Claude improves on.
 */
export function renderOfflineNotes(commits: Commit[], options: NotesOptions): string {
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const lines: string[] = [`## ${options.release} — ${date}`, ""];

  if (commits.length === 0) {
    lines.push("_No changes._", "");
    return lines.join("\n");
  }

  const { breaking, sections } = groupCommits(commits);

  if (breaking.length) {
    lines.push("### ⚠️ BREAKING CHANGES", "");
    for (const c of breaking) lines.push(formatBullet(c, options.repoUrl));
    lines.push("");
  }

  for (const section of sections) {
    lines.push(`### ${section.title}`, "");
    for (const c of section.commits) lines.push(formatBullet(c, options.repoUrl));
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
