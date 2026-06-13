import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prependToChangelog } from "../src/changelog.js";

const dirs: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "changeloom-"));
  dirs.push(d);
  return d;
}

afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

describe("prependToChangelog", () => {
  it("creates a new changelog with a header", () => {
    const path = join(tmp(), "CHANGELOG.md");
    prependToChangelog(path, "## v1.0.0 — 2026-06-13\n\n- first release");
    const out = readFileSync(path, "utf8");
    expect(out).toContain("# Changelog");
    expect(out).toContain("## v1.0.0");
  });

  it("inserts a new release above existing ones", () => {
    const path = join(tmp(), "CHANGELOG.md");
    writeFileSync(path, "# Changelog\n\n## v1.0.0 — 2026-01-01\n\n- old\n");
    prependToChangelog(path, "## v2.0.0 — 2026-06-13\n\n- new");
    const out = readFileSync(path, "utf8");
    expect(out.indexOf("## v2.0.0")).toBeLessThan(out.indexOf("## v1.0.0"));
    expect(out).toContain("# Changelog");
  });
});
