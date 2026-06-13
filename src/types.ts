/** A single parsed git commit. */
export interface Commit {
  /** Full commit hash. */
  hash: string;
  /** Abbreviated commit hash. */
  shortHash: string;
  /** Commit subject (first line). */
  subject: string;
  /** Commit body (everything after the subject). */
  body: string;
  /** Author name. */
  author: string;
  /** Author date (ISO 8601). */
  date: string;
  /** Conventional-commit type, e.g. "feat", "fix" — undefined if not conventional. */
  type?: string;
  /** Conventional-commit scope, e.g. "api" in `feat(api): ...`. */
  scope?: string;
  /** True if the commit is marked as a breaking change. */
  breaking: boolean;
  /** Human-readable description (conventional description, or the raw subject). */
  description: string;
  /** Pull request number parsed from the subject, e.g. 42 from `(#42)`. */
  prNumber?: number;
}

/** Options that control how release notes are produced. */
export interface NotesOptions {
  /** Version label for the release, e.g. "v1.4.0" or "Unreleased". */
  release: string;
  /** Repository URL used to build commit/PR links, e.g. https://github.com/owner/repo */
  repoUrl?: string;
  /** Anthropic model id. */
  model: string;
  /** Skip the Claude call and use the deterministic offline renderer. */
  offline: boolean;
  /** ISO date string to stamp on the release. Defaults to today. */
  date?: string;
}
