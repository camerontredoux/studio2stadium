import { describe, expect, it } from "vitest";
import {
  biographyToDoc,
  docToBiography,
  parseBiography,
  plainBlocks,
} from "./format";

const plain = (text: string) => ({ text, bold: false, italic: false });

describe("parseBiography", () => {
  it("reads paragraphs, bullets, bold and italic", () => {
    expect(
      parseBiography(
        "I'm **Kaia**, a *dancer*.\n\nTraining focus:\n\n- Jazz\n- Pom",
      ),
    ).toEqual([
      {
        type: "paragraph",
        lines: [
          [
            plain("I'm "),
            { text: "Kaia", bold: true, italic: false },
            plain(", a "),
            { text: "dancer", bold: false, italic: true },
            plain("."),
          ],
        ],
      },
      { type: "paragraph", lines: [[plain("Training focus:")]] },
      { type: "list", items: [[[plain("Jazz")]], [[plain("Pom")]]] },
    ]);
  });

  it("starts a list at a bullet line under a paragraph line", () => {
    expect(parseBiography("Focus:\n- Jazz\n  and pom\n- Hip hop")).toEqual([
      { type: "paragraph", lines: [[plain("Focus:")]] },
      {
        type: "list",
        items: [[[plain("Jazz")], [plain("  and pom")]], [[plain("Hip hop")]]],
      },
    ]);
  });

  it("treats escaped characters literally", () => {
    expect(parseBiography("\\- 5\\*6\\*7\\*8 \\\\")).toEqual([
      { type: "paragraph", lines: [[plain("- 5*6*7*8 \\")]] },
    ]);
  });

  it("never produces markup from angle brackets", () => {
    expect(parseBiography("<b>hi</b>")).toEqual([
      { type: "paragraph", lines: [[plain("<b>hi</b>")]] },
    ]);
  });
});

describe("plainBlocks", () => {
  it("keeps asterisks and dashes in a plain biography", () => {
    expect(plainBlocks("- not a list *really*\nnext\n\nsecond")).toEqual([
      {
        type: "paragraph",
        lines: [[plain("- not a list *really*")], [plain("next")]],
      },
      { type: "paragraph", lines: [[plain("second")]] },
    ]);
  });
});

describe("docToBiography", () => {
  it("round-trips editor content", () => {
    const source =
      "Hi, I'm **Kaia**.\nA ***Class*** of *2027* dancer.\n\n- Jazz, *pom*\n- Hip hop\n\n\\- 5\\*6 \\\\";
    expect(docToBiography(biographyToDoc(source, "rich"))).toBe(source);
  });

  it("escapes a plain biography so it reads back word for word", () => {
    const legacy = "- loves *jazz*\n\n5*6*7*8 \\o/";
    const saved = docToBiography(biographyToDoc(legacy, "plain"));
    expect(parseBiography(saved)).toEqual(plainBlocks(legacy));
  });

  it("gives an empty string for an empty editor", () => {
    expect(docToBiography(biographyToDoc(null, "rich"))).toBe("");
  });
});
