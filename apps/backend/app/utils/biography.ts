import type { BiographyFormat } from "#database/schema/enums";

/**
 * A biography as plain text, for places that show it without formatting (the
 * feed spotlight, an Org Event's copy of the dancer's profile). A `rich`
 * biography loses its bold and italic markers and its bullets become "•".
 */
export function biographyText(
  biography: string | null,
  format: BiographyFormat
): string | null {
  if (biography === null || format === "plain") return biography;

  return biography
    .split("\n")
    .map((line) => {
      const bullet = line.startsWith("- ");
      return (bullet ? "• " : "") + stripInline(bullet ? line.slice(2) : line);
    })
    .join("\n");
}

// Drops unescaped `*` and unescapes `\x` to `x`.
function stripInline(line: string) {
  let out = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "\\" && i + 1 < line.length) {
      out += line[++i];
    } else if (char !== "*") {
      out += char;
    }
  }
  return out;
}
