import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExt from "@tiptap/extension-link";
import { useEffect } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered,
  Link as LinkIcon, Heading2, Minus, Undo, Redo, MousePointerClick,
  Calendar, Quote,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  /** Geeft een ref-handle terug voor externe insert-acties (variabelen). */
  onReady?: (editor: Editor) => void;
}

const Btn = ({
  active, onClick, title, children,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    className={`p-1.5 rounded transition-colors ${
      active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-border mx-1" />;

export function MailWysiwyg({ value, onChange, onReady }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false, code: false, blockquote: false }),
      Underline,
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[420px] px-5 py-4 text-[15px] leading-relaxed bg-white",
      },
    },
  });

  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link-URL (laat leeg om te verwijderen)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const insertButton = () => {
    const label = window.prompt("Knop-tekst", "Bevestig afspraak");
    if (!label) return;
    const url = window.prompt("Knop-URL", "{{afspraak.link}}");
    if (!url) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<p><a href="${url}" class="mh-btn" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a></p>`,
      )
      .run();
  };

  const insertCalendar = () => {
    const label = window.prompt("Tekst voor agenda-knop", "📅 Toevoegen aan mijn agenda");
    if (!label) return;
    editor
      .chain()
      .focus()
      .insertContent(
        `<p><a href="{{afspraak.ics_url}}" class="mh-btn" style="display:inline-block;background:#6d28d9;color:#ffffff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a></p>` +
          `<p style="font-size:13px;color:#64748b;margin-top:-4px;">Werkt in Google, Apple en Outlook agenda.</p>`,
      )
      .run();
  };

  const insertCallout = () => {
    editor
      .chain()
      .focus()
      .insertContent(
        `<div class="mh-callout" style="background:#f5f3ff;border-left:3px solid #6d28d9;padding:12px 16px;border-radius:6px;margin:14px 0;font-size:14px;"><strong>Tip:</strong> typ hier je tekst.</div><p></p>`,
      )
      .run();
  };

  const insertDivider = () => {
    editor
      .chain()
      .focus()
      .insertContent(`<hr class="mh-divider" style="border:0;border-top:1px solid #e2e8f0;margin:18px 0;" />`)
      .run();
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white flex flex-col">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 sticky top-0 z-10">
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Onderstrepen" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </Btn>
        <Divider />
        <Btn title="Kop" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Opsomming" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Genummerd" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>
        <Divider />
        <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Knop invoegen" onClick={insertButton}>
          <MousePointerClick className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Toevoegen aan agenda" onClick={insertCalendar}>
          <Calendar className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Highlight-blok" onClick={insertCallout}>
          <Quote className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Scheidingslijn" onClick={insertDivider}>
          <Minus className="h-3.5 w-3.5" />
        </Btn>
        <Divider />
        <Btn title="Ongedaan maken" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Opnieuw" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="h-3.5 w-3.5" />
        </Btn>
      </div>
      <EditorContent editor={editor} className="overflow-auto" />
    </div>
  );
}