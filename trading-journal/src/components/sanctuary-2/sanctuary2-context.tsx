"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  CompletedSessionRecord,
  EmotionalFeeling,
  MeditationSessionDef,
  MentalReadinessCheckin,
  RoutineItem,
  Sanctuary2Settings,
} from "./sanctuary2-types";
import { DEFAULT_ROUTINE_ITEMS, MEDITATION_SESSIONS } from "./sanctuary2-data";

interface Sanctuary2ContextValue {
  // Stats
  todayCompletedMinutes: number;
  dailyTargetMinutes: number;
  streakDays: number;
  // State collections
  routineItems: RoutineItem[];
  sessionHistory: CompletedSessionRecord[];
  readinessCheckins: MentalReadinessCheckin[];
  settings: Sanctuary2Settings;
  // Active Player & Modals
  activeSession: MeditationSessionDef | null;
  activeDurationMinutes: number;
  isPlayerOpen: boolean;
  isCompletionOpen: boolean;
  lastCompletedRecord: Partial<CompletedSessionRecord> | null;
  // Actions
  startMeditation: (sessionOrId: MeditationSessionDef | string, durationMinutes?: number) => void;
  closePlayer: () => void;
  openCompletionModal: (completedData: Partial<CompletedSessionRecord>) => void;
  closeCompletionModal: () => void;
  saveCompletedSession: (data: {
    afterFeeling: CompletedSessionRecord["afterFeeling"];
    afterIntensity: number;
    reflectionNotes?: string;
  }) => void;
  saveReadinessCheckin: (feelings: EmotionalFeeling[], intensity: number) => void;
  toggleRoutineItem: (id: string) => void;
  updateRoutineDuration: (id: string, duration: number) => void;
  updateSettings: (newSettings: Partial<Sanctuary2Settings>) => void;
  resetAllData: () => void;
}

const Sanctuary2Context = createContext<Sanctuary2ContextValue | null>(null);

const STORAGE_KEY = "edgepro_sanctuary2_state_v1";

const INITIAL_SETTINGS: Sanctuary2Settings = {
  dailyTargetMinutes: 20,
  defaultAmbientSound: "rain",
  defaultVolume: 0.6,
  voiceNarrationEnabled: true,
  voiceSpeed: 0.95,
  vibrateHaptics: true,
};

// Seed realistic sample history for rich instant comparison
const SEED_HISTORY: CompletedSessionRecord[] = [
  {
    id: "hist-1",
    sessionId: "focused-attention",
    sessionTitle: "Focused-Attention Meditation",
    technique: "focused-attention",
    durationMinutes: 10,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: "2 days ago",
    beforeFeelings: ["Anxious", "Impatient"],
    beforeIntensity: 8,
    afterFeeling: "Focused",
    afterIntensity: 3,
    reflectionNotes: "Noticed heavy urge to jump into EURUSD before NY open. Breath brought heart rate back down.",
  },
  {
    id: "hist-2",
    sessionId: "mindfulness",
    sessionTitle: "Mindfulness Meditation",
    technique: "mindfulness",
    durationMinutes: 5,
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    completedAt: "Yesterday",
    beforeFeelings: ["Frustrated"],
    beforeIntensity: 7,
    afterFeeling: "Calm",
    afterIntensity: 2,
    reflectionNotes: "A stop out on GBPJPY made me feel like revenge trading. Stepped away and centered.",
  },
  {
    id: "hist-3",
    sessionId: "body-scan",
    sessionTitle: "Body Scan Meditation",
    technique: "body-scan",
    durationMinutes: 5,
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: "Today 08:30 AM",
    beforeFeelings: ["Tired"],
    beforeIntensity: 6,
    afterFeeling: "Relaxed",
    afterIntensity: 2,
    reflectionNotes: "Released tight jaw and shoulders after market closed.",
  },
];

const SEED_CHECKINS: MentalReadinessCheckin[] = [
  {
    id: "chk-1",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    feelings: ["Anxious", "Impatient"],
    intensity: 8,
  },
  {
    id: "chk-2",
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    feelings: ["Frustrated"],
    intensity: 7,
  },
  {
    id: "chk-3",
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    feelings: ["Focused", "Calm"],
    intensity: 3,
  },
];

export function Sanctuary2Provider({ children }: { children: React.ReactNode }) {
  const [todayCompletedMinutes, setTodayCompletedMinutes] = useState(15);
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(20);
  const [streakDays, setStreakDays] = useState(7);
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>(DEFAULT_ROUTINE_ITEMS);
  const [sessionHistory, setSessionHistory] = useState<CompletedSessionRecord[]>(SEED_HISTORY);
  const [readinessCheckins, setReadinessCheckins] = useState<MentalReadinessCheckin[]>(SEED_CHECKINS);
  const [settings, setSettings] = useState<Sanctuary2Settings>(INITIAL_SETTINGS);

  // Player / Modal State
  const [activeSession, setActiveSession] = useState<MeditationSessionDef | null>(null);
  const [activeDurationMinutes, setActiveDurationMinutes] = useState(10);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [lastCompletedRecord, setLastCompletedRecord] = useState<Partial<CompletedSessionRecord> | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.todayCompletedMinutes === "number") setTodayCompletedMinutes(parsed.todayCompletedMinutes);
        if (typeof parsed.dailyTargetMinutes === "number") setDailyTargetMinutes(parsed.dailyTargetMinutes);
        if (typeof parsed.streakDays === "number") setStreakDays(parsed.streakDays);
        if (Array.isArray(parsed.routineItems)) setRoutineItems(parsed.routineItems);
        if (Array.isArray(parsed.sessionHistory)) setSessionHistory(parsed.sessionHistory);
        if (Array.isArray(parsed.readinessCheckins)) setReadinessCheckins(parsed.readinessCheckins);
        if (parsed.settings) setSettings(parsed.settings);
      }
    } catch (e) {
      console.warn("Failed to parse sanctuary 2 state", e);
    }
  }, []);

  // Save to localStorage when state updates
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          todayCompletedMinutes,
          dailyTargetMinutes,
          streakDays,
          routineItems,
          sessionHistory,
          readinessCheckins,
          settings,
        })
      );
    } catch {}
  }, [
    todayCompletedMinutes,
    dailyTargetMinutes,
    streakDays,
    routineItems,
    sessionHistory,
    readinessCheckins,
    settings,
  ]);

  const startMeditation = useCallback((sessionOrId: MeditationSessionDef | string, durationMinutes?: number) => {
    const session =
      typeof sessionOrId === "string"
        ? MEDITATION_SESSIONS.find((s) => s.id === sessionOrId) ?? MEDITATION_SESSIONS[0]
        : sessionOrId;
    setActiveSession(session);
    setActiveDurationMinutes(durationMinutes ?? session.defaultDurationMinutes);
    setIsPlayerOpen(true);
  }, []);

  const closePlayer = useCallback(() => {
    setIsPlayerOpen(false);
  }, []);

  const openCompletionModal = useCallback((completedData: Partial<CompletedSessionRecord>) => {
    setIsPlayerOpen(false);
    setLastCompletedRecord(completedData);
    setIsCompletionOpen(true);
  }, []);

  const closeCompletionModal = useCallback(() => {
    setIsCompletionOpen(false);
    setLastCompletedRecord(null);
  }, []);

  const saveCompletedSession = useCallback(
    ({
      afterFeeling,
      afterIntensity,
      reflectionNotes,
    }: {
      afterFeeling: CompletedSessionRecord["afterFeeling"];
      afterIntensity: number;
      reflectionNotes?: string;
    }) => {
      if (!lastCompletedRecord || !activeSession) {
        closeCompletionModal();
        return;
      }

      const latestCheckin = readinessCheckins[0];
      const newRecord: CompletedSessionRecord = {
        id: "sess-" + Date.now(),
        sessionId: activeSession.id,
        sessionTitle: activeSession.title,
        technique: activeSession.technique,
        durationMinutes: lastCompletedRecord.durationMinutes ?? activeDurationMinutes,
        timestamp: new Date().toISOString(),
        completedAt: "Just now",
        beforeFeelings: latestCheckin?.feelings ?? ["Anxious"],
        beforeIntensity: latestCheckin?.intensity ?? 6,
        afterFeeling,
        afterIntensity,
        reflectionNotes: reflectionNotes?.trim() || undefined,
      };

      setSessionHistory((prev) => [newRecord, ...prev]);
      setTodayCompletedMinutes((prev) => prev + newRecord.durationMinutes);
      closeCompletionModal();
    },
    [lastCompletedRecord, activeSession, activeDurationMinutes, readinessCheckins, closeCompletionModal]
  );

  const saveReadinessCheckin = useCallback((feelings: EmotionalFeeling[], intensity: number) => {
    const checkin: MentalReadinessCheckin = {
      id: "chk-" + Date.now(),
      timestamp: new Date().toISOString(),
      feelings,
      intensity,
    };
    setReadinessCheckins((prev) => [checkin, ...prev.slice(0, 20)]);
  }, []);

  const toggleRoutineItem = useCallback((id: string) => {
    setRoutineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  }, []);

  const updateRoutineDuration = useCallback((id: string, duration: number) => {
    setRoutineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, durationMinutes: duration } : item))
    );
  }, []);

  const updateSettings = useCallback((newSettings: Partial<Sanctuary2Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const resetAllData = useCallback(() => {
    setTodayCompletedMinutes(0);
    setDailyTargetMinutes(20);
    setStreakDays(1);
    setRoutineItems(DEFAULT_ROUTINE_ITEMS);
    setSessionHistory([]);
    setReadinessCheckins([]);
    setSettings(INITIAL_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <Sanctuary2Context.Provider
      value={{
        todayCompletedMinutes,
        dailyTargetMinutes,
        streakDays,
        routineItems,
        sessionHistory,
        readinessCheckins,
        settings,
        activeSession,
        activeDurationMinutes,
        isPlayerOpen,
        isCompletionOpen,
        lastCompletedRecord,
        startMeditation,
        closePlayer,
        openCompletionModal,
        closeCompletionModal,
        saveCompletedSession,
        saveReadinessCheckin,
        toggleRoutineItem,
        updateRoutineDuration,
        updateSettings,
        resetAllData,
      }}
    >
      {children}
    </Sanctuary2Context.Provider>
  );
}

export function useSanctuary2() {
  const context = useContext(Sanctuary2Context);
  if (!context) {
    throw new Error("useSanctuary2 must be used within a Sanctuary2Provider");
  }
  return context;
}

