import type { JSONContent } from "@tiptap/react";

/**
 * Dancer biographies come in two formats (`biographyFormat` on the profile).
 *
 * - `plain`: literal text written before formatting existed. It renders as it
 *   always has, and loads into the editor as literal text.
 * - `rich`: the small Markdown subset the editor writes. Blocks are separated
 *   by a blank line. A line starting with `- ` is a bullet, and a line after a
 *   bullet without `- ` is a line break inside it. Inside a line,
 *   `**` toggles bold, `*` toggles italic, and a backslash makes the next
 *   character literal. Nothing else is special, so stored text can never
 *   become HTML.
 */
export type BiographyFormat = "plain" | "rich";

export type Run = { text: string; bold: boolean; italic: boolean };
/** One visual line; lines inside a block are separated by a line break. */
export type Line = Run[];
export type Block =
  | { type: "paragraph"; lines: Line[] }
  | { type: "list"; items: Line[][] };

export function parseBiography(source: string): Block[] {
  const blocks: Block[] = [];

  for (const lines of splitBlocks(source)) {
    let current: Block | null = null;
    for (const line of lines) {
      if (line.startsWith("- ")) {
        if (current?.type !== "list") {
          current = { type: "list", items: [] };
          blocks.push(current);
        }
        current.items.push([parseLine(line.slice(2))]);
      } else if (current?.type === "list") {
        // A line break inside a bullet.
        current.items[current.items.length - 1].push(parseLine(line));
      } else {
        if (!current) {
          current = { type: "paragraph", lines: [] };
          blocks.push(current);
        }
        current.lines.push(parseLine(line));
      }
    }
  }

  return blocks;
}

/** Literal text as blocks: blank lines split paragraphs, newlines break lines. */
export function plainBlocks(source: string): Block[] {
  return splitBlocks(source).map((lines) => ({
    type: "paragraph",
    lines: lines.map((text) => [{ text, bold: false, italic: false }]),
  }));
}

function splitBlocks(source: string) {
  return source
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t]*\n/)
    .map((block) => block.split("\n").filter((line) => line.trim() !== ""))
    .filter((lines) => lines.length > 0);
}

function parseLine(line: string): Line {
  const runs: Line = [];
  let bold = false;
  let italic = false;
  let text = "";

  const flush = () => {
    if (text) runs.push({ text, bold, italic });
    text = "";
  };

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "\\" && i + 1 < line.length) {
      text += line[++i];
    } else if (char === "*") {
      flush();
      if (line[i + 1] === "*") {
        bold = !bold;
        i++;
      } else {
        italic = !italic;
      }
    } else {
      text += char;
    }
  }
  flush();

  return runs;
}

/** Editor content for a stored biography. */
export function biographyToDoc(
  source: string | null,
  format: BiographyFormat,
): JSONContent {
  const blocks = source
    ? format === "rich"
      ? parseBiography(source)
      : plainBlocks(source)
    : [];

  return {
    type: "doc",
    content: blocks.length
      ? blocks.map((block) =>
          block.type === "paragraph"
            ? paragraph(block.lines)
            : {
                type: "bulletList",
                content: block.items.map((lines) => ({
                  type: "listItem",
                  content: [paragraph(lines)],
                })),
              },
        )
      : [{ type: "paragraph" }],
  };
}

function paragraph(lines: Line[]): JSONContent {
  const content: JSONContent[] = [];
  lines.forEach((line, index) => {
    if (index > 0) content.push({ type: "hardBreak" });
    for (const run of line) {
      const marks = [
        ...(run.bold ? [{ type: "bold" }] : []),
        ...(run.italic ? [{ type: "italic" }] : []),
      ];
      content.push({
        type: "text",
        text: run.text,
        ...(marks.length ? { marks } : {}),
      });
    }
  });
  return { type: "paragraph", ...(content.length ? { content } : {}) };
}

/** The `rich` text for editor content. Empty content gives "". */
export function docToBiography(doc: JSONContent): string {
  const blocks: string[] = [];

  for (const node of doc.content ?? []) {
    if (node.type === "bulletList") {
      const items = (node.content ?? [])
        .map((item) => lines(item.content?.[0]))
        .filter((itemLines) => itemLines.length > 0)
        .map(([first, ...rest]) => [`- ${first}`, ...rest].join("\n"));
      if (items.length) blocks.push(items.join("\n"));
    } else {
      const text = lines(node).join("\n");
      if (text) blocks.push(text);
    }
  }

  return blocks.join("\n\n");
}

// A paragraph's lines, with markers and escapes, skipping empty lines.
function lines(node: JSONContent | undefined): string[] {
  const out: string[] = [];
  let line = "";
  let bold = false;
  let italic = false;

  const endLine = () => {
    if (bold) line += "**";
    if (italic) line += "*";
    bold = italic = false;
    if (line.trim()) out.push(line.startsWith("-") ? `\\${line}` : line);
    line = "";
  };

  for (const child of node?.content ?? []) {
    if (child.type === "hardBreak") {
      endLine();
      continue;
    }
    if (child.type !== "text" || !child.text) continue;

    const wantBold = child.marks?.some((m) => m.type === "bold") ?? false;
    const wantItalic = child.marks?.some((m) => m.type === "italic") ?? false;
    if (wantBold !== bold) line += "**";
    if (wantItalic !== italic) line += "*";
    bold = wantBold;
    italic = wantItalic;
    line += child.text.replace(/[\\*]/g, (char) => `\\${char}`);
  }
  endLine();

  return out;
}
