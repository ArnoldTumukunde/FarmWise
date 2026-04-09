import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Youtube as YoutubeIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  RemoveFormatting,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-[#2E7D32]/15 text-[#2E7D32]'
          : 'text-[#5A6E5A] hover:bg-gray-100 hover:text-[#1B2B1B]'
      } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1" />;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing your article...',
  className = '',
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full mx-auto' },
      }),
      Youtube.configure({
        HTMLAttributes: { class: 'rounded-lg overflow-hidden mx-auto' },
        width: 640,
        height: 360,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#2E7D32] underline underline-offset-2 hover:text-[#256829]',
        },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-[#1B2B1B]',
      },
    },
  });

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addYoutube = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter YouTube video URL:');
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (showLinkInput) {
      if (linkUrl) {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setShowLinkInput(false);
      setLinkUrl('');
    } else {
      const existing = editor.getAttributes('link').href;
      setLinkUrl(existing || '');
      setShowLinkInput(true);
      setTimeout(() => linkInputRef.current?.focus(), 50);
    }
  }, [editor, showLinkInput, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor]);

  if (!editor) return null;

  const sz = 15;

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-gray-200 bg-gray-50/80">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 size={sz} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title="Inline code"
        >
          <Code size={sz} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus size={sz} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align left"
        >
          <AlignLeft size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align center"
        >
          <AlignCenter size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align right"
        >
          <AlignRight size={sz} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={addImage} title="Insert image">
          <ImageIcon size={sz} />
        </ToolbarButton>
        <ToolbarButton onClick={addYoutube} title="Embed YouTube video">
          <YoutubeIcon size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Add link"
        >
          <LinkIcon size={sz} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear formatting"
        >
          <RemoveFormatting size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo size={sz} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo size={sz} />
        </ToolbarButton>
      </div>

      {/* Link input bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-200">
          <LinkIcon size={14} className="text-blue-500 flex-shrink-0" />
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') setLink();
              if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
            }}
          />
          <button
            type="button"
            onClick={setLink}
            className="text-xs font-semibold text-white bg-[#2E7D32] px-3 py-1 rounded hover:bg-[#256829]"
          >
            Apply
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={removeLink}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
