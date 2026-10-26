"use client";

import { Editor } from "novel-lightweight";
import { useEffect, useRef } from "react";

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
      <Editor
        className="min-h-[55vh] w-full"
        defaultValue={content}
        disableLocalStorage
        handleImageUpload={onImageUpload}
        debounceDuration={250}
        onUpdate={(editor) => {
          if (editor) editorRef.current = editor as unknown as NovelEditorInstance;
        }}
        onDebouncedUpdate={(editor) => {
          if (!editor) return;
          editorRef.current = editor as unknown as NovelEditorInstance;
          onChange(editor.storage.markdown.getMarkdown());
        }}
      />
    </div>
  );
}
