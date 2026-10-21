"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X, Check, Globe } from "lucide-react";
import { cn } from "cn";

export interface InstrumentItem {
  symbol: string;
  rawSymbol?: string;
  name: string;
  type: string;
  exchange: string;
}

interface InstrumentSearchSelectProps {
  id?: string;
  value: string;
  onChange: (symbol: string, meta?: InstrumentItem) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const TYPE_BADGE_STYLES: Record<string, string> = {
  Futures: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Forex: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Crypto: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Equity: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  ETF: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  Index: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
};

export function InstrumentSearchSelect({
  id = "trade-symbol",
  value,
  onChange,
  placeholder = "Search pair (e.g. NQ, EURUSD, AAPL, Gold)...",
  required = false,
  className,
}: InstrumentSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<InstrumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedMeta, setSelectedMeta] = useState<InstrumentItem | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync external value changes
  useEffect(() => {
    if (value !== query && !isOpen) {
      setQuery(value);
    }
  }, [value, isOpen]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // If query was modified without selecting, keep the typed query as the symbol
        if (query.trim() && query.trim().toUpperCase() !== value) {
          onChange(query.trim().toUpperCase());
        } else if (!query.trim()) {
          setQuery(value);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, value, onChange]);

  // Online search with debounce
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      // Fetch default popular suggestions when query is empty
      setLoading(true);
      fetch(`/api/instruments/search?q=NQ`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.instruments || []);
          setSelectedIndex(0);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/instruments/search?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((data) => {
          setResults(data.instruments || []);
          setSelectedIndex(0);
        })
        .catch(() => {
          setResults([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 220);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, results.length]);

  const handleSelect = (item: InstrumentItem) => {
    onChange(item.symbol, item);
    setSelectedMeta(item);
    setQuery(item.symbol);
    setIsOpen(false);
  };

  const handleSelectCustom = () => {
    const custom = query.trim().toUpperCase();
    if (!custom) return;
    onChange(custom);
    setSelectedMeta(null);
    setQuery(custom);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < results.length && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else {
        handleSelectCustom();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    onChange("");
    setSelectedMeta(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setIsOpen(true);
  };

  const trimmedQuery = query.trim().toUpperCase();
  const hasExactMatch = results.some((r) => r.symbol.toUpperCase() === trimmedQuery);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative flex items-center">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 text-muted-foreground/60"
        />

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          required={required}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-9 w-full min-w-0 rounded-lg border border-border/80 bg-background/50 pl-8 pr-16 text-xs uppercase font-medium text-foreground shadow-xs transition-colors",
            "placeholder:text-muted-foreground/50 placeholder:normal-case placeholder:font-normal",
            "hover:border-border",
            "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
            isOpen && "border-violet-500/60 ring-2 ring-violet-500/20"
          )}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {loading && (
            <Loader2 size={13} className="animate-spin text-violet-400" />
          )}

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded p-0.5 text-muted-foreground/60 transition hover:bg-white/10 hover:text-foreground"
              title="Clear instrument"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Selected meta subtitle preview */}
      {selectedMeta && !isOpen && (
        <div className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
          <span className="truncate max-w-[200px] text-foreground/80 font-medium">
            {selectedMeta.name}
          </span>
          {selectedMeta.type && (
            <span
              className={cn(
                "rounded border px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider",
                TYPE_BADGE_STYLES[selectedMeta.type] || "bg-secondary text-muted-foreground"
              )}
            >
              {selectedMeta.type}
            </span>
          )}
          {selectedMeta.exchange && (
            <span className="text-[10px] text-muted-foreground/60">
              • {selectedMeta.exchange}
            </span>
          )}
        </div>
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[300px] max-w-[420px] rounded-xl border border-border/90 bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
            <span className="flex items-center gap-1">
              <Globe size={11} className="text-violet-400" />
              Live Online Markets
            </span>
            {loading && (
              <span className="text-[10px] text-violet-400 font-normal lowercase">
                searching...
              </span>
            )}
          </div>

          <ul ref={listRef} className="max-h-56 overflow-y-auto py-1 space-y-0.5">
            {results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isCurrent = item.symbol.toUpperCase() === value.toUpperCase();
              const badgeClass =
                TYPE_BADGE_STYLES[item.type] ||
                "bg-secondary/60 text-muted-foreground border-border/60";

              return (
                <li
                  key={`${item.symbol}-${idx}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={cn(
                    "flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-xs cursor-pointer transition",
                    isSelected
                      ? "bg-violet-500/15 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    isCurrent && !isSelected && "bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold tracking-tight text-foreground text-xs uppercase">
                      {item.symbol}
                    </span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {item.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.type && (
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                          badgeClass
                        )}
                      >
                        {item.type}
                      </span>
                    )}
                    {item.exchange && (
                      <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                        {item.exchange}
                      </span>
                    )}
                    {isCurrent && (
                      <Check size={12} className="text-emerald-400 ml-0.5" />
                    )}
                  </div>
                </li>
              );
            })}

            {results.length === 0 && !loading && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No market symbols found for &quot;{query}&quot;
              </div>
            )}

            {/* Custom symbol entry option */}
            {trimmedQuery && !hasExactMatch && (
              <li
                onMouseEnter={() => setSelectedIndex(results.length)}
                onClick={handleSelectCustom}
                className={cn(
                  "border-t border-border/40 mt-1 pt-1.5 flex items-center justify-between rounded-lg px-2.5 py-2 text-xs cursor-pointer transition",
                  selectedIndex === results.length
                    ? "bg-violet-500/15 text-violet-300"
                    : "text-muted-foreground hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px]">Use custom ticker:</span>
                  <span className="font-bold text-foreground bg-white/10 px-1.5 py-0.5 rounded text-xs">
                    {trimmedQuery}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/60">
                  Custom
                </span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
