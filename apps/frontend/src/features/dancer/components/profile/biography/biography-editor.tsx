import { Toggle } from "@/components/ui/toggle";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/ui/toolbar";
import { cn } from "@/components/utils/cn";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BoldIcon, ItalicIcon, ListIcon, PilcrowIcon } from "lucide-react";
import { useState } from "react";
import { extensions } from "./extensions";
import { biographyToDoc, type BiographyFormat, docToBiography } from "./format";

interface BiographyEditorProps {
  value: string | null;
  format: BiographyFormat;
  onChange: (value: string) => void;
  invalid?: boolean;
}

export function BiographyEditor({
  value,
  format,
  onChange,
  invalid,
}: BiographyEditorProps) {
  // The editor owns its content after mount; `value` only seeds it.
  const [initial] = useState(() => biographyToDoc(value, format));

  const editor = useEditor({
    extensions,
    content: initial,
    editorProps: {
      attributes: {
        "aria-label": "Biography",
        "aria-multiline": "true",
        role: "textbox",
        class:
          "min-h-36! max-h-80 overflow-y-auto p-3! text-base sm:text-sm [&_p]:leading-relaxed [&_ul]:pl-5! [&_li]:mt-1! [&_li_p]:mt-0! [&>*+*]:mt-3!",
      },
    },
    onUpdate: ({ editor }) => onChange(docToBiography(editor.getJSON())),
  });

  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      list: editor?.isActive("bulletList") ?? false,
    }),
  });

  return (
    <div
      className={cn(
        "border-input bg-background ring-ring/24 focus-within:border-ring dark:bg-input/32 overflow-hidden rounded-lg border shadow-xs transition-shadow focus-within:ring-[3px]",
        invalid && "border-destructive/36",
      )}
    >
      <Toolbar
        aria-label="Biography formatting"
        className="bg-muted/50 rounded-none border-0 border-b p-1"
      >
        <ToolbarGroup>
          <ToolbarButton
            render={
              <Toggle
                size="sm"
                aria-label="Bold"
                title="Bold (Ctrl+B)"
                pressed={active?.bold}
                onPressedChange={() =>
                  editor?.chain().focus().toggleBold().run()
                }
              />
            }
          >
            <BoldIcon />
          </ToolbarButton>
          <ToolbarButton
            render={
              <Toggle
                size="sm"
                aria-label="Italic"
                title="Italic (Ctrl+I)"
                pressed={active?.italic}
                onPressedChange={() =>
                  editor?.chain().focus().toggleItalic().run()
                }
              />
            }
          >
            <ItalicIcon />
          </ToolbarButton>
        </ToolbarGroup>
        <ToolbarSeparator orientation="vertical" />
        <ToolbarGroup>
          <ToolbarButton
            render={
              <Toggle
                size="sm"
                aria-label="Bulleted list"
                title="Bulleted list"
                pressed={active?.list}
                onPressedChange={() =>
                  editor?.chain().focus().toggleBulletList().run()
                }
              />
            }
          >
            <ListIcon />
          </ToolbarButton>
          <ToolbarButton
            render={
              <Toggle
                size="sm"
                aria-label="Paragraph"
                title="Paragraph"
                pressed={!active?.list}
                onPressedChange={() =>
                  editor?.chain().focus().liftListItem("listItem").run()
                }
              />
            }
          >
            <PilcrowIcon />
          </ToolbarButton>
        </ToolbarGroup>
      </Toolbar>
      <EditorContent editor={editor} />
    </div>
  );
}
