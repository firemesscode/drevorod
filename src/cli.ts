#!/usr/bin/env node
import { Command } from "commander";
import { writeFileSync } from "node:fs";
import { buildReleaseNotes } from "./index.js";
import { prependToChangelog } from "./changelog.js";

const program = new Command();

program
  .name("changeloom")
  .description("Weave your git history into release notes humans actually read — powered by Claude.")
  .version("0.1.0");

program
  .option("--from <ref>", "start of the commit range (default: most recent tag)")
  .option("--to <ref>", "end of the commit range", "HEAD")
  .option("--release <version>", "version label for the release (default: the --to ref)")
  .option("--repo-url <url>", "repository URL for commit/PR links, e.g. https://github.com/owner/repo")
  .option("--model <model>", "Anthropic model id", process.env.CHANGELOOM_MODEL ?? "claude-opus-4-8")
  .option("--offline", "skip Claude and use the deterministic offline renderer", false)
  .option("--changelog [path]", "prepend the notes to a CHANGELOG file (default path: CHANGELOG.md)")
  .option("--output <path>", "write the notes to a file instead of stdout")
  .option("--date <date>", "ISO date to stamp on the release (default: today)")
  .action(async (opts) => {
    try {
      const result = await buildReleaseNotes({
        from: opts.from,
        to: opts.to,
        release: opts.release,
        repoUrl: opts.repoUrl ?? inferRepoUrl(),
        model: opts.model,
        offline: opts.offline,
        date: opts.date,
      });

      // Status goes to stderr so stdout stays a clean, pipeable artifact.
      const { from, to, spec } = result.range;
      console.error(
        `changeloom: ${result.commits.length} commit(s) in ${spec} ` +
          `(${from ?? "root"}..${to}) · source: ${result.source}`,
      );

      if (opts.changelog) {
        const path = typeof opts.changelog === "string" ? opts.changelog : "CHANGELOG.md";
        prependToChangelog(path, result.notes);
        console.error(`changeloom: updated ${path}`);
      } else if (opts.output) {
        writeFileSync(opts.output, result.notes);
        console.error(`changeloom: wrote ${opts.output}`);
      } else {
        process.stdout.write(result.notes);
      }
    } catch (err) {
      console.error(`changeloom: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

/** Best-effort GitHub repo URL from the GITHUB_* env vars set inside Actions. */
function inferRepoUrl(): string | undefined {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY } = process.env;
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY) {
    return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}`;
  }
  return undefined;
}

program.parseAsync();
