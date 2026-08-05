"use client";

import { useEffect } from "react";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Italic, LinkIcon, List, ListOrdered, Quote, Strikethrough } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function BlogEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] rounded-b-2xl border-x border-b border-border-soft bg-white px-4 py-4 text-sm leading-7 text-brand-text outline-none prose-headings:font-semibold",
      },
    },
    onUpdate({ editor: instance }) {
      onChange(instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.getHTML() === value) return;
    editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
  }, [editor, value]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "https://");

    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const buttonClass = (active: boolean) =>
    `inline-flex size-9 items-center justify-center rounded-lg border text-brand-text transition ${
      active ? "border-brand-secondary bg-brand-secondary/10 text-brand-secondary" : "border-border-soft bg-white hover:border-brand-secondary/40"
    }`;

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-2xl border border-border-soft bg-brand-surface/80 p-2">
        <button type="button" className={buttonClass(editor?.isActive("bold") ?? false)} onClick={() => editor?.chain().focus().toggleBold().run()} title="Negritas">
          <Bold className="size-4" />
        </button>
        <button type="button" className={buttonClass(editor?.isActive("italic") ?? false)} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Cursivas">
          <Italic className="size-4" />
        </button>
        <button type="button" className={buttonClass(editor?.isActive("strike") ?? false)} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Tachado">
          <Strikethrough className="size-4" />
        </button>
        <button type="button" className={buttonClass(editor?.isActive("heading", { level: 2 }) ?? false)} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Titulo">
          <Heading2 className="size-4" />
        </button>
        <button type="button" className={buttonClass(editor?.isActive("bulletList") ?? false)} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista">
          <List className="size-4" />
        </button>
        <button type="button" className={buttonClass(editor?.isActive("orderedList") ?? false)} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Lista numerada">
          <ListOrdered className="size-4" />
        </button>
        <button type="button" className={buttonClass(editor?.isActive("blockquote") ?? false)} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Cita">
          <Quote className="size-4" />
        </button>
        <button type="button" className={buttonClass(editor?.isActive("link") ?? false)} onClick={setLink} title="Link">
          <LinkIcon className="size-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
