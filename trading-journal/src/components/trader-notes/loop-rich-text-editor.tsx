"use client";

import { Editor } from "novel-lightweight";
import { useEffect, useRef, type ReactNode } from "react";

type EditorComponentType = (props: Record<string, unknown>) => ReactNode;
const NovelEditor = Editor as unknown as EditorComponentType;

type NovelEditorInstance = {
  storage: { markdown: { getMarkdown: () => string } };
  commands: { setContent: (content: string) => void };
};

export function LoopRichTextEditor({
  content,
  onChange,
  onImageUpload,
}: {
  content: string;
  onChange: (markdown: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}) {
  const editorRef = useRef<NovelEditorInstance | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (editor && editor.storage.markdown.getMarkdown() !== content) {
        editor.commands.setContent(content);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [content]);

  return (
    <div className="loop-rich-text-editor min-h-[55vh]">
      <NovelEditor
        className="min-h-[55vh] w-full"
        defaultValue={content}
        disableLocalStorage
        handleImageUpload={onImageUpload}
        debounceDuration={250}
        onUpdate={(editor: unknown) => {
          if (editor) editorRef.current = editor as unknown as NovelEditorInstance;
        }}
        onDebouncedUpdate={(editor: unknown) => {
          if (!editor) return;
          const instance = editor as unknown as NovelEditorInstance;
          editorRef.current = instance;
          onChange(instance.storage.markdown.getMarkdown());
        }}
      />
    </div>
  );
}
