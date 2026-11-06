"use client";

import { useState, useRef, useEffect } from "react";
import { Tag, Check, Plus, X, ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const PRESET_SESSIONS = [
  { id: "NY AM", label: "NY AM", desc: "8:30 AM – 11:30 AM EST (Open & Data)" },
  { id: "NY PM", label: "NY PM", desc: "1:30 PM – 4:00 PM EST (Afternoon / Close)" },
  { id: "London", label: "London", desc: "2:00 AM – 5:00 AM EST (Euro Open)" },
  { id: "Asia", label: "Asia", desc: "7:00 PM – 2:00 AM EST (Tokyo / Sydney)" },
  { id: "Pre-Market", label: "Pre-Market", desc: "Pre-market prep & levels" },
  { id: "Swing", label: "Swing", desc: "Multi-day / Macro thesis" },
];

interface SessionMultiSelectProps {
  value?: string;
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

export function SessionMultiSelect({
  value = "",
  onChange,
  disabled = false,
}: SessionMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse comma-separated tags
  const selectedTags = (value || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleTag = (tag: string) => {
    let nextTags: string[];
    if (selectedTags.includes(tag)) {
      nextTags = selectedTags.filter((t) => t !== tag);
    } else {
      nextTags = [...selectedTags, tag];
    }
    onChange(nextTags.join(", "));
  };

  const handleRemoveTag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    const nextTags = selectedTags.filter((t) => t !== tag);
    onChange(nextTags.join(", "));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!selectedTags.includes(trimmed)) {
      onChange([...selectedTags, trimmed].join(", "));
    }
    setCustomTagInput("");
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-7 px-2 text-xs font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 select-none",
          selectedTags.length > 0
            ? "border-violet-500/40 bg-violet-500/10 dark:bg-violet-500/20 text-violet-900 dark:text-violet-200 hover:bg-violet-500/15"
            : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
        title="Select market sessions (Optional)"
      >
        <Tag size={12} className={selectedTags.length > 0 ? "text-violet-500" : "text-muted-foreground/70"} />
        {selectedTags.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">Session (Optional)</span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="font-semibold text-[11px]">
              {selectedTags[0]}
            </span>
            {selectedTags.length > 1 && (
              <span className="px-1 py-0.2 rounded bg-violet-500/20 dark:bg-violet-500/30 text-[10px] font-mono">
                +{selectedTags.length - 1}
              </span>
            )}
          </div>
        )}
        <ChevronDown size={11} className={cn("transition-transform duration-150", isOpen && "rotate-180")} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-9 left-0 z-50 w-64 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-2.5 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-popover-foreground">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Clock size={13} className="text-violet-400" />
              <span>Market Sessions</span>
              <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
            </div>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[10px] text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Active Pills Summary */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2.5 pb-2 border-b border-border/40">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-violet-500/20 dark:bg-violet-500/30 text-violet-900 dark:text-violet-200 border border-violet-500/30"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(e, tag)}
                    className="hover:text-rose-500 cursor-pointer"
                    title={`Remove ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Preset Options Checklist */}
          <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
            {PRESET_SESSIONS.map((preset) => {
              const isChecked = selectedTags.includes(preset.id);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => toggleTag(preset.id)}
                  className={cn(
                    "w-full flex items-start gap-2 p-1.5 rounded-lg text-left transition-colors cursor-pointer select-none text-xs",
                    isChecked
                      ? "bg-violet-500/15 dark:bg-violet-500/25 text-violet-950 dark:text-white"
                      : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "size-3.5 mt-0.5 rounded flex items-center justify-center border shrink-0 transition-colors",
                      isChecked
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "border-border/80 bg-background"
                    )}
                  >
                    {isChecked && <Check size={10} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs leading-none">{preset.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {preset.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Tag Input */}
          <form onSubmit={handleAddCustomTag} className="mt-2.5 pt-2 border-t border-border/60 flex items-center gap-1.5">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              placeholder="Add custom session..."
              className="flex-1 h-6 px-2 text-[11px] rounded-md border border-border/60 bg-muted/40 text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-violet-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!customTagInput.trim()}
              className="h-6 px-2 rounded-md bg-violet-600 text-white text-[11px] font-medium disabled:opacity-40 hover:bg-violet-500 transition-colors flex items-center gap-0.5 cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus size={11} />
              <span>Add</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

