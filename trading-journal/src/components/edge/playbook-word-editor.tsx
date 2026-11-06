"use client";

import { useEffect, useRef, useState, useCallback, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Table as TableIcon,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  RemoveFormatting,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  Highlighter,
  Palette,
  ArrowUpDown,
  Eye,
  X,
  Sparkles,
  Cloud,
  FileText,
  Heading2,
  Type,
  SeparatorHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaybookWordEditorProps {
  initialContent?: string | null;
  onChange?: (content: string) => void;
  onManualSave?: () => void;
  isContinuous?: boolean;
  saveStatus?: "saving" | "saved" | "failed";
  reviewed?: boolean;
  reviewedAt?: string | null;
  onToggleReviewed?: () => void;
}

const colorPalette = [
  { label: "Default", color: "inherit" },
  { label: "Violet", color: "#8b5cf6" },
  { label: "Emerald", color: "#10b981" },
  { label: "Amber", color: "#f59e0b" },
  { label: "Rose", color: "#f43f5e" },
  { label: "Sky", color: "#0ea5e9" },
  { label: "Muted", color: "#a1a1aa" },
];

const highlightPalette = [
  { label: "None", color: "transparent" },
  { label: "Violet Tint", color: "rgba(139, 92, 246, 0.25)" },
  { label: "Emerald Tint", color: "rgba(16, 185, 129, 0.25)" },
  { label: "Amber Tint", color: "rgba(245, 158, 11, 0.25)" },
  { label: "Rose Tint", color: "rgba(244, 63, 94, 0.25)" },
  { label: "Sky Tint", color: "rgba(14, 165, 233, 0.25)" },
];

export const defaultPlaybookTemplate = `
<h1>Playbook: Setup & Execution Protocol</h1>
<p><strong>Version:</strong> v1.0 | <strong>Market Regime:</strong> High Volatility Trend | <strong>Session:</strong> NY AM Killzone</p>
<hr class="playbook-block-separator" />

<h2>1. Core Edge & Setup Thesis</h2>
<p>Document the structural rationale and market conditions required for this edge to be valid:</p>
<ul>
  <li><strong>Higher Timeframe Bias:</strong> 4H / Daily institutional order flow alignment.</li>
  <li><strong>Liquidity Pool:</strong> Clean sweep of Asian Session High/Low or Previous Day Extreme.</li>
  <li><strong>Key Reaction Zone:</strong> Unmitigated Fair Value Gap (FVG) or Order Block in discount/premium.</li>
</ul>

<h2>2. Entry Model Matrix</h2>
<p>Execution parameters and trigger criteria:</p>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: rgba(255, 255, 255, 0.05);">
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Phase</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Requirement</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Timeframe</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>Pre-Condition</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Liquidity sweep at major session high/low</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">15m / 1H</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Mandatory</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>Trigger</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Market Structure Shift (MSS) with displacement</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1m / 5m</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Mandatory</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>Execution</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Limit order on FVG retest with defined stop</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1m</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Mandatory</td>
    </tr>
  </tbody>
</table>

<h2>3. Pre-Flight Checklist</h2>
<p>Execute trade ONLY if every mandatory rule is satisfied:</p>
<ul data-type="taskList" style="list-style: none; padding-left: 0; margin: 8px 0;">
  <li style="margin: 6px 0; display: flex; align-items: center; gap: 8px;"><input type="checkbox" checked /> <span>Spread &amp; slippage are within normal parameters</span></li>
  <li style="margin: 6px 0; display: flex; align-items: center; gap: 8px;"><input type="checkbox" checked /> <span>No tier-1 high impact economic release within 10 minutes</span></li>
  <li style="margin: 6px 0; display: flex; align-items: center; gap: 8px;"><input type="checkbox" checked /> <span>Risk per trade strictly limited to 1.0% ($ account max)</span></li>
  <li style="margin: 6px 0; display: flex; align-items: center; gap: 8px;"><input type="checkbox" /> <span>Minimum Risk-to-Reward ratio of 1:2.0R to the first target</span></li>
</ul>

<h2>4. Exit Strategy &amp; Trade Management</h2>
<ul>
  <li><strong>TP1 (50% scale):</strong> 1:1.5R or opposing liquidity pool. Stop loss immediately moves to Breakeven.</li>
  <li><strong>TP2 (35% scale):</strong> 1:3.0R key structural target.</li>
  <li><strong>Runner (15% scale):</strong> Trailed behind recent 5-minute swing low/high.</li>
  <li><strong>Time Stop:</strong> Invalidate if trade does not expand within 45 minutes of entry.</li>
</ul>

<h2>5. Disqualifiers &amp; Invalidation Rules</h2>
<p>Immediate abort or skip trade if any of the following occur:</p>
<ul>
  <li>⚠️ Price closes beyond the invalidation swing level prior to fill.</li>
  <li>⚠️ Choppy, overlapping candle price action inside the killzone.</li>
  <li>⚠️ Daily drawdown threshold (-2.0%) reached. Session terminated.</li>
</ul>
<p><br/></p>
`;

interface SlashOption {
  label: string;
  description: string;
  icon: typeof Type;
  action: () => void;
  keywords: string[];
}

export function PlaybookWordEditor({
  initialContent,
  onChange,
  onManualSave,
  isContinuous = false,
  saveStatus = "saved",
  reviewed = false,
  reviewedAt = null,
  onToggleReviewed,
}: PlaybookWordEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSpacingPicker, setShowSpacingPicker] = useState(false);
  const [tableGrid, setTableGrid] = useState({ rows: 3, cols: 3 });

  const [lineSpacing, setLineSpacing] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("edgepro_playbook_line_spacing");
        if (saved) return saved;
      } catch {
        // storage fallback
      }
    }
    return "1.6";
  });

  // Slash menu state
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashActiveIdx, setSlashActiveIdx] = useState(0);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const slashMatchRef = useRef<{ node: Text; start: number; end: number } | null>(null);

  // Initialize content once
  useEffect(() => {
    if (!editorRef.current) return;
    const content = initialContent || defaultPlaybookTemplate;
    editorRef.current.innerHTML = content;
    updateCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ctrl+S / Cmd+S listener
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        onManualSave?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onManualSave]);

  const handleLineSpacingChange = (val: string) => {
    setLineSpacing(val);
    try {
      localStorage.setItem("edgepro_playbook_line_spacing", val);
    } catch {
      // storage unavailable
    }
    setShowSpacingPicker(false);
  };

  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  };

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    updateCounts();
    onChange?.(html);
    checkSlashQuery();
  }, [onChange]);

  // Monitor cursor / selection changes to highlight active table
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    const anchor = selection.anchorNode;
    if (!anchor || !editorRef.current.contains(anchor)) {
      setActiveTable(null);
      return;
    }
    const element = anchor.nodeType === Node.ELEMENT_NODE ? (anchor as HTMLElement) : anchor.parentElement;
    const table = element?.closest("table");
    setActiveTable(table ?? null);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Text formatting
  const exec = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleHeadingChange = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    if (tag === "p") {
      document.execCommand("formatBlock", false, "<p>");
    } else {
      document.execCommand("formatBlock", false, `<${tag}>`);
    }
    handleInput();
  };

  // Table operations
  const insertTable = (rows: number, cols: number) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0;"><thead><tr style="background-color: rgba(255, 255, 255, 0.05);">`;
    for (let c = 0; c < cols; c++) {
      tableHtml += `<th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Header ${c + 1}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 0; r < rows - 1; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < cols; c++) {
        tableHtml += `<td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Cell</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br/></p>`;

    document.execCommand("insertHTML", false, tableHtml);
    setShowTablePicker(false);
    handleInput();
  };

  const addTableRow = (above = false) => {
    if (!activeTable) return;
    const selection = window.getSelection();
    const cell = (selection?.anchorNode as HTMLElement)?.closest?.("td, th");
    const currentRow = cell?.closest("tr");
    const cols = activeTable.rows[0]?.cells.length || 3;

    const newRow = document.createElement("tr");
    for (let i = 0; i < cols; i++) {
      const td = document.createElement("td");
      td.style.border = "1px solid rgba(255, 255, 255, 0.15)";
      td.style.padding = "8px 12px";
      td.innerHTML = "<br/>";
      newRow.appendChild(td);
    }

    if (currentRow && currentRow.parentElement) {
      if (above) {
        currentRow.parentElement.insertBefore(newRow, currentRow);
      } else {
        currentRow.parentElement.insertBefore(newRow, currentRow.nextSibling);
      }
    } else {
      activeTable.querySelector("tbody")?.appendChild(newRow);
    }
    handleInput();
  };

  const deleteTableRow = () => {
    if (!activeTable) return;
    const selection = window.getSelection();
    const cell = (selection?.anchorNode as HTMLElement)?.closest?.("td, th");
    const row = cell?.closest("tr");
    if (row) {
      row.remove();
      handleInput();
    }
  };

  const addTableColumn = (before = false) => {
    if (!activeTable) return;
    const selection = window.getSelection();
    const cell = (selection?.anchorNode as HTMLElement)?.closest?.("td, th");
    const cellIndex = (cell as HTMLTableCellElement)?.cellIndex ?? 0;

    Array.from(activeTable.rows).forEach((row, rIdx) => {
      const isHeader = rIdx === 0 && row.parentElement?.tagName === "THEAD";
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.style.border = "1px solid rgba(255, 255, 255, 0.15)";
      newCell.style.padding = "8px 12px";
      newCell.innerHTML = isHeader ? "Header" : "<br/>";

      const targetCell = row.cells[cellIndex];
      if (targetCell) {
        if (before) {
          row.insertBefore(newCell, targetCell);
        } else {
          row.insertBefore(newCell, targetCell.nextSibling);
        }
      } else {
        row.appendChild(newCell);
      }
    });
    handleInput();
  };

  const deleteTableColumn = () => {
    if (!activeTable) return;
    const selection = window.getSelection();
    const cell = (selection?.anchorNode as HTMLElement)?.closest?.("td, th");
    const cellIndex = (cell as HTMLTableCellElement)?.cellIndex;
    if (cellIndex === undefined) return;

    Array.from(activeTable.rows).forEach((row) => {
      if (row.cells[cellIndex]) {
        row.cells[cellIndex].remove();
      }
    });
    handleInput();
  };

  const deleteTable = () => {
    if (!activeTable) return;
    activeTable.remove();
    setActiveTable(null);
    handleInput();
  };

  // Image handling
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      insertImageHtml(src);
    };
    reader.readAsDataURL(file);
  };

  const insertImageHtml = (src: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const imgHtml = `
      <div class="playbook-word-img-wrapper" style="margin: 16px 0; text-align: center;">
        <img src="${src}" alt="Playbook Chart" style="max-width: 100%; width: 75%; height: auto; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; display: inline-block;" />
      </div>
      <p><br/></p>
    `;
    document.execCommand("insertHTML", false, imgHtml);
    handleInput();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => handleImageFile(file));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageFile(file);
        return;
      }
    }
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    setSlashMenuOpen(false);
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      setSelectedImage(target as HTMLImageElement);
    } else {
      setSelectedImage(null);
    }

    // Toggle interactive checkbox without breaking DOM
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      if (target.checked) target.setAttribute("checked", "checked");
      else target.removeAttribute("checked");
      handleInput();
    }
  };

  const resizeSelectedImage = (widthPercent: number) => {
    if (!selectedImage) return;
    selectedImage.style.width = `${widthPercent}%`;
    handleInput();
  };

  const alignSelectedImage = (align: "left" | "center" | "right") => {
    if (!selectedImage) return;
    const wrapper = selectedImage.closest(".playbook-word-img-wrapper") as HTMLElement | null;
    if (wrapper) {
      wrapper.style.textAlign = align;
    } else {
      selectedImage.style.display = "block";
      if (align === "left") {
        selectedImage.style.margin = "12px auto 12px 0";
      } else if (align === "center") {
        selectedImage.style.margin = "12px auto";
      } else {
        selectedImage.style.margin = "12px 0 12px auto";
      }
    }
    handleInput();
  };

  const deleteSelectedImage = () => {
    if (!selectedImage) return;
    const wrapper = selectedImage.closest(".playbook-word-img-wrapper");
    if (wrapper) {
      wrapper.remove();
    } else {
      selectedImage.remove();
    }
    setSelectedImage(null);
    handleInput();
  };

  const insertChecklist = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const listHtml = `
      <ul data-type="taskList" style="list-style: none; padding-left: 0; margin: 8px 0;">
        <li style="margin: 6px 0; display: flex; align-items: center; gap: 8px;"><input type="checkbox"/> <span>New checklist item...</span></li>
      </ul>
      <p><br/></p>
    `;
    document.execCommand("insertHTML", false, listHtml);
    handleInput();
  };

  const resetToTemplate = () => {
    if (!editorRef.current) return;
    if (confirm("Replace playbook content with the standard Edge Playbook template?")) {
      editorRef.current.innerHTML = defaultPlaybookTemplate;
      handleInput();
    }
  };

  // Slash commands inline helper
  const checkSlashQuery = () => {
    const root = editorRef.current;
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    const offset = selection?.anchorOffset;
    if (!root || !selection || !node || typeof offset !== "number" || !root.contains(node) || node.nodeType !== Node.TEXT_NODE) {
      slashMatchRef.current = null;
      setSlashMenuOpen(false);
      return;
    }

    const textNode = node as Text;
    const prefix = textNode.data.slice(0, offset);
    const match = /(?:^|\s)\/([\w-]*)$/.exec(prefix);
    if (!match) {
      slashMatchRef.current = null;
      setSlashMenuOpen(false);
      return;
    }

    const slashStart = match.index + (match[0].startsWith(" ") ? 1 : 0);
    slashMatchRef.current = { node: textNode, start: slashStart, end: offset };
    setSlashQuery(match[1]);
    setSlashActiveIdx(0);

    const range = document.createRange();
    range.setStart(textNode, offset);
    range.collapse(true);
    const caret = range.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    setSlashPosition({
      top: caret.bottom - rootRect.top + 6,
      left: Math.max(12, caret.left - rootRect.left),
    });
    setSlashMenuOpen(true);
  };

  const removeSlashText = () => {
    const match = slashMatchRef.current;
    if (match?.node.isConnected) {
      match.node.deleteData(match.start, match.end - match.start);
    }
    slashMatchRef.current = null;
    setSlashMenuOpen(false);
  };

  const slashOptions: SlashOption[] = [
    {
      label: "Heading 1",
      description: "Top-level section title",
      icon: Heading2,
      keywords: ["h1", "title", "header"],
      action: () => {
        removeSlashText();
        handleHeadingChange("h1");
      },
    },
    {
      label: "Heading 2",
      description: "Sub-section header",
      icon: Heading2,
      keywords: ["h2", "subtitle", "section"],
      action: () => {
        removeSlashText();
        handleHeadingChange("h2");
      },
    },
    {
      label: "Text Paragraph",
      description: "Regular body text",
      icon: Type,
      keywords: ["p", "text", "paragraph"],
      action: () => {
        removeSlashText();
        handleHeadingChange("p");
      },
    },
    {
      label: "Bulleted List",
      description: "Unordered list with bullet points",
      icon: List,
      keywords: ["bullet", "list", "ul"],
      action: () => {
        removeSlashText();
        exec("insertUnorderedList");
      },
    },
    {
      label: "Numbered List",
      description: "Ordered sequential list",
      icon: ListOrdered,
      keywords: ["number", "ordered", "ol"],
      action: () => {
        removeSlashText();
        exec("insertOrderedList");
      },
    },
    {
      label: "Checklist / Tasks",
      description: "Interactive checkboxes",
      icon: ListChecks,
      keywords: ["todo", "task", "check", "box"],
      action: () => {
        removeSlashText();
        insertChecklist();
      },
    },
    {
      label: "Data Table",
      description: "Insert a formatted 3x3 table",
      icon: TableIcon,
      keywords: ["table", "grid", "matrix"],
      action: () => {
        removeSlashText();
        insertTable(3, 3);
      },
    },
    {
      label: "Insert Image",
      description: "Upload chart or screenshot",
      icon: ImageIcon,
      keywords: ["image", "picture", "photo", "chart"],
      action: () => {
        removeSlashText();
        fileInputRef.current?.click();
      },
    },
    {
      label: "Horizontal Divider",
      description: "Section break divider line",
      icon: SeparatorHorizontal,
      keywords: ["divider", "line", "separator", "hr"],
      action: () => {
        removeSlashText();
        exec("insertHorizontalRule");
      },
    },
  ];

  const filteredSlashOptions = slashOptions.filter((opt) => {
    if (!slashQuery) return true;
    const q = slashQuery.toLowerCase();
    return opt.label.toLowerCase().includes(q) || opt.keywords.some((k) => k.includes(q));
  });

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (slashMenuOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashActiveIdx((prev) => (prev + 1) % (filteredSlashOptions.length || 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashActiveIdx((prev) => (prev - 1 + filteredSlashOptions.length) % (filteredSlashOptions.length || 1));
        return;
      }
      if (e.key === "Enter" && filteredSlashOptions.length > 0) {
        e.preventDefault();
        filteredSlashOptions[slashActiveIdx]?.action();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashMenuOpen(false);
        return;
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card text-foreground overflow-hidden">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleImageFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* ─── MICROSOFT WORD STYLE COMMAND RIBBON / TOOLBAR ─── */}
      <header className="shrink-0 border-b border-border/70 bg-card/90 px-3 py-2 flex flex-wrap items-center gap-1.5 select-none z-20">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-border/60">
          <button
            type="button"
            onClick={() => exec("undo")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("redo")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Style Selector (Normal, Heading 1, 2, 3) */}
        <div className="flex items-center pr-1.5 border-r border-border/60">
          <select
            onChange={(e) => handleHeadingChange(e.target.value)}
            defaultValue="p"
            className="h-7 px-2 text-xs font-medium rounded-md border border-border/60 bg-muted/40 text-foreground cursor-pointer focus:outline-hidden"
            title="Text Style"
          >
            <option value="p">Normal Text</option>
            <option value="h1">Heading 1 (Title)</option>
            <option value="h2">Heading 2 (Section)</option>
            <option value="h3">Heading 3 (Sub-section)</option>
          </select>
        </div>

        {/* Text Styling: Bold, Italic, Underline, Strikethrough */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-border/60">
          <button
            type="button"
            onClick={() => exec("bold")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-foreground/80 hover:text-foreground font-bold transition-colors cursor-pointer"
            title="Bold (Ctrl+B)"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-foreground/80 hover:text-foreground italic transition-colors cursor-pointer"
            title="Italic (Ctrl+I)"
          >
            <Italic size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("underline")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-foreground/80 hover:text-foreground underline transition-colors cursor-pointer"
            title="Underline (Ctrl+U)"
          >
            <Underline size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("strikeThrough")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-foreground/80 hover:text-foreground line-through transition-colors cursor-pointer"
            title="Strikethrough"
          >
            <Strikethrough size={14} />
          </button>
        </div>

        {/* Text Color & Highlight Pickers */}
        <div className="relative flex items-center gap-0.5 pr-1.5 border-r border-border/60">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Text Color"
          >
            <Palette size={14} />
            <ChevronDown size={10} />
          </button>
          {showColorPicker && (
            <div className="absolute top-9 left-0 z-30 p-2 rounded-xl border border-border/70 bg-card shadow-lg flex gap-1.5">
              {colorPalette.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    exec("foreColor", c.color);
                    setShowColorPicker(false);
                  }}
                  className="size-5 rounded-full border border-border/60 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.color === "inherit" ? "#ffffff" : c.color }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Highlight Color"
          >
            <Highlighter size={14} />
            <ChevronDown size={10} />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-9 left-10 z-30 p-2 rounded-xl border border-border/70 bg-card shadow-lg flex gap-1.5">
              {highlightPalette.map((h) => (
                <button
                  key={h.label}
                  type="button"
                  onClick={() => {
                    exec("hiliteColor", h.color);
                    setShowHighlightPicker(false);
                  }}
                  className="size-5 rounded-md border border-border/60 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: h.color === "transparent" ? "#27272a" : h.color }}
                  title={h.label}
                />
              ))}
            </div>
          )}
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-border/60">
          <button
            type="button"
            onClick={() => exec("justifyLeft")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Align Left"
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("justifyCenter")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Align Center"
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("justifyRight")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Align Right"
          >
            <AlignRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("justifyFull")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Justify"
          >
            <AlignJustify size={14} />
          </button>
        </div>

        {/* Line Spacing (User Adjustable, defaults to 1.5) */}
        <div className="relative flex items-center pr-1.5 border-r border-border/60">
          <button
            type="button"
            onClick={() => setShowSpacingPicker(!showSpacingPicker)}
            className="px-2 py-1 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer text-xs font-mono"
            title="Line Spacing (User Adjustable)"
          >
            <ArrowUpDown size={13} className="text-violet-400" />
            <span>{lineSpacing}×</span>
            <ChevronDown size={10} />
          </button>
          {showSpacingPicker && (
            <div className="absolute top-9 left-0 z-30 p-1.5 rounded-xl border border-border/70 bg-card shadow-lg flex flex-col w-36 space-y-0.5">
              <span className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Line Spacing
              </span>
              {[
                { label: "1.0 (Tight)", value: "1.0" },
                { label: "1.15 (Compact)", value: "1.15" },
                { label: "1.4 (Comfortable)", value: "1.4" },
                { label: "1.6 (Standard)", value: "1.6" },
                { label: "1.75 (Relaxed)", value: "1.75" },
                { label: "2.0 (Double)", value: "2.0" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleLineSpacingChange(opt.value)}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded-md text-xs transition-colors cursor-pointer flex items-center justify-between",
                    lineSpacing === opt.value
                      ? "bg-violet-600 text-white font-medium"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <span>{opt.label}</span>
                  {lineSpacing === opt.value && <Check size={11} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lists & Tasks */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-border/60">
          <button
            type="button"
            onClick={() => exec("insertUnorderedList")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Bulleted List"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("insertOrderedList")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Numbered List"
          >
            <ListOrdered size={14} />
          </button>
          <button
            type="button"
            onClick={insertChecklist}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Insert Checklist / Task List"
          >
            <ListChecks size={14} />
          </button>
        </div>

        {/* Insert Table & Images */}
        <div className="relative flex items-center gap-1 pr-1.5 border-r border-border/60">
          <button
            type="button"
            onClick={() => setShowTablePicker(!showTablePicker)}
            className="px-2 py-1 rounded-md hover:bg-muted/70 text-xs text-foreground font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Create Table"
          >
            <TableIcon size={14} className="text-violet-400" />
            <span>Table</span>
            <ChevronDown size={10} />
          </button>

          {showTablePicker && (
            <div className="absolute top-9 left-0 z-30 p-3 rounded-xl border border-border/70 bg-card shadow-xl w-56 space-y-2.5">
              <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                Insert Table Grid
              </span>
              <div className="grid grid-cols-5 gap-1 p-1 bg-muted/30 rounded-lg">
                {[1, 2, 3, 4, 5].map((r) =>
                  [1, 2, 3, 4, 5].map((c) => (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() => setTableGrid({ rows: r, cols: c })}
                      onClick={() => insertTable(tableGrid.rows, tableGrid.cols)}
                      className={cn(
                        "size-5 rounded-xs border transition-colors cursor-pointer",
                        r <= tableGrid.rows && c <= tableGrid.cols
                          ? "bg-violet-500/40 border-violet-400"
                          : "border-border/40 hover:border-border"
                      )}
                    />
                  ))
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {tableGrid.rows} rows × {tableGrid.cols} cols
                </span>
                <button
                  type="button"
                  onClick={() => insertTable(tableGrid.rows, tableGrid.cols)}
                  className="px-2 py-0.5 rounded bg-violet-600 text-white font-medium hover:bg-violet-500 cursor-pointer text-[11px]"
                >
                  Insert
                </button>
              </div>
            </div>
          )}

          {/* Add Image Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded-md hover:bg-muted/70 text-xs text-foreground font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Insert Image (Upload or Paste)"
          >
            <ImageIcon size={14} className="text-violet-400" />
            <span>Image</span>
          </button>
        </div>

        {/* Divider & Clear */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => exec("insertHorizontalRule")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Horizontal Divider"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={() => exec("removeFormat")}
            className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Clear Formatting"
          >
            <RemoveFormatting size={14} />
          </button>
        </div>

        {/* Template & Manual Save */}
        <div className="ml-auto flex items-center gap-1.5">
          {onManualSave && (
            <button
              type="button"
              onClick={onManualSave}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border/70 hover:border-violet-500/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Save playbook to database (Ctrl+S)"
            >
              <Cloud size={12} className="text-violet-400" />
              <span>Save</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetToTemplate}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border/70 hover:border-violet-500/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Load standard Edge Playbook template"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span>Template</span>
          </button>
        </div>
      </header>

      {/* ─── CONTEXTUAL TABLE EDITING TOOLBAR (When cursor is inside a table) ─── */}
      {activeTable && (
        <div className="shrink-0 bg-violet-500/10 border-b border-violet-500/30 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs z-10 animate-in fade-in">
          <span className="font-semibold text-violet-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <TableIcon size={13} /> Table Tools:
          </span>
          <button
            type="button"
            onClick={() => addTableRow(true)}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px] flex items-center gap-1"
          >
            <Plus size={11} /> Row Above
          </button>
          <button
            type="button"
            onClick={() => addTableRow(false)}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px] flex items-center gap-1"
          >
            <Plus size={11} /> Row Below
          </button>
          <button
            type="button"
            onClick={deleteTableRow}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-rose-500/20 text-rose-300 cursor-pointer text-[11px] flex items-center gap-1"
          >
            <Trash2 size={11} /> Delete Row
          </button>
          <span className="text-muted-foreground/40">•</span>
          <button
            type="button"
            onClick={() => addTableColumn(true)}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px] flex items-center gap-1"
          >
            <Plus size={11} /> Col Left
          </button>
          <button
            type="button"
            onClick={() => addTableColumn(false)}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px] flex items-center gap-1"
          >
            <Plus size={11} /> Col Right
          </button>
          <button
            type="button"
            onClick={deleteTableColumn}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-rose-500/20 text-rose-300 cursor-pointer text-[11px] flex items-center gap-1"
          >
            <Trash2 size={11} /> Delete Col
          </button>
          <span className="text-muted-foreground/40">•</span>
          <button
            type="button"
            onClick={deleteTable}
            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium cursor-pointer text-[11px] flex items-center gap-1 ml-auto"
          >
            <Trash2 size={11} /> Remove Table
          </button>
        </div>
      )}

      {/* ─── CONTEXTUAL IMAGE RESIZE TOOLBAR (When image is clicked) ─── */}
      {selectedImage && (
        <div className="shrink-0 bg-violet-600/15 border-b border-violet-500/40 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs z-10 animate-in fade-in">
          <span className="font-semibold text-violet-400 flex items-center gap-1 text-[11px] uppercase tracking-wider">
            <ImageIcon size={13} /> Resize Image:
          </span>
          <div className="flex items-center gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => resizeSelectedImage(pct)}
                className="px-2 py-0.5 rounded border border-border/70 hover:bg-violet-500/20 text-foreground font-mono text-[11px] cursor-pointer"
              >
                {pct}%
              </button>
            ))}
          </div>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-[11px] text-muted-foreground">Align:</span>
          <button
            type="button"
            onClick={() => alignSelectedImage("left")}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px]"
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => alignSelectedImage("center")}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px]"
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => alignSelectedImage("right")}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px]"
          >
            Right
          </button>
          <button
            type="button"
            onClick={() => setLightboxImage({ src: selectedImage.src, title: selectedImage.alt || "Playbook chart" })}
            className="px-2 py-0.5 rounded border border-border/60 hover:bg-muted/60 text-foreground cursor-pointer text-[11px] flex items-center gap-1"
          >
            <Eye size={11} /> View Full
          </button>
          <button
            type="button"
            onClick={deleteSelectedImage}
            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium cursor-pointer text-[11px] flex items-center gap-1 ml-auto"
          >
            <Trash2 size={11} /> Delete Image
          </button>
        </div>
      )}

      {/* ─── MICROSOFT WORD DOCUMENT CANVAS ─── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 overscroll-contain relative"
        onClick={handleEditorClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          style={{ "--playbook-line-spacing": lineSpacing, lineHeight: "var(--playbook-line-spacing)" } as React.CSSProperties}
          className={cn(
            "mx-auto w-full max-w-[900px] min-h-[600px] focus:outline-hidden",
            "text-foreground font-sans text-sm",
            /* All child elements inherit the user-adjustable line spacing */
            "[&_*]:leading-[var(--playbook-line-spacing,1.5)]",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3",
            "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-1",
            "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1.5",
            "[&_p]:mb-3",
            "[&_ul:not([data-type='taskList'])]:list-disc [&_ul:not([data-type='taskList'])]:pl-5 [&_ul:not([data-type='taskList'])]:mb-3",
            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3",
            "[&_li]:mb-1",
            "[&_hr]:my-5 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border/60",
            /* Tables */
            "[&_table]:w-full [&_table]:border-collapse [&_table]:my-3",
            "[&_th]:border [&_th]:border-border/70 [&_th]:bg-muted/40 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-xs",
            "[&_td]:border [&_td]:border-border/70 [&_td]:p-2.5 [&_td]:text-xs",
            /* Images */
            "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:transition-all [&_img:hover]:ring-2 [&_img:hover]:ring-violet-500/50"
          )}
        />

        {/* ─── INLINE SLASH MENU ─── */}
        {slashMenuOpen && (
          <div
            role="listbox"
            aria-label="Insert Word Block"
            className="playbook-slash-menu absolute z-50 w-64 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-2xl animate-in fade-in zoom-in-95 duration-100"
            style={{ top: slashPosition.top, left: slashPosition.left }}
          >
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Insert Block
            </div>
            {filteredSlashOptions.map((option, idx) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.label}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={option.action}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-colors cursor-pointer text-xs",
                    idx === slashActiveIdx ? "bg-violet-600 text-white font-medium" : "hover:bg-muted text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md border text-xs",
                      idx === slashActiveIdx
                        ? "border-violet-400 bg-violet-700 text-white"
                        : "border-border/60 bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <Icon size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{option.label}</span>
                    <span
                      className={cn(
                        "block text-[10px] truncate",
                        idx === slashActiveIdx ? "text-violet-200" : "text-muted-foreground"
                      )}
                    >
                      {option.description}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredSlashOptions.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">No matching commands</p>
            )}
          </div>
        )}
      </div>

      {/* ─── MICROSOFT WORD STATUS STRIP (Bottom) ─── */}
      <footer className="shrink-0 border-t border-border/70 bg-card/90 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground select-none gap-2">
        <div className="flex items-center gap-3">
          <span>Page 1 of 1</span>
          <span>•</span>
          <span className="font-mono">{wordCount} words</span>
          <span>•</span>
          <span className="font-mono">{charCount} characters</span>
          {onToggleReviewed && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={onToggleReviewed}
                disabled={reviewed}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer",
                  reviewed
                    ? "bg-emerald-600 text-white"
                    : "bg-violet-600 text-white hover:bg-violet-500 shadow-xs"
                )}
              >
                <Check size={12} />
                <span>{reviewed ? "Reviewed" : "Mark as reviewed"}</span>
              </button>
              <span className="hidden sm:inline text-foreground text-[10px]">
                {reviewedAt ? `Last reviewed ${new Date(reviewedAt).toLocaleString()}` : "Not reviewed"}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={() => setShowSpacingPicker(!showSpacingPicker)}
            className="hover:text-foreground transition-colors font-mono cursor-pointer flex items-center gap-1"
            title="Adjust Line Spacing"
          >
            <ArrowUpDown size={11} className="text-violet-400" />
            <span>Spacing: {lineSpacing}×</span>
          </button>
          <span>•</span>
          {saveStatus === "saving" ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-violet-400 animate-pulse">
              <Cloud size={11} className="animate-spin" />
              Saving to database...
            </span>
          ) : saveStatus === "failed" ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-rose-400">
              Save failed
            </span>
          ) : (
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <Check size={11} />
              Saved
            </span>
          )}
          <span>•</span>
          <span>100% Zoom</span>
        </div>
      </footer>

      {/* ─── FULLSCREEN LIGHTBOX IMAGE MODAL ─── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.title}
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 rounded-lg bg-white/15 p-2 text-white hover:bg-white/25 transition-colors cursor-pointer"
            aria-label="Close image"
            onClick={() => setLightboxImage(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImage.src}
            alt={lightboxImage.title}
            className="max-h-[90vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

