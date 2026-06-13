import { describe, it, expect } from "vitest";
import { parseConventional } from "../src/git.js";

describe("parseConventional", () => {
  it("parses a plain conventional commit", () => {
    const r = parseConventional("feat: add dark mode", "");
    expect(r).toEqual({
      type: "feat",
      scope: undefined,
      breaking: false,
      description: "add dark mode",
    });
  });

  it("parses scope", () => {
    const r = parseConventional("fix(api): handle null user", "");
    expect(r.type).toBe("fix");
    expect(r.scope).toBe("api");
    expect(r.description).toBe("handle null user");
  });

  it("detects breaking change via bang", () => {
    const r = parseConventional("feat(core)!: drop node 16", "");
    expect(r.breaking).toBe(true);
  });

  it("detects breaking change via body footer", () => {
    const r = parseConventional("refactor: rework config", "BREAKING CHANGE: config is now async");
    expect(r.breaking).toBe(true);
  });

  it("falls back to the raw subject for non-conventional commits", () => {
    const r = parseConventional("Update README", "");
    expect(r.type).toBeUndefined();
    expect(r.description).toBe("Update README");
    expect(r.breaking).toBe(false);
  });

  it("lowercases the type", () => {
    expect(parseConventional("FEAT: shout", "").type).toBe("feat");
  });
});
