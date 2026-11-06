import React from "react";
import { ExternalLink, Square, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// Tokenize an inline string (e.g. "Price swept **Asia Low** into `21,420` zone")
export function parseInline(text: string, isUser = false): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  // Regex to match code, bold, italic, link
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    const key = `inline-${match.index}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      elements.push(
        <code
          key={key}
          className={cn(
            "rounded px-1.5 py-0.5 font-mono text-[11px] font-medium border",
            isUser
              ? "bg-white/20 text-white border-white/30"
              : "bg-muted/80 text-violet-300 border-violet-500/20"
          )}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      elements.push(
        <strong key={key} className={cn("font-semibold", isUser ? "text-white" : "text-foreground")}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      elements.push(
        <em key={key} className={cn("italic", isUser ? "text-white/95" : "text-foreground/90")}>
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[") && token.includes("](")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        elements.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "underline inline-flex items-center gap-0.5 font-medium",
              isUser ? "text-white hover:text-white/80" : "text-violet-400 hover:text-violet-300"
            )}
          >
            {linkMatch[1]}
            <ExternalLink size={10} className="inline opacity-70" />
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

interface RichChatMessageProps {
  content: string;
  isUser?: boolean;
  className?: string;
}

export function RichChatMessage({ content, isUser = false, className }: RichChatMessageProps) {
  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      blocks.push(
        <hr
          key={`hr-${i}`}
          className={cn("my-2.5", isUser ? "border-white/30" : "border-border/60")}
        />
      );
      i++;
      continue;
    }

    // Code Block (```lang ... ```)
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      const lang = line.trim().slice(3).trim();
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```
      const codeText = codeLines.join("\n");
      blocks.push(
        <div
          key={`code-${i}`}
          className={cn(
            "my-2 rounded-xl border p-2.5 font-mono text-[11px] overflow-x-auto select-text",
            isUser ? "border-white/30 bg-black/25 text-white" : "border-border/70 bg-muted/40 text-foreground/90"
          )}
        >
          {lang && (
            <div className={cn("text-[9px] uppercase font-semibold mb-1 tracking-wider", isUser ? "text-white/70" : "text-muted-foreground/60")}>
              {lang}
            </div>
          )}
          <pre className="whitespace-pre leading-relaxed">{codeText}</pre>
        </div>
      );
      continue;
    }

    // Markdown Table (| Col 1 | Col 2 | ...)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        const bodyRows = tableLines.slice(2).map((r) =>
          r
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        );

        blocks.push(
          <div
            key={`table-${i}`}
            className={cn(
              "my-2.5 overflow-x-auto rounded-xl border shadow-2xs",
              isUser ? "border-white/30 bg-black/20" : "border-border/70 bg-card"
            )}
          >
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className={cn("border-b", isUser ? "border-white/20 bg-white/10" : "border-border/70 bg-muted/50")}>
                  {headerRow.map((h, hIdx) => (
                    <th key={`th-${hIdx}`} className={cn("p-2 font-semibold", isUser ? "text-white" : "text-foreground/90")}>
                      {parseInline(h, isUser)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cn("divide-y", isUser ? "divide-white/15" : "divide-border/50")}>
                {bodyRows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className={cn(isUser ? "hover:bg-white/5" : "hover:bg-muted/20", "transition-colors")}>
                    {row.map((cell, cIdx) => (
                      <td key={`td-${cIdx}`} className={cn("p-2", isUser ? "text-white/95" : "text-foreground/80")}>
                        {parseInline(cell, isUser)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // Headings
    if (line.startsWith("#### ")) {
      blocks.push(
        <h4
          key={`h4-${i}`}
          className={cn("mt-3 mb-1 text-xs font-semibold tracking-tight", isUser ? "text-white" : "text-foreground")}
        >
          {parseInline(line.slice(5), isUser)}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3
          key={`h3-${i}`}
          className={cn(
            "mt-3.5 mb-1.5 text-xs font-bold tracking-tight flex items-center gap-1.5",
            isUser ? "text-white" : "text-violet-300"
          )}
        >
          <span className={cn("size-1.5 rounded-full", isUser ? "bg-white" : "bg-violet-400")} />
          <span>{parseInline(line.slice(4), isUser)}</span>
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h2
          key={`h2-${i}`}
          className={cn(
            "mt-4 mb-2 text-sm font-bold border-b pb-1",
            isUser ? "border-white/30 text-white" : "border-border/50 text-foreground"
          )}
        >
          {parseInline(line.slice(3), isUser)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h1
          key={`h1-${i}`}
          className={cn("mt-4 mb-2 text-base font-extrabold", isUser ? "text-white" : "text-foreground")}
        >
          {parseInline(line.slice(2), isUser)}
        </h1>
      );
      i++;
      continue;
    }

    // Blockquote (> ...)
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2).trim());
        i++;
      }
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className={cn(
            "my-2 border-l-2 px-2.5 py-1.5 rounded-r-lg italic text-[11px] leading-relaxed",
            isUser ? "border-white/60 bg-white/10 text-white/95" : "border-violet-500 bg-violet-500/5 text-muted-foreground"
          )}
        >
          {parseInline(quoteLines.join(" "), isUser)}
        </blockquote>
      );
      continue;
    }

    // Task Checklist (- [ ] or - [x])
    if (/^[-*] \[[ xX]\] /.test(line)) {
      const taskItems: Array<{ checked: boolean; text: string }> = [];
      while (i < lines.length && /^[-*] \[[ xX]\] /.test(lines[i])) {
        const checked = lines[i].includes("[x]") || lines[i].includes("[X]");
        const text = lines[i].replace(/^[-*] \[[ xX]\] /, "");
        taskItems.push({ checked, text });
        i++;
      }
      blocks.push(
        <div key={`tasks-${i}`} className="my-2 space-y-1 pl-1">
          {taskItems.map((task, tIdx) => (
            <div key={`task-${tIdx}`} className="flex items-start gap-2 text-xs leading-snug">
              {task.checked ? (
                <CheckSquare size={13} className={cn("mt-0.5 shrink-0", isUser ? "text-white" : "text-emerald-400")} />
              ) : (
                <Square size={13} className={cn("mt-0.5 shrink-0", isUser ? "text-white/60" : "text-muted-foreground/60")} />
              )}
              <span className={cn(task.checked ? (isUser ? "text-white/70 line-through" : "text-foreground line-through opacity-70") : isUser ? "text-white" : "text-foreground")}>
                {parseInline(task.text, isUser)}
              </span>
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Bullet List (- or * or •)
    if (/^[-*•] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•] /, ""));
        i++;
      }
      blocks.push(
        <ul
          key={`ul-${i}`}
          className={cn(
            "my-2 space-y-1 pl-4 list-disc text-xs leading-relaxed",
            isUser ? "marker:text-white/80" : "marker:text-violet-400"
          )}
        >
          {items.map((item, itemIdx) => (
            <li key={`li-${itemIdx}`} className={cn("pl-0.5", isUser ? "text-white" : "text-foreground/90")}>
              {parseInline(item, isUser)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered List (1. 2. 3.)
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      blocks.push(
        <ol
          key={`ol-${i}`}
          className={cn(
            "my-2 space-y-1 pl-4 list-decimal text-xs leading-relaxed",
            isUser ? "marker:text-white marker:font-semibold" : "marker:text-violet-400 marker:font-semibold"
          )}
        >
          {items.map((item, itemIdx) => (
            <li key={`oli-${itemIdx}`} className={cn("pl-0.5", isUser ? "text-white" : "text-foreground/90")}>
              {parseInline(item, isUser)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular Paragraph
    blocks.push(
      <p
        key={`p-${i}`}
        className={cn("my-1.5 text-xs leading-relaxed", isUser ? "text-white" : "text-foreground/90")}
      >
        {parseInline(line, isUser)}
      </p>
    );
    i++;
  }

  return (
    <div
      className={cn(
        "rich-chat-content w-full select-text leading-relaxed",
        isUser ? "text-white" : "text-foreground",
        className
      )}
    >
      {blocks}
    </div>
  );
}
