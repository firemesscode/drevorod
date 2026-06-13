<div align="center">

# 🧵 Changeloom

**Weave your git history into release notes humans actually read — powered by Claude.**

[![CI](https://github.com/firemesscode/drevorod/actions/workflows/ci.yml/badge.svg)](https://github.com/firemesscode/drevorod/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

</div>

---

Nobody enjoys writing release notes. So most teams don't — they ship a wall of
`fix: stuff` commits and call it a changelog. Changeloom reads your raw git history
and turns it into clear, grouped, link-rich notes that a human would actually want to
read. It runs as a one-line CLI or a fully autonomous GitHub Action.

```diff
- ## v1.4.0
- - fix: npe
- - feat: add csv export
- - chore: bump deps
- - fix(api): 500 on empty body

+ ## v1.4.0 — 2026-06-13
+
+ This release adds CSV export and hardens the API against malformed requests.
+
+ ### ✨ Features
+ - Export any report to CSV with one click (#231 `a1b2c3d`)
+
+ ### 🐛 Bug Fixes
+ - **api:** No longer returns a 500 when the request body is empty (#244 `9f8e7d6`)
+ - Fixed a crash when opening a project with no members (`c4d5e6f`)
```

## Why Changeloom

- **🤖 Autonomous.** Drop the GitHub Action in once and every tagged release writes its
  own notes. No human in the loop.
- **🧠 Genuinely smart.** Claude rewrites terse commit subjects into clear sentences,
  merges duplicates, and writes a real "highlights" summary — grounded strictly in your
  commits, never invented.
- **🔌 Works without an API key.** No key? It falls back to a deterministic offline
  renderer that groups Conventional Commits. It *always* produces usable notes.
- **🪶 Tiny + fast.** Two runtime dependencies. Plain git under the hood — no GitHub API
  required to read history.
- **🔗 Linked.** Auto-links commits and PRs back to your repo.

## Quick start

```bash
# Try it instantly, no install:
npx changeloom --repo-url https://github.com/owner/repo

# Or install globally:
npm i -g changeloom
changeloom
```

By default Changeloom summarizes everything **since your last tag** and prints Markdown
to stdout. Set `ANTHROPIC_API_KEY` to get the Claude-quality output; without it you get
the offline renderer.

```bash
export ANTHROPIC_API_KEY=sk-ant-...
changeloom --release v1.4.0 --changelog
```

## CLI

```
changeloom [options]

  --from <ref>          Start of the range (default: most recent tag)
  --to <ref>            End of the range (default: HEAD)
  --release <version>   Version label for the release (default: the --to ref)
  --repo-url <url>      Repo URL for commit/PR links (auto-detected in GitHub Actions)
  --model <model>       Anthropic model id (default: claude-opus-4-8)
  --offline             Skip Claude; use the deterministic renderer
  --changelog [path]    Prepend notes to a CHANGELOG file (default: CHANGELOG.md)
  --output <path>       Write notes to a file instead of stdout
  --date <date>         ISO date to stamp on the release (default: today)
```

Status messages go to **stderr**, so stdout stays a clean artifact you can pipe:

```bash
changeloom --offline > NOTES.md
gh release create v1.4.0 --notes-file <(changeloom --release v1.4.0)
```

## GitHub Action

Put release notes on autopilot. This runs on every `v*` tag and commits an updated
`CHANGELOG.md`:

```yaml
name: Release Notes
on:
  push:
    tags: ["v*"]
permissions:
  contents: write
jobs:
  notes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 } # need full history + tags
      - uses: firemesscode/drevorod@v1
        with:
          release: ${{ github.ref_name }}
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add CHANGELOG.md && git commit -m "docs: changelog for ${{ github.ref_name }}" || true
          git push || true
```

See [`.github/workflows/release-notes.yml`](./.github/workflows/release-notes.yml) for
the full example. Omit `anthropic_api_key` to run the Action in offline mode.

## How it works

```
 git log range ──▶ parse (Conventional Commits) ──▶ ┌── Claude (claude-opus-4-8) ──┐
                                                     │   grounded, streamed         │──▶ Markdown
                                                     └── offline renderer (fallback)─┘
```

1. Resolve the commit range (`<last-tag>..HEAD` by default).
2. Read commits with plain `git log` and parse Conventional Commit metadata.
3. Hand the structured commits to Claude with a strict, no-hallucination system prompt
   (streamed so big releases never time out).
4. If the model is unreachable or no key is set, fall back to the deterministic renderer.

## Programmatic API

```ts
import { buildReleaseNotes } from "changeloom";

const { notes, commits, source } = await buildReleaseNotes({
  from: "v1.3.0",
  release: "v1.4.0",
  repoUrl: "https://github.com/owner/repo",
});
console.log(notes); // → Markdown
```

## Roadmap

- [ ] `changeloom bump` — infer the next semver from commit types
- [ ] Multi-repo digests (the basis for a hosted team dashboard)
- [ ] Pluggable templates and per-section prompts
- [ ] Linear / Jira issue enrichment

## Contributing

PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md). Good first issues are labeled.

## License

MIT © Changeloom contributors
