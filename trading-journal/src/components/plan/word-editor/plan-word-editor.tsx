"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Type,
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
  Rows3,
  Columns3,
  Plus,
  Maximize2,
  Sparkles,
  FileText,
  Check,
  ChevronDown,
  Highlighter,
  Palette,
  ExternalLink,
  PanelLeftOpen,
  ArrowUpDown,
  Loader2,
  Cloud,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TradingPlanItem } from "@/components/plan/plan-sidebar";

interface PlanWordEditorProps {
  plan?: TradingPlanItem;
  saveStatus?: "saved" | "saving" | "error";
  onUpdateContent?: (content: string, snippet?: string) => void;
  onUpdateTitle?: (title: string) => void;
  onManualSave?: () => void;
  onToggleLeftSidebar?: () => void;
  leftSidebarOpen?: boolean;
}

const colorPalette = [
  { label: "Default", color: "inherit" },
  { label: "Violet", color: "#8b5cf6" },
  { label: "Emerald", color: "#10b981" },
  { label: "Amber", color: "#f59e0b" },
  { label: "Rose", color: "#f43f5e" },
  { label: "Sky", color: "#0ea5e9" },
  { label: "Muted", color: "#71717a" },
];

const highlightPalette = [
  { label: "None", color: "transparent" },
  { label: "Violet Tint", color: "rgba(139, 92, 246, 0.25)" },
  { label: "Emerald Tint", color: "rgba(16, 185, 129, 0.25)" },
  { label: "Amber Tint", color: "rgba(245, 158, 11, 0.25)" },
  { label: "Rose Tint", color: "rgba(244, 63, 94, 0.25)" },
  { label: "Sky Tint", color: "rgba(14, 165, 233, 0.25)" },
];

const defaultPlanTemplate = `
<h1>Daily Trading Plan</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} | <strong>Session:</strong> New York AM Killzone</p>
<hr/>
<h2>1. Market Narrative & Bias</h2>
<p>Document higher-timeframe order flow, key inflection zones, and resting liquidity pools:</p>
<ul>
  <li>Higher Timeframe Trend: Bullish expansion from daily demand</li>
  <li>Key Liquidity Targets: Previous Day High (PDH), London Session High</li>
  <li>Invalidation Level: Clean 15m structural swing low</li>
</ul>

<h2>2. Planned Setups Matrix</h2>
<p>Execution matrix for today's active tickers:</p>
<table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
  <thead>
    <tr style="background-color: rgba(255, 255, 255, 0.05);">
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Asset</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Model</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Entry Zone</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Invalidation</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">Target</th>
      <th style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px; text-align: left;">R:R</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>NQ</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Liquidity Sweep + FVG</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">21,420 - 21,435</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">21,390</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">21,580</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1:2.6R</td>
    </tr>
    <tr>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;"><strong>ES</strong></td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">Opening Range Break</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">5,845 - 5,848</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">5,836</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">5,870</td>
      <td style="border: 1px solid rgba(255, 255, 255, 0.15); padding: 8px 12px;">1:2.3R</td>
    </tr>
  </tbody>
</table>

<h2>3. Risk Guardrails & Execution Directives</h2>
<p>Discipline parameters enforced for this session:</p>
<ul data-type="taskList" style="list-style: none; padding-left: 0;">
  <li style="margin: 6px 0;"><input type="checkbox" checked/> Max Daily Loss: 1.0% ($500 hard circuit breaker)</li>
  <li style="margin: 6px 0;"><input type="checkbox" checked/> Maximum executions allowed: 3 trades</li>
  <li style="margin: 6px 0;"><input type="checkbox"/> Pause trading 5 minutes before and after high-impact news releases</li>
  <li style="margin: 6px 0;"><input type="checkbox"/> Minimum 30-minute cooling off period after any consecutive loss</li>
</ul>
<p><br></p>
`;

export function PlanWordEditor({
  plan,
  saveStatus = "saved",
  onUpdateContent,
  onUpdateTitle,
  onManualSave,
  onToggleLeftSidebar,
  leftSidebarOpen,
}: PlanWordEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [activeTable, setActiveTable] = useState<HTMLTableElement | null>(null);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSpacingPicker, setShowSpacingPicker] = useState(false);
  const [tableGrid, setTableGrid] = useState({ rows: 3, cols: 3 });
  const [lineSpacing, setLineSpacing] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("edgepro_plan_line_spacing");
        if (saved) return saved;
      } catch {
        // storage fallback
      }
    }
    return "1.5";
  });

  // Ctrl+S / Cmd+S listener for instant cloud save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      localStorage.setItem("edgepro_plan_line_spacing", val);
    } catch {
      // storage unavailable
    }
    setShowSpacingPicker(false);
  };

  // Load plan content whenever plan.id changes
  useEffect(() => {
    if (!editorRef.current) return;
    const content = plan?.content ?? defaultPlanTemplate;
    editorRef.current.innerHTML = content;
    updateCounts();
  }, [plan?.id]);

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
    const text = editorRef.current.innerText || "";
    const snippet = text.trim().slice(0, 75);
    updateCounts();
    onUpdateContent?.(html, snippet);
  }, [onUpdateContent]);

  // Track active table or active image when selection changes
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

  // Execute formatting command
  const exec = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  // Heading formatter
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

  // Insert Table
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

  // Table Manipulation Functions
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

  // Image Upload & Insertion
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
      <div class="plan-word-img-wrapper" style="margin: 16px 0; text-align: center;">
        <img src="${src}" alt="Plan Chart" style="max-width: 100%; width: 75%; height: auto; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; display: inline-block;" />
      </div>
      <p><br/></p>
    `;
    document.execCommand("insertHTML", false, imgHtml);
    handleInput();
  };

  // Handle Drag & Drop and Clipboard Pasting of Images
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

  // Image Selection for Resizing
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "IMG") {
      setSelectedImage(target as HTMLImageElement);
    } else {
      setSelectedImage(null);
    }
  };

  const resizeSelectedImage = (widthPercent: number) => {
    if (!selectedImage) return;
    selectedImage.style.width = `${widthPercent}%`;
    handleInput();
  };

  const alignSelectedImage = (align: "left" | "center" | "right") => {
    if (!selectedImage) return;
    const wrapper = selectedImage.closest(".plan-word-img-wrapper") as HTMLElement | null;
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
    const wrapper = selectedImage.closest(".plan-word-img-wrapper");
    if (wrapper) {
      wrapper.remove();
    } else {
      selectedImage.remove();
    }
    setSelectedImage(null);
    handleInput();
  };

  // Insert Checklist
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
    if (confirm("Reset document to the standard Trading Plan template?")) {
      editorRef.current.innerHTML = defaultPlanTemplate;
      handleInput();
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
      <header className="shrink-0 border-b border-border/70 bg-card/90 px-3 py-2 flex flex-wrap items-center gap-1.5 select-none">
        {/* Left Sidebar Toggle & Plan Title */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-border/60">
          {!leftSidebarOpen && onToggleLeftSidebar && (
            <button
              type="button"
              onClick={onToggleLeftSidebar}
              className="p-1.5 rounded-md hover:bg-muted/70 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Show Plans Sidebar"
            >
              <PanelLeftOpen size={14} className="text-violet-400" />
            </button>
          )}

          {plan && onUpdateTitle && (
            <input
              type="text"
              value={plan.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              className="h-7 px-2 text-xs font-semibold bg-transparent text-foreground border-b border-transparent hover:border-border/60 focus:border-violet-500 focus:outline-hidden max-w-[160px] truncate transition-colors"
              placeholder="Plan Title..."
              title="Click to rename plan"
            />
          )}
        </div>

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

        {/* Line Spacing (User Adjustable) */}
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
                { label: "1.15 (Compact)", value: "1.15" },
                { label: "1.5 (Standard)", value: "1.5" },
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
          {/* Table Picker Button */}
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

        {/* Template & Cloud Save Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {onManualSave && (
            <button
              type="button"
              onClick={onManualSave}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border/70 hover:border-violet-500/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              title="Save to database (Ctrl+S)"
            >
              <Cloud size={12} className="text-violet-400" />
              <span>Save</span>
            </button>
          )}

          <button
            type="button"
            onClick={resetToTemplate}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-border/70 hover:border-violet-500/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Load default trading plan template"
          >
            <Sparkles size={12} className="text-violet-400" />
            <span>Template</span>
          </button>
        </div>
      </header>

      {/* ─── CONTEXTUAL TABLE EDITING TOOLBAR (When inside a table) ─── */}
      {activeTable && (
        <div className="shrink-0 bg-violet-500/10 border-b border-violet-500/30 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs">
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
        <div className="shrink-0 bg-violet-600/15 border-b border-violet-500/40 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs animate-in fade-in">
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
            onClick={deleteSelectedImage}
            className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium cursor-pointer text-[11px] flex items-center gap-1 ml-auto"
          >
            <Trash2 size={11} /> Delete Image
          </button>
        </div>
      )}

      {/* ─── MICROSOFT WORD DOCUMENT CANVAS ─── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 overscroll-contain"
        onClick={handleEditorClick}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          style={{ lineHeight: lineSpacing }}
          className={cn(
            "mx-auto w-full max-w-[900px] min-h-[600px] focus:outline-hidden",
            "text-foreground font-sans text-sm",
            /* Typography styles with adjustable line-height */
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:leading-tight",
            "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:border-b [&_h2]:border-border/40 [&_h2]:pb-1 [&_h2]:leading-snug",
            "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-1.5 [&_h3]:leading-snug",
            "[&_p]:mb-3 [&_p]:leading-[inherit]",
            "[&_ul:not([data-type='taskList'])]:list-disc [&_ul:not([data-type='taskList'])]:pl-5 [&_ul:not([data-type='taskList'])]:mb-3",
            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3",
            "[&_li]:leading-[inherit] [&_li]:mb-1",
            "[&_hr]:my-5 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border/60",
            /* Tables */
            "[&_table]:w-full [&_table]:border-collapse [&_table]:my-3",
            "[&_th]:border [&_th]:border-border/70 [&_th]:bg-muted/40 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-xs [&_th]:leading-[inherit]",
            "[&_td]:border [&_td]:border-border/70 [&_td]:p-2.5 [&_td]:text-xs [&_td]:leading-[inherit]",
            /* Images */
            "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:transition-all [&_img:hover]:ring-2 [&_img:hover]:ring-violet-500/50"
          )}
        />
      </div>

      {/* ─── MICROSOFT WORD STATUS STRIP (Bottom) ─── */}
      <footer className="shrink-0 border-t border-border/70 bg-card/90 px-4 py-1.5 flex items-center justify-between text-[11px] text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          <span>Page 1 of 1</span>
          <span>•</span>
          <span className="font-mono">{wordCount} words</span>
          <span>•</span>
          <span className="font-mono">{charCount} characters</span>
        </div>
        <div className="flex items-center gap-2.5">
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
              <Loader2 size={11} className="animate-spin" />
              Saving to database...
            </span>
          ) : saveStatus === "error" ? (
            <span className="flex items-center gap-1 font-mono text-[10px] text-amber-400">
              <AlertTriangle size={11} />
              Saved locally (offline)
            </span>
          ) : (
            <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
              <Check size={11} />
              Saved to database
            </span>
          )}
          <span>•</span>
          <span>100% Zoom</span>
        </div>
      </footer>
    </div>
  );
}

