export type RoutineAction = "news" | "edge" | "sanctuary" | "trading" | "none" | "plan" | "rules" | "review";
export type RoutineIcon = "calendar" | "plan" | "meditation" | "charts" | "custom";

export type RoutineStep = {
  id: string;
  icon: RoutineIcon;
  title: string;
  action: RoutineAction;
};

export type Routine = {
  enabled: boolean;
  showOnAllPages: boolean;
  startSessionPrompt: boolean;
  autoHideOnComplete: boolean;
  resetTime: string;
  steps: RoutineStep[];
};

export type RoutinePhase = "premarket" | "intraday" | "postmarket";

export type RoutineCompletionRecord = {
  id: string;
  user_id: string;
  date: string;
  routine_type: string;
  completed_steps: string[];
  all_completed: boolean;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
};

export const ROUTINE_PHASE_CONFIG: Record<RoutinePhase, { label: string; shortLabel: string; description: string; badgeColor: string }> = {
  premarket: {
    label: "Pre-Market Routine",
    shortLabel: "Pre-Market",
    description: "Prepare mentally and technically before your active trading window begins.",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  intraday: {
    label: "During-Market Routine",
    shortLabel: "During Market",
    description: "Maintain execution discipline and risk control while your trading window is active.",
    badgeColor: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  },
  postmarket: {
    label: "After-Market Routine",
    shortLabel: "After Market",
    description: "Review trades, audit rule compliance, and decompress after market close.",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
};

export const DEFAULT_PRE_MARKET_ROUTINE: Routine = {
  enabled: true,
  showOnAllPages: true,
  startSessionPrompt: true,
  autoHideOnComplete: true,
  resetTime: "00:00",
  steps: [
    { id: "calendar", icon: "calendar", title: "Review Economic Calendar & News Events", action: "news" },
    { id: "plan", icon: "plan", title: "Review Daily Trading Plan & Playbook Setup", action: "plan" },
    { id: "meditation", icon: "meditation", title: "5-Min Mental Centering & Breathing", action: "sanctuary" },
    { id: "charts", icon: "charts", title: "Analyze Key Levels & Market Context", action: "trading" },
  ],
};

export const DEFAULT_DURING_MARKET_ROUTINE: Routine = {
  enabled: true,
  showOnAllPages: true,
  startSessionPrompt: true,
  autoHideOnComplete: false,
  resetTime: "00:00",
  steps: [
    { id: "risk_check", icon: "custom", title: "Verify Defined Stop Loss & Max Risk per Setup", action: "rules" },
    { id: "emotional_state", icon: "meditation", title: "Composure Check: No FOMO, Revenge, or Impatience", action: "sanctuary" },
    { id: "session_limits", icon: "plan", title: "Respect Session Trade Quota & Daily Loss Cap", action: "rules" },
  ],
};

export const DEFAULT_POST_MARKET_ROUTINE: Routine = {
  enabled: true,
  showOnAllPages: true,
  startSessionPrompt: true,
  autoHideOnComplete: true,
  resetTime: "00:00",
  steps: [
    { id: "cancel_orders", icon: "custom", title: "Cancel Any Unfilled Orders & Verify Flat Position", action: "trading" },
    { id: "audit_trades", icon: "plan", title: "Review & Grade Today's Executions in Trade Log", action: "trading" },
    { id: "log_mistakes", icon: "charts", title: "Tag Process Mistakes & Lessons Learned", action: "review" },
    { id: "disconnect", icon: "meditation", title: "Cool-down & Disconnect from Charts", action: "sanctuary" },
  ],
};

export const ACTION_LINKS: Record<RoutineAction, string> = {
  news: "/sanctuary",
  edge: "/edge",
  sanctuary: "/sanctuary",
  trading: "/trade-log",
  plan: "/plan",
  rules: "/rule-engine",
  review: "/trade-review",
  none: "",
};

/**
 * Determine the active routine phase based on current time in the user's timezone
 * and their configured trading window / killzone.
 */
export function getCurrentRoutinePhase(
  userTimezone: string = "Europe/Paris",
  windowStart: string = "09:30",
  windowEnd: string = "16:00"
): RoutinePhase {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: userTimezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "12", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    const currentMins = hour * 60 + minute;

    const [startH, startM] = windowStart.split(":").map(Number);
    const [endH, endM] = windowEnd.split(":").map(Number);
    const startMins = (isNaN(startH) ? 9 : startH) * 60 + (isNaN(startM) ? 30 : startM);
    const endMins = (isNaN(endH) ? 16 : endH) * 60 + (isNaN(endM) ? 0 : endM);

    if (currentMins < startMins) return "premarket";
    if (currentMins <= endMins) return "intraday";
    return "postmarket";
  } catch {
    return "premarket";
  }
}
