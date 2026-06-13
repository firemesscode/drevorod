import { describe, it, expect } from "vitest";
import { renderOfflineNotes, groupCommits, formatBullet } from "../src/render.js";
import type { Commit, NotesOptions } from "../src/types.js";

function commit(partial: Partial<Commit>): Commit {
  return {
    hash: "abc1234567890",
    shortHash: "abc1234",
    subject: "feat: thing",
    body: "",
    author: "Dev",
    date: "2026-06-13T00:00:00Z",
    breaking: false,
    description: "thing",
    ...partial,
  };
}

const options: NotesOptions = {
  release: "v1.0.0",
  model: "claude-opus-4-8",
  offline: true,
  date: "2026-06-13",
  repoUrl: "https://github.com/owner/repo",
};

describe("groupCommits", () => {
  it("buckets by type and collects breaking changes", () => {
    const commits = [
      commit({ type: "feat", description: "a" }),
      commit({ type: "fix", description: "b" }),
      commit({ type: "feat", description: "c", breaking: true }),
      commit({ type: undefined, description: "misc" }),
    ];
    const { breaking, sections } = groupCommits(commits);
    expect(breaking).toHaveLength(1);
    expect(sections.find((s) => s.title.includes("Features"))?.commits).toHaveLength(2);
    expect(sections.find((s) => s.title.includes("Bug Fixes"))?.commits).toHaveLength(1);
    expect(sections.find((s) => s.title.includes("Other"))?.commits).toHaveLength(1);
  });
});

describe("formatBullet", () => {
  it("links PR and commit when a repo url is given", () => {
    const b = formatBullet(commit({ prNumber: 42, description: "add login (#42)" }), options.repoUrl);
    expect(b).toContain("[#42](https://github.com/owner/repo/pull/42)");
    expect(b).toContain("[`abc1234`](https://github.com/owner/repo/commit/abc1234567890)");
    // The trailing (#42) is stripped from the description to avoid duplication.
    expect(b).not.toContain("add login (#42)");
    expect(b).toContain("add login");
  });

  it("renders scope in bold", () => {
    const b = formatBullet(commit({ scope: "api", description: "x" }));
    expect(b).toContain("**api:**");
  });
});

describe("renderOfflineNotes", () => {
  it("produces a heading, breaking section, and feature section", () => {
    const notes = renderOfflineNotes(
      [
        commit({ type: "feat", description: "add export", shortHash: "f00" }),
        commit({ type: "fix", description: "fix crash", breaking: true, shortHash: "b01" }),
      ],
      options,
    );
    expect(notes).toContain("## v1.0.0 — 2026-06-13");
    expect(notes).toContain("### ⚠️ BREAKING CHANGES");
    expect(notes).toContain("### ✨ Features");
    expect(notes).toContain("add export");
  });

  it("handles an empty release", () => {
    expect(renderOfflineNotes([], options)).toContain("_No changes._");
  });
});
