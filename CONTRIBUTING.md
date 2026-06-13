# Contributing to Changeloom

Thanks for helping! Changeloom is a small, focused TypeScript project — easy to get into.

## Setup

```bash
npm install
npm test          # run the test suite (vitest)
npm run typecheck # type-check without emitting
npm run dev -- --offline   # run the CLI from source
npm run build     # compile to dist/
```

## Project layout

| Path                 | What it does                                              |
| -------------------- | -------------------------------------------------------- |
| `src/git.ts`         | Reads & parses commits (Conventional Commit aware)       |
| `src/claude.ts`      | The Claude integration (streamed, grounded prompt)       |
| `src/render.ts`      | Deterministic offline renderer + shared formatting       |
| `src/changelog.ts`   | Prepends releases to a `CHANGELOG.md`                     |
| `src/index.ts`       | `buildReleaseNotes()` orchestration + public API         |
| `src/cli.ts`         | The `changeloom` command                                 |
| `action.yml`         | The composite GitHub Action                              |

## Guidelines

- **No hallucinations.** Anything touching the Claude prompt must keep the
  "never invent changes not present in the commits" guarantee.
- **Offline must always work.** Every feature should degrade gracefully without an API key.
- Keep the dependency footprint tiny.
- Add a test for new behavior. Tests must not require network access.
- Use Conventional Commits for your own commits (we dogfood our own format).

## Reporting bugs / ideas

Open an issue with a minimal reproduction (a few commit subjects + the output you got vs.
expected). Feature ideas are very welcome.
