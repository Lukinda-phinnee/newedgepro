"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { phoneCountryCodes } from "@/lib/phone-country-codes";

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
const countries = phoneCountryCodes.map(({ region, callingCode }) => ({
  region,
  callingCode: `+${callingCode}`,
  name: displayNames.of(region) || region,
})).sort((a, b) => a.name.localeCompare(b.name));

export function CountryCodePicker({ value, regionCode, onChange, disabled = false }: { value: string; regionCode: string; onChange: (region: string, callingCode: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = countries.find((country) => country.region === regionCode) ?? countries.find((country) => country.callingCode === value) ?? countries[0];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return countries;
    return countries.filter(({ name, region, callingCode }) => `${name} ${region} ${callingCode}`.toLocaleLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  return <div className="relative min-w-0" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
    <button ref={triggerRef} type="button" disabled={disabled} aria-label="Choose country calling code" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}
      className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
      <span className="truncate">{selected.name} <span className="text-muted-foreground">({selected.callingCode})</span></span><ChevronsUpDown size={14} className="shrink-0 text-muted-foreground" aria-hidden="true"/>
    </button>
    {open && <div className="absolute left-0 top-[calc(100%+6px)] z-50 w-[min(340px,calc(100vw-3rem))] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 border-b border-border px-3"><Search size={15} className="shrink-0 text-muted-foreground" aria-hidden="true"/><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); } }} placeholder="Search country or calling code" aria-label="Search countries" className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"/></div>
      <div role="listbox" aria-label="Countries and calling codes" className="max-h-64 overflow-y-auto p-1.5">
        {filtered.length ? filtered.map((country) => <button key={country.region} type="button" role="option" aria-selected={country.region === selected.region} onClick={() => { onChange(country.region, country.callingCode); setOpen(false); setQuery(""); triggerRef.current?.focus(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none hover:bg-accent focus-visible:bg-accent">
          <span className="min-w-0 flex-1 truncate">{country.name}<span className="ml-1.5 text-xs text-muted-foreground">{country.region}</span></span><span className="text-xs text-muted-foreground">{country.callingCode}</span>{country.region === selected.region && <Check size={14} className="text-primary" aria-hidden="true"/>}
        </button>) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">No matching country</p>}
      </div>
      <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">{filtered.length} countries and territories</p>
    </div>}
  </div>;
}
