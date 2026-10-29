"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useOperationFeedback } from "@/components/ui/operation-feedback";
import type { UserPreferences } from "@/lib/db/profile";

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  updatePreferences: (changes: Partial<UserPreferences>) => void;
  changeTheme: (theme: UserPreferences["theme"]) => Promise<void>;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children, initialPreferences }: { children: React.ReactNode; initialPreferences: UserPreferences }) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const { setTheme } = useTheme();
  const { showFeedback } = useOperationFeedback();
  const appliedInitialTheme = useRef(false);

  useEffect(() => {
    if (appliedInitialTheme.current) return;
    appliedInitialTheme.current = true;
    setTheme(initialPreferences.theme);
  }, [initialPreferences.theme, setTheme]);

  const updatePreferences = useCallback((changes: Partial<UserPreferences>) => {
    setPreferences((current) => ({ ...current, ...changes }));
  }, []);

  const changeTheme = useCallback(async (theme: UserPreferences["theme"]) => {
    const previousTheme = preferences.theme;
    setTheme(theme);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn’t save your appearance preference.");
      setPreferences((current) => ({ ...current, theme }));
    } catch (error) {
      setTheme(previousTheme);
      showFeedback({ kind: "failure", title: "Appearance preference wasn’t saved", description: error instanceof Error ? error.message : "Please try again." });
    }
  }, [preferences.theme, setTheme, showFeedback]);

  return <UserPreferencesContext.Provider value={{ preferences, updatePreferences, changeTheme }}>{children}</UserPreferencesContext.Provider>;
}

export function useUserPreferences() {
  const value = useContext(UserPreferencesContext);
  if (!value) throw new Error("useUserPreferences must be used inside UserPreferencesProvider");
  return value;
}
