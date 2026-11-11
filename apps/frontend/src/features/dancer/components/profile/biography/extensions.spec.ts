import { Editor, type JSONContent } from "@tiptap/react";
import { afterEach, describe, expect, it } from "vitest";
import { extensions } from "./extensions";

const paragraph = (text: string): JSONContent => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

const bullets = (...items: string[]): JSONContent => ({
  type: "bulletList",
  content: items.map((text) => ({
    type: "listItem",
    content: [paragraph(text)],
  })),
});

let editor: Editor | undefined;

afterEach(() => editor?.destroy());

function open(...content: JSONContent[]) {
  editor = new Editor({
    element: null,
    extensions,
    content: { type: "doc", content },
  });
  return editor;
}

function cursorAtStart(editor: Editor, text: string) {
  let pos = -1;
  editor.state.doc.descendants((node, at) => {
    if (pos === -1 && node.isTextblock && node.textContent === text) {
      pos = at + 1;
    }
  });
  editor.commands.setTextSelection(pos);
}

// Runs the key through the editor's keymaps, as the browser would.
function press(editor: Editor, key: string, shiftKey = false) {
  const event = {
    key,
    shiftKey,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
  } as KeyboardEvent;
  return editor.extensionManager.plugins.some(
    (plugin) =>
      plugin.props.handleKeyDown?.call(plugin, editor.view, event) === true,
  );
}

describe("biography editor keys", () => {
  it("leaves Tab to move focus on a bullet after the first", () => {
    const editor = open(bullets("Jazz", "Pom"));
    const before = editor.getJSON();
    cursorAtStart(editor, "Pom");

    expect(() => press(editor, "Tab")).not.toThrow();
    expect(press(editor, "Tab")).toBe(false);
    expect(editor.getJSON()).toEqual(before);
  });

  it("splits a bullet with Enter and lifts it out with Shift-Tab", () => {
    const editor = open(bullets("Jazz"));
    editor.commands.setTextSelection(5);

    expect(press(editor, "Enter")).toBe(true);
    expect(editor.getJSON().content).toEqual([
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [paragraph("Ja")] },
          { type: "listItem", content: [paragraph("zz")] },
        ],
      },
    ]);

    expect(press(editor, "Tab", true)).toBe(true);
    expect(editor.getJSON().content).toEqual([bullets("Ja"), paragraph("zz")]);
  });

  it("keeps the document valid on Backspace in a paragraph after a list", () => {
    const editor = open(bullets("Jazz", "Pom"), paragraph("Contemporary"));
    cursorAtStart(editor, "Contemporary");

    expect(() => press(editor, "Backspace")).not.toThrow();
    expect(() => editor.state.doc.check()).not.toThrow();
    expect(editor.getText()).toContain("Contemporary");
  });
});
