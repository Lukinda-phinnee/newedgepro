"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useUserPreferences } from "@/components/user-preferences-provider";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemePreference() {
  const { preferences, changeTheme } = useUserPreferences();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return <fieldset className="grid grid-cols-3 gap-2" aria-label="Color theme">
    {options.map(({ value, label, icon: Icon }) => {
      const selected = mounted && preferences.theme === value;
      return <button key={value} type="button" aria-pressed={selected} onClick={() => { void changeTheme(value); }} disabled={!mounted}
        className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition-colors duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default ${selected ? "border-primary/60 bg-primary/10 text-primary" : "border-border/70 bg-background/50 text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
        <Icon size={16} aria-hidden="true"/><span>{label}</span>
      </button>;
    })}
  </fieldset>;
}
