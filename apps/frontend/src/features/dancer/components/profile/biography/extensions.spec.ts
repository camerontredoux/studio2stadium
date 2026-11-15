import { Editor, type JSONContent } from "@tiptap/react";
import { describe, expect, it, onTestFinished } from "vitest";
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

function open(...content: JSONContent[]) {
  const editor = new Editor({
    element: null,
    extensions,
    content: { type: "doc", content },
  });
  onTestFinished(() => editor.destroy());
  return editor;
}

function cursorAt(editor: Editor, text: string, offset = 0) {
  let pos = -1;
  editor.state.doc.descendants((node, at) => {
    if (pos === -1 && node.isTextblock && node.textContent === text) {
      pos = at + 1 + offset;
    }
  });
  editor.commands.setTextSelection(pos);
}

// A headless editor has no view, so send the key through its keymaps.
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
    cursorAt(editor, "Pom");

    expect(press(editor, "Tab")).toBe(false);
    expect(editor.getJSON()).toEqual(before);
  });

  it("splits a bullet with Enter and lifts it out with Shift-Tab", () => {
    const editor = open(bullets("Jazz"));
    cursorAt(editor, "Jazz", 2);

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
    cursorAt(editor, "Contemporary");

    press(editor, "Backspace");
    editor.state.doc.check();
    expect(editor.getText()).toContain("Contemporary");
  });
});
