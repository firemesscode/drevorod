import Anthropic from "@anthropic-ai/sdk";
import type { Commit, NotesOptions } from "./types.js";

const SYSTEM_PROMPT = `You are a release-notes editor for software projects. You turn raw git
commits into clear, accurate release notes that a developer would enjoy reading.

Rules:
- Output GitHub-flavored Markdown only. No preamble, no code fences around the whole thing.
- Start with a level-2 heading: "## <version> — <date>".
- Follow it with a one- or two-sentence "Highlights" paragraph that captures what
  actually matters in this release, in plain language. Skip it only if there is a
  single trivial change.
- Group changes under level-3 headings with these emoji titles, in this order, omitting
  any that have no entries: "### ⚠️ BREAKING CHANGES", "### ✨ Features",
  "### 🐛 Bug Fixes", "### ⚡ Performance", "### ♻️ Refactoring", "### 📝 Documentation",
  "### ✅ Tests", "### 🔧 Maintenance".
- Each entry is a bullet. Rewrite terse commit subjects into clear sentences, but DO NOT
  invent features, fixes, or details that are not supported by the commits provided.
- Preserve the commit and PR references exactly as given in the input (the "refs" field).
- Merge duplicate or closely-related commits into a single bullet when it improves clarity.
- Be concise. Lead with the outcome for the user, not the implementation detail.`;

function commitDigest(commits: Commit[], repoUrl?: string): string {
  return commits
    .map((c) => {
      const refs: string[] = [];
      if (c.prNumber !== undefined) {
        refs.push(repoUrl ? `[#${c.prNumber}](${repoUrl}/pull/${c.prNumber})` : `#${c.prNumber}`);
      }
      refs.push(repoUrl ? `[\`${c.shortHash}\`](${repoUrl}/commit/${c.hash})` : `\`${c.shortHash}\``);
      const meta = [
        c.type ? `type=${c.type}` : "type=other",
        c.scope ? `scope=${c.scope}` : null,
        c.breaking ? "breaking=true" : null,
      ]
        .filter(Boolean)
        .join(" ");
      const body = c.body ? `\n    body: ${c.body.replace(/\n+/g, " ").slice(0, 280)}` : "";
      return `- subject: ${c.subject}\n    ${meta}\n    refs: ${refs.join(" ")}${body}`;
    })
    .join("\n");
}

/**
 * Generate polished release notes with Claude. Streams the response so large
 * releases never hit an HTTP timeout.
 */
export async function generateReleaseNotes(
  commits: Commit[],
  options: NotesOptions,
  client = new Anthropic(),
): Promise<string> {
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const userPrompt = [
    `Version: ${options.release}`,
    `Date: ${date}`,
    options.repoUrl ? `Repository: ${options.repoUrl}` : "",
    "",
    `Here are the ${commits.length} commit(s) in this release:`,
    "",
    commitDigest(commits, options.repoUrl),
    "",
    "Write the release notes now.",
  ]
    .filter((l) => l !== "")
    .join("\n");

  const stream = client.messages.stream({
    model: options.model,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const message = await stream.finalMessage();
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();

  return text + "\n";
}
