import { BulletList, ListItem } from "@tiptap/extension-list";
import StarterKit from "@tiptap/starter-kit";

export const extensions = [
  // Only what the biography format can store.
  StarterKit.configure({
    blockquote: false,
    bulletList: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    link: false,
    listItem: false,
    orderedList: false,
    strike: false,
    underline: false,
  }),
  BulletList,
  // A bullet holds one paragraph, so Tab can't nest a list the profile
  // can't show; it moves focus on instead.
  ListItem.extend({
    content: "paragraph",
    addKeyboardShortcuts() {
      const { Tab: _sink, ...keys } = this.parent?.() ?? {};
      return keys;
    },
  }),
];
