"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CalendarDays,
  ChevronRight,
  Clock,
  Lock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Trade } from "@/types/trade";
import type { Strategy } from "@/types/strategy";
import type { TradingAccount } from "@/types/account";
import type { RuleEngineStatus, RuleEngineCompliance } from "@/types/rules";
import { cn } from "@/lib/utils";
import { buildMonthCalendar, DAYS_OF_WEEK, formatDateKey } from "@/lib/trade-calendar";

// Apple §4: Spring configs
const springCard = { type: "spring" as const, damping: 26, stiffness: 260 };
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springCard },
};

function formatTradeTime(isoStr?: string | null): string {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

function getInstrumentType(symbol: string): string {
  const s = (symbol || "").toUpperCase();
  if (/^(NQ|ES|YM|RTY|CL|GC|SI|ZB|ZN|ZF|MNQ|MES|MYM|M2K)/.test(s)) return "Futures";
  if (/^(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD){2}/.test(s) || s.includes("/")) return "Forex";
  if (/^(BTC|ETH|SOL|BNB|XRP|DOGE|ADA|AVAX)/.test(s) || s.endsWith("USDT")) return "Crypto";
  if (/^(SPY|QQQ|IWM|DIA|XLF|XLE)/.test(s)) return "ETF";
  return "Equity";
}

// ─── 1. Portfolio Area Chart Component (Larger, Right-Aligned) ───
function PortfolioAreaChart({
  points,
  isPositive,
  width = 136,
  height = 56,
}: {
  points: { label: string; balance: number }[];
  isPositive: boolean;
  width?: number;
  height?: number;
}) {
  const padTop = 6;
  const padBottom = 4;
  const padX = 4;

  const balances = points.map((p) => p.balance);
  const minBal = Math.min(...balances);
  const maxBal = Math.max(...balances);
  const range = maxBal - minBal === 0 ? 1 : maxBal - minBal;

  const svgPoints = points.map((p, i) => {
    const x = padX + (i / Math.max(1, points.length - 1)) * (width - padX * 2);
    const y =
      height -
      padBottom -
      ((p.balance - minBal) / range) * (height - padTop - padBottom);
    return { x, y, balance: p.balance, label: p.label };
  });

  // Catmull-Rom smooth cubic spline
  const lineD = useMemo(() => {
    if (svgPoints.length === 0) return "";
    if (svgPoints.length === 1) return `M ${svgPoints[0].x} ${svgPoints[0].y}`;
    let d = `M ${svgPoints[0].x.toFixed(1)} ${svgPoints[0].y.toFixed(1)}`;
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const p0 = svgPoints[i === 0 ? 0 : i - 1];
      const p1 = svgPoints[i];
      const p2 = svgPoints[i + 1];
      const p3 = svgPoints[i + 2 < svgPoints.length ? i + 2 : i + 1];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }, [svgPoints]);

  const lastPt = svgPoints[svgPoints.length - 1] ?? {
    x: width - padX,
    y: height / 2,
  };
  const firstPt = svgPoints[0] ?? { x: padX, y: height / 2 };
  const areaD = `${lineD} L ${lastPt.x.toFixed(1)} ${height} L ${firstPt.x.toFixed(1)} ${height} Z`;

  const color = isPositive ? "#10b981" : "#f43f5e";
  const gradId = isPositive ? "areaGradGreen" : "areaGradRed";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full overflow-visible"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="85%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {/* Area Fill */}
      <motion.path
        d={areaD}
        fill={`url(#${gradId})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      {/* Top Stroke */}
      <motion.path
        d={lineD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      {/* Glowing end point */}
      <circle
        cx={lastPt.x}
        cy={lastPt.y}
        r="6"
        fill={color}
        fillOpacity="0.25"
        className="animate-pulse"
      />
      <circle cx={lastPt.x} cy={lastPt.y} r="3" fill={color}>
        <title>{`Latest: $${lastPt.balance.toLocaleString()}`}</title>
      </circle>
    </svg>
  );
}

// ─── 2. Win Rate Pie Chart Component (Increased Size: 68px) ───
function WinRatePieChart({
  wins,
  losses,
  breakevens,
  size = 68,
}: {
  wins: number;
  losses: number;
  breakevens: number;
  size?: number;
}) {
  const total = wins + losses + breakevens;
  const radius = size / 2 - 2;
  const center = size / 2;

  if (total === 0) {
    return (
      <div
        className="relative inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-muted/20 dark:text-white/[0.08]"
            strokeWidth="3.5"
            strokeDasharray="4 3"
          />
        </svg>
        <span className="absolute text-[11px] text-muted-foreground/60 font-medium">
          0T
        </span>
      </div>
    );
  }

  const slices = [
    { label: "Wins", count: wins, color: "#10b981", percent: (wins / total) * 100 },
    { label: "Losses", count: losses, color: "#f43f5e", percent: (losses / total) * 100 },
    {
      label: "Breakeven",
      count: breakevens,
      color: "#818cf8",
      percent: (breakevens / total) * 100,
    },
  ].filter((s) => s.count > 0);

  if (slices.length === 1) {
    return (
      <div
        className="relative inline-flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="drop-shadow-sm"
        >
          <circle cx={center} cy={center} r={radius} fill={slices[0].color}>
            <title>{`${slices[0].label}: ${slices[0].count} (100%)`}</title>
          </circle>
        </svg>
      </div>
    );
  }

  let currentAngle = -Math.PI / 2;
  const paths = slices.map((s) => {
    const sliceAngle = (s.count / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    return {
      d: `M ${center} ${center} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`,
      color: s.color,
      label: s.label,
      count: s.count,
      percent: s.percent.toFixed(1),
    };
  });

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-sm overflow-visible"
      >
        {paths.map((p, idx) => (
          <path
            key={idx}
            d={p.d}
            fill={p.color}
            stroke="hsl(var(--card))"
            strokeWidth="1.75"
            className="transition-opacity hover:opacity-85"
          >
            <title>{`${p.label}: ${p.count} (${p.percent}%)`}</title>
          </path>
        ))}
      </svg>
    </div>
  );
}

// ─── 3. Discipline Doughnut Chart Component (Increased Size: 68px) ───
function DisciplineDoughnutChart({
  score,
  gradeLetter,
  gradeColor,
  size = 68,
}: {
  score: number;
  gradeLetter: string;
  gradeColor: string;
  size?: number;
}) {
  const strokeWidth = 6.5;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const colorHex =
    score >= 88 ? "#10b981" : score >= 68 ? "#f59e0b" : "#f43f5e";

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20 dark:text-white/[0.08]"
          strokeWidth={strokeWidth}
        />
        {/* Active Arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colorHex}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ type: "spring", damping: 22, stiffness: 180, delay: 0.2 }}
        >
          <title>{`Discipline Score: ${score}/100`}</title>
        </motion.circle>
      </svg>
      {/* Center Grade Letter */}
      <span className={cn("absolute text-[15px] font-extrabold tracking-tight", gradeColor)}>
        {gradeLetter}
      </span>
    </div>
  );
}

// ─── 4. Rule & Risk Status Radial Gauge Component (Increased Size: 92x54) ───
function RiskStatusGaugeChart({
  escalation,
  isLocked,
  isCooldown,
  tradesWithViolations,
  totalClosed,
  size = { width: 92, height: 54 },
}: {
  escalation: string;
  isLocked: boolean;
  isCooldown: boolean;
  tradesWithViolations: number;
  totalClosed: number;
  size?: { width: number; height: number };
}) {
  const cx = size.width / 2;
  const cy = size.height - 4;
  const radius = 36;

  // Compute risk index 0 to 100
  let riskPercent = 15;
  if (isLocked) {
    riskPercent = 95;
  } else if (escalation === "Severe") {
    riskPercent = 85;
  } else if (escalation === "Elevated" || isCooldown) {
    riskPercent = 60;
  } else if (totalClosed > 0) {
    const violationRatio = tradesWithViolations / totalClosed;
    riskPercent = Math.min(45, Math.max(10, Math.round(violationRatio * 80)));
  }

  // Pointer position along 180-degree semi-circle
  const angle = Math.PI - (riskPercent / 100) * Math.PI;
  const pointerX = cx + radius * Math.cos(angle);
  const pointerY = cy - radius * Math.sin(angle);

  const pointerColor =
    riskPercent >= 75 ? "#f43f5e" : riskPercent >= 45 ? "#f59e0b" : "#10b981";

  const arcD = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  return (
    <div
      className="relative inline-flex flex-col items-center justify-end shrink-0"
      style={{ width: size.width, height: size.height }}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="riskGaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>
        </defs>

        {/* Track with gradient */}
        <path
          d={arcD}
          fill="none"
          stroke="url(#riskGaugeGrad)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />

        {/* Pointer dot */}
        <motion.circle
          cx={pointerX}
          cy={pointerY}
          r="5.5"
          fill={pointerColor}
          stroke="hsl(var(--card))"
          strokeWidth="2"
          initial={{ cx, cy: cy - radius }}
          animate={{ cx: pointerX, cy: pointerY }}
          transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.25 }}
        >
          <title>{`Risk Index: ${riskPercent}% (${escalation})`}</title>
        </motion.circle>
        {/* Pointer glow */}
        <circle
          cx={pointerX}
          cy={pointerY}
          r="9"
          fill={pointerColor}
          fillOpacity="0.25"
          className="animate-pulse"
        />
      </svg>
      {/* Bottom Arc Label */}
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75 -mt-0.5">
        {riskPercent >= 75 ? "Danger" : riskPercent >= 45 ? "Caution" : "Safe"}
      </span>
    </div>
  );
}

// ─── Main Dashboard View ───
interface DashboardViewProps {
  trades: Trade[];
  strategies: Strategy[];
  account: TradingAccount | null;
  ruleStatus: RuleEngineStatus | null;
  ruleCompliance: RuleEngineCompliance | null;
}

export function DashboardView({
  trades,
  strategies,
  account,
  ruleStatus,
  ruleCompliance,
}: DashboardViewProps) {
  const [activityView, setActivityView] = useState<"weekly" | "monthly">("weekly");
  const [selectedTradingYear, setSelectedTradingYear] = useState<number | null>(null);
  const today = new Date();
  const todayKey = formatDateKey(today);

  // ─── Compute Portfolio Value ───
  const portfolioMetrics = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === "closed");
    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const startingBalance = account?.startingBalance ?? 0;
    const currentBalance = account?.currentBalance ?? startingBalance + totalPnl;
    const pnlPercent =
      startingBalance > 0
        ? ((currentBalance - startingBalance) / startingBalance) * 100
        : 0;

    return {
      currentBalance,
      totalPnl,
      pnlPercent,
      isPositive: totalPnl >= 0,
    };
  }, [trades, account]);

  // ─── Equity Curve for Portfolio Area Chart ───
  const equityPoints = useMemo(() => {
    const closedTrades = [...trades]
      .filter((t) => t.status === "closed")
      .sort(
        (a, b) =>
          new Date(a.closedAt || a.openedAt).getTime() -
          new Date(b.closedAt || b.openedAt).getTime(),
      );

    const startingBalance =
      account?.startingBalance ??
      (portfolioMetrics.currentBalance > 0
        ? portfolioMetrics.currentBalance * 0.9
        : 10000);

    if (closedTrades.length === 0) {
      const curr = portfolioMetrics.currentBalance || startingBalance;
      const diff = curr - startingBalance;
      return [
        { label: "Start", balance: startingBalance },
        { label: "T1", balance: startingBalance + diff * 0.2 },
        { label: "T2", balance: startingBalance + diff * 0.45 },
        { label: "T3", balance: startingBalance + diff * 0.75 },
        { label: "Current", balance: curr },
      ];
    }

    let running = startingBalance;
    const points = [{ label: "Start", balance: running }];
    const step = closedTrades.length > 20 ? Math.ceil(closedTrades.length / 20) : 1;
    for (let i = 0; i < closedTrades.length; i += step) {
      const t = closedTrades[i];
      running += t.pnl || 0;
      points.push({ label: `T${i + 1}`, balance: running });
    }
    const finalExpected = startingBalance + portfolioMetrics.totalPnl;
    if (points[points.length - 1].balance !== finalExpected) {
      points.push({ label: "Now", balance: finalExpected });
    }
    return points;
  }, [trades, account, portfolioMetrics.currentBalance, portfolioMetrics.totalPnl]);

  // ─── Compute Win Rate ───
  const winRateMetrics = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === "closed");
    const totalClosed = closedTrades.length;
    const wins = closedTrades.filter((t) => t.pnl > 0).length;
    const losses = closedTrades.filter((t) => t.pnl < 0).length;
    const breakevens = closedTrades.filter((t) => t.pnl === 0).length;
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

    // Compare with strategy target win rate (best strategy edge)
    const bestStrategy = strategies.find((s) => s.status === "ACTIVE");
    const targetWinRate = bestStrategy?.winRateTarget ?? null;
    const vsTarget =
      targetWinRate !== null ? winRate - targetWinRate : null;

    return {
      winRate,
      wins,
      losses,
      breakevens,
      totalClosed,
      targetWinRate,
      vsTarget,
      isAboveTarget: vsTarget !== null ? vsTarget >= 0 : true,
    };
  }, [trades, strategies]);

  // ─── Compute Discipline Score ───
  const disciplineMetrics = useMemo(() => {
    const score = ruleStatus?.disciplineScore ?? ruleCompliance?.disciplineScore ?? 0;
    const passRate = ruleCompliance?.passRate ?? 100;
    const violationsToday = ruleCompliance?.violationsToday ?? 0;
    const violationsThisWeek = ruleCompliance?.violationsThisWeek ?? 0;

    // Match trades with rule-following data
    const closedTrades = trades.filter((t) => t.status === "closed");
    const tradesWithRules = closedTrades.filter((t) => t.followedRules);
    const followedYes = tradesWithRules.filter((t) => t.followedRules === "yes").length;
    const followedPartial = tradesWithRules.filter((t) => t.followedRules === "partial").length;
    const followedNo = tradesWithRules.filter((t) => t.followedRules === "no").length;
    const adherenceRate =
      tradesWithRules.length > 0
        ? ((followedYes + followedPartial * 0.5) / tradesWithRules.length) * 100
        : 100;

    let grade: { letter: string; label: string; color: string };
    if (score >= 95) grade = { letter: "A+", label: "Elite Discipline", color: "text-emerald-400" };
    else if (score >= 88) grade = { letter: "A", label: "Strong Adherence", color: "text-emerald-300" };
    else if (score >= 78) grade = { letter: "B", label: "Acceptable", color: "text-amber-300" };
    else if (score >= 68) grade = { letter: "C", label: "Needs Work", color: "text-orange-400" };
    else grade = { letter: "F", label: "Breakdown", color: "text-rose-400" };

    return {
      score,
      passRate,
      violationsToday,
      violationsThisWeek,
      adherenceRate,
      followedYes,
      followedPartial,
      followedNo,
      grade,
    };
  }, [trades, ruleStatus, ruleCompliance]);

  // ─── Compute Rule & Risk Status ───
  const riskMetrics = useMemo(() => {
    const totalActiveRules = ruleStatus?.totalActiveRules ?? 0;
    const escalation = ruleStatus?.escalationLevel ?? "Normal";
    const isLocked = ruleStatus?.isLocked ?? false;
    const isCooldown = ruleStatus?.isCooldown ?? false;
    const lockRemaining = ruleStatus?.lockRemainingMinutes;
    const cooldownRemaining = ruleStatus?.cooldownRemainingMinutes;

    // Count rule categories with active rules
    const categories = ruleStatus?.activeRulesByCategory ?? {
      Risk: 0,
      Frequency: 0,
      Eligibility: 0,
      Recovery: 0,
      Discipline: 0,
      Checklist: 0,
    };
    const activeCategoryCount = Object.values(categories).filter((c) => c > 0).length;

    // Compute violations breakdown from trades
    const closedTrades = trades.filter((t) => t.status === "closed");
    const tradesWithViolations = closedTrades.filter(
      (t) => t.ruleVerdict === "WARN" || t.ruleVerdict === "BLOCK",
    ).length;
    const cleanTrades = closedTrades.filter(
      (t) => t.ruleVerdict === "ACCEPT" || !t.ruleVerdict,
    ).length;

    let statusColor: string;
    let statusLabel: string;
    let StatusIcon: typeof ShieldCheck;
    if (isLocked) {
      statusColor = "text-rose-400";
      statusLabel = "Account Locked";
      StatusIcon = Lock;
    } else if (escalation === "Severe") {
      statusColor = "text-rose-400";
      statusLabel = "Severe";
      StatusIcon = ShieldAlert;
    } else if (escalation === "Elevated" || isCooldown) {
      statusColor = "text-amber-400";
      statusLabel = "Elevated";
      StatusIcon = AlertTriangle;
    } else {
      statusColor = "text-emerald-400";
      statusLabel = "Normal";
      StatusIcon = ShieldCheck;
    }

    return {
      totalActiveRules,
      escalation,
      isLocked,
      isCooldown,
      lockRemaining,
      cooldownRemaining,
      activeCategoryCount,
      tradesWithViolations,
      cleanTrades,
      statusColor,
      statusLabel,
      StatusIcon,
    };
  }, [trades, ruleStatus]);

  const analytics = useMemo(() => {
    const closed = trades.filter((trade) => trade.status === "closed");
    const wins = closed.filter((trade) => trade.pnl > 0).length;
    const violations = closed.filter((trade) => trade.ruleVerdict === "WARN" || trade.ruleVerdict === "BLOCK").length;
    const withTiming = closed.filter((trade) => Boolean(trade.marketSession)).length;
    const radar = [
      { label: "Adherence", value: Math.round(disciplineMetrics.adherenceRate) },
      { label: "Risk control", value: closed.length ? Math.round((1 - violations / closed.length) * 100) : 100 },
      { label: "Outcome", value: closed.length ? Math.round((wins / closed.length) * 100) : 0 },
      { label: "Discipline", value: Math.round(disciplineMetrics.score) },
      { label: "Timing", value: closed.length ? Math.round((withTiming / closed.length) * 100) : 0 },
    ];
    const assets = new Map<string, { pnl: number; count: number; wins: number }>();
    closed.forEach((trade) => {
      const current = assets.get(trade.symbol) ?? { pnl: 0, count: 0, wins: 0 };
      current.pnl += trade.pnl;
      current.count += 1;
      if (trade.pnl > 0) current.wins += 1;
      assets.set(trade.symbol, current);
    });
    const bestAsset = [...assets.entries()].sort((a, b) => b[1].pnl - a[1].pnl)[0];
    const recent = [...closed].sort((a, b) => new Date(b.closedAt || b.openedAt).getTime() - new Date(a.closedAt || a.openedAt).getTime());
    let lossStreak = 0;
    for (const trade of recent) {
      if (trade.pnl >= 0) break;
      lossStreak += 1;
    }
    const risk = Math.min(100, Math.round(violations / Math.max(1, closed.length) * 65 + lossStreak * 12 + (riskMetrics.isLocked ? 35 : 0)));
    return { radar, bestAsset, lossStreak, risk, closedCount: closed.length };
  }, [trades, disciplineMetrics, riskMetrics.isLocked]);

  // ─── Formatters ───
  const fmtCurrency = (val: number) => {
    const abs = Math.abs(val);
    const formatted =
      abs >= 1_000_000
        ? `$${(abs / 1_000_000).toFixed(2)}M`
        : abs >= 1_000
          ? `$${(abs / 1_000).toFixed(abs >= 10_000 ? 1 : 2)}K`
          : `$${abs.toFixed(2)}`;
    return val < 0 ? `-${formatted}` : formatted;
  };

  const fmtPercent = (val: number) => `${val >= 0 ? "+" : ""}${val.toFixed(1)}%`;

  // ─── Recent 5 Trades for Compact Table ───
  const recentTrades = useMemo(() => {
    return [...trades]
      .sort(
        (a, b) =>
          new Date(b.closedAt || b.openedAt || b.createdAt).getTime() -
          new Date(a.closedAt || a.openedAt || a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [trades]);

  const activityMonth = useMemo(
    () => buildMonthCalendar(trades, today.getFullYear(), today.getMonth()),
    [trades, today.getFullYear(), today.getMonth()],
  );
  const activityWeek = activityMonth.weeks.find((week) =>
    week.days.some((day) => day.date === todayKey),
  ) ?? activityMonth.weeks[0];
  const activityDays = activityView === "weekly"
    ? activityWeek?.days ?? []
    : activityMonth.weeks.flatMap((week) => week.days);
  const activityPnl = activityView === "weekly"
    ? activityDays.reduce((sum, day) => sum + day.totalPnl, 0)
    : activityMonth.totalPnl;
  const activityTradeCount = activityView === "weekly"
    ? activityDays.reduce((sum, day) => sum + day.tradeCount, 0)
    : activityMonth.totalTrades;
  const activityWins = activityView === "weekly"
    ? activityDays.reduce((sum, day) => sum + day.wins, 0)
    : activityMonth.winningTrades;
  const activityLosses = activityView === "weekly"
    ? activityDays.reduce((sum, day) => sum + day.losses, 0)
    : activityMonth.losingTrades;
  const activityProfitDays = activityDays.filter((day) => day.isCurrentMonth && day.totalPnl > 0).length;
  const activityLossDays = activityDays.filter((day) => day.isCurrentMonth && day.totalPnl < 0).length;
  const daysInPeriod = activityView === "weekly"
    ? 7
    : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const progressInPeriod = activityView === "weekly"
    ? ((today.getDay() + 6) % 7 + (today.getHours() * 60 + today.getMinutes()) / 1440) / 7
    : (today.getDate() - 1 + (today.getHours() * 60 + today.getMinutes()) / 1440) / daysInPeriod;
  const calendarWeeks = activityView === "weekly"
    ? (activityWeek ? [activityWeek] : [])
    : activityMonth.weeks;
  const periodLabel = activityView === "weekly"
    ? activityWeek
      ? `${new Date(`${activityWeek.startDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(`${activityWeek.endDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : "This week"
    : `${activityMonth.monthName} ${activityMonth.year}`;
  const tradingYears = useMemo(() => [...new Set(trades
    .map((trade) => Number(trade.openedAt.slice(0, 4)))
    .filter((year) => Number.isFinite(year) && year > 0))].sort((a, b) => b - a), [trades]);
  const activeTradingYear = selectedTradingYear !== null && tradingYears.includes(selectedTradingYear)
    ? selectedTradingYear
    : tradingYears[0];
  const annualMonths = useMemo(() => {
    const months = Array.from({ length: 12 }, () => ({ pnl: 0, trades: 0, wins: 0, losses: 0 }));
    if (activeTradingYear !== undefined) {
      trades.forEach((trade) => {
        const year = Number(trade.openedAt.slice(0, 4));
        if (year !== activeTradingYear) return;
        const month = months[Number(trade.openedAt.slice(5, 7)) - 1];
        if (!month) return;
        month.pnl += trade.pnl || 0;
        month.trades += 1;
        if (trade.pnl > 0) month.wins += 1;
        if (trade.pnl < 0) month.losses += 1;
      });
    }
    return months;
  }, [trades, activeTradingYear]);
  const annualPnl = annualMonths.reduce((sum, month) => sum + month.pnl, 0);
  const annualTradeCount = annualMonths.reduce((sum, month) => sum + month.trades, 0);

  return (
    <div className="w-full space-y-5">
      {/* ─── Metric Cards Row ─── */}
      <motion.div
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* ── 1. Portfolio Value (Area Chart on Right End Side) ── */}
        <motion.article
          variants={cardVariant}
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-sm press-scale-sm cursor-default"
        >
          {/* Subtle gradient accent */}
          <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-violet-500/[0.06] blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />

          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/10">
                <Wallet size={14} className="text-violet-400" />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                Portfolio Value
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none">
                  {fmtCurrency(portfolioMetrics.currentBalance)}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                      portfolioMetrics.isPositive
                        ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-500 dark:text-rose-400",
                    )}
                  >
                    {portfolioMetrics.isPositive ? (
                      <ArrowUpRight size={11} />
                    ) : (
                      <ArrowDownRight size={11} />
                    )}
                    {fmtPercent(portfolioMetrics.pnlPercent)}
                  </span>
                </div>
              </div>

              {/* Area Chart on the right end side */}
              <div className="w-28 sm:w-32 h-14 shrink-0">
                <PortfolioAreaChart
                  points={equityPoints}
                  isPositive={portfolioMetrics.isPositive}
                  width={136}
                  height={56}
                />
              </div>
            </div>
          </div>

          {/* Bottom border row */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/80 border-t border-border/40 pt-2.5">
            <span>
              Net P&L{" "}
              <span
                className={cn(
                  "font-medium",
                  portfolioMetrics.isPositive
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400",
                )}
              >
                {portfolioMetrics.isPositive ? "+" : ""}
                {fmtCurrency(portfolioMetrics.totalPnl)}
              </span>
            </span>
            <span className="ml-auto text-muted-foreground/60 text-[10px]">
              {equityPoints.length > 1
                ? `${equityPoints.length - 1} trades`
                : "Baseline"}
            </span>
          </div>
        </motion.article>

        {/* ── 2. Win Rate (Pie Chart on Right End Side) ── */}
        <motion.article
          variants={cardVariant}
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-sm press-scale-sm cursor-default"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-emerald-500/[0.06] blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />

          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp size={14} className="text-emerald-400" />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                Win Rate
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[26px] font-semibold tracking-tight text-foreground leading-none">
                    {winRateMetrics.winRate.toFixed(1)}%
                  </span>
                </div>
                {winRateMetrics.targetWinRate !== null && (
                  <div
                    className={cn(
                      "mt-1 text-[11px] font-medium",
                      winRateMetrics.isAboveTarget
                        ? "text-emerald-500 dark:text-emerald-400"
                        : "text-rose-500 dark:text-rose-400",
                    )}
                  >
                    {winRateMetrics.isAboveTarget ? "↑" : "↓"}{" "}
                    {Math.abs(winRateMetrics.vsTarget!).toFixed(1)}% vs target
                  </div>
                )}
              </div>

              {/* Pie Chart (Size: 68px) */}
              <WinRatePieChart
                wins={winRateMetrics.wins}
                losses={winRateMetrics.losses}
                breakevens={winRateMetrics.breakevens}
                size={68}
              />
            </div>
          </div>

          {/* Slices legend */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground/80 border-t border-border/40 pt-2.5">
            <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {winRateMetrics.wins}W
            </span>
            <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-medium">
              <span className="size-1.5 rounded-full bg-rose-500" />
              {winRateMetrics.losses}L
            </span>
            {winRateMetrics.breakevens > 0 && (
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
                <span className="size-1.5 rounded-full bg-indigo-400" />
                {winRateMetrics.breakevens}BE
              </span>
            )}
            <span className="ml-auto text-muted-foreground/60">
              {winRateMetrics.totalClosed} trades
            </span>
          </div>
        </motion.article>

        {/* ── 3. Discipline Score (Doughnut Chart on Right End Side) ── */}
        <motion.article
          variants={cardVariant}
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-sm press-scale-sm cursor-default"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-amber-500/[0.06] blur-2xl transition-opacity group-hover:opacity-100 opacity-60" />

          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10">
                <Activity size={14} className="text-amber-400" />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                Discipline Score
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[26px] font-semibold tracking-tight text-foreground leading-none">
                    {disciplineMetrics.score}
                  </span>
                  <span className="text-[13px] text-muted-foreground/60 font-medium">/ 100</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground/80">
                  Pass rate{" "}
                  <span className="font-medium text-foreground/80">
                    {disciplineMetrics.passRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Doughnut Chart (Size: 68px) */}
              <DisciplineDoughnutChart
                score={disciplineMetrics.score}
                gradeLetter={disciplineMetrics.grade.letter}
                gradeColor={disciplineMetrics.grade.color}
                size={68}
              />
            </div>
          </div>

          {/* Violations details */}
          <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground/80 border-t border-border/40 pt-2.5">
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide",
                disciplineMetrics.grade.color,
                "bg-white/[0.04]",
              )}
            >
              {disciplineMetrics.grade.label}
            </span>
            {disciplineMetrics.violationsToday > 0 ? (
              <span className="text-amber-500 dark:text-amber-400 font-medium ml-auto">
                {disciplineMetrics.violationsToday} today
              </span>
            ) : (
              <span className="text-emerald-500 dark:text-emerald-400 font-medium ml-auto">
                0 violations today
              </span>
            )}
          </div>
        </motion.article>

        {/* ── 4. Rule & Risk Status (Radial Gauge on Right End Side) ── */}
        <motion.article
          variants={cardVariant}
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-sm press-scale-sm cursor-default"
        >
          <div
            className={cn(
              "pointer-events-none absolute -top-12 -right-12 size-32 rounded-full blur-2xl transition-opacity group-hover:opacity-100 opacity-60",
              riskMetrics.isLocked || riskMetrics.escalation === "Severe"
                ? "bg-rose-500/[0.06]"
                : riskMetrics.escalation === "Elevated"
                  ? "bg-amber-500/[0.06]"
                  : "bg-emerald-500/[0.06]",
            )}
          />

          <div>
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-lg",
                  riskMetrics.isLocked || riskMetrics.escalation === "Severe"
                    ? "bg-rose-500/10"
                    : riskMetrics.escalation === "Elevated"
                      ? "bg-amber-500/10"
                      : "bg-emerald-500/10",
                )}
              >
                <riskMetrics.StatusIcon size={14} className={riskMetrics.statusColor} />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                Rule & Risk Status
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <span
                  className={cn(
                    "text-[22px] font-semibold tracking-tight leading-none",
                    riskMetrics.statusColor,
                  )}
                >
                  {riskMetrics.statusLabel}
                </span>
                <div className="mt-1 text-[11px] text-muted-foreground/80">
                  {riskMetrics.totalActiveRules} rules · {riskMetrics.activeCategoryCount} cats
                </div>
              </div>

              {/* Radial Risk Gauge Chart (Size: 92x54) */}
              <RiskStatusGaugeChart
                escalation={riskMetrics.escalation}
                isLocked={riskMetrics.isLocked}
                isCooldown={riskMetrics.isCooldown}
                tradesWithViolations={riskMetrics.tradesWithViolations}
                totalClosed={winRateMetrics.totalClosed}
                size={{ width: 92, height: 54 }}
              />
            </div>
          </div>

          {/* Status / lockout footer */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/80 border-t border-border/40 pt-2.5">
            {riskMetrics.isLocked ? (
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <Lock size={11} />
                Locked · {riskMetrics.lockRemaining}m left
              </span>
            ) : riskMetrics.isCooldown ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                <AlertTriangle size={11} />
                Cooldown · {riskMetrics.cooldownRemaining}m left
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-medium">
                <CheckCircle2 size={11} />
                {riskMetrics.cleanTrades} clean / {riskMetrics.cleanTrades + riskMetrics.tradesWithViolations} trades
              </span>
            )}
          </div>
        </motion.article>
      </motion.div>

      {/* ─── Second Row: 2 Columns (40% / 60%) ─── */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
        {/* Left Column: 40% (2 of 5 cols) - Compact Recent Trades Table (Last 10) */}
        <motion.div
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          className="lg:col-span-2 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-card/60">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-violet-500/10">
                <Clock size={13} className="text-violet-400" />
              </span>
              <div>
                <h3 className="text-xs font-semibold tracking-wide text-foreground uppercase">
                  Recent Trades
                </h3>
              </div>
            </div>
            <Link
              href="/trade-log"
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              View log
              <ChevronRight size={12} />
            </Link>
          </div>

          {/* Compact Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <th className="py-2 pl-4 pr-2">Instrument</th>
                  <th className="py-2 px-2">Direction</th>
                  <th className="py-2 px-2 text-center">Result</th>
                  <th className="py-2 px-2 text-right">P/L</th>
                  <th className="py-2 px-2 text-center">Type</th>
                  <th className="py-2 pl-2 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentTrades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-xs text-muted-foreground"
                    >
                      No trades recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentTrades.map((t) => {
                    const isPositive = t.pnl > 0;
                    const isNegative = t.pnl < 0;
                    const isOpen = t.status === "open";
                    const instrumentType = getInstrumentType(t.symbol);

                    return (
                      <tr
                        key={t.id}
                        className="transition-colors hover:bg-muted/30 cursor-default"
                      >
                        {/* 1. INSTRUMENT */}
                        <td className="py-2 pl-4 pr-2 whitespace-nowrap">
                          <span className="font-normal text-foreground text-[10px]">
                            {t.symbol}
                          </span>
                        </td>

                        {/* 2. DIRECTION */}
                        <td className="py-2 px-2 whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] font-normal",
                              t.side === "long"
                                ? "text-emerald-500 dark:text-emerald-400"
                                : "text-rose-500 dark:text-rose-400",
                            )}
                          >
                            {t.side === "long" ? (
                              <ArrowUpRight size={12} />
                            ) : (
                              <ArrowDownRight size={12} />
                            )}
                            {t.side === "long" ? "Long" : "Short"}
                          </span>
                        </td>

                        {/* 3. RESULT */}
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          {isOpen ? (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-normal uppercase bg-amber-500/10 text-amber-400">
                              Open
                            </span>
                          ) : isPositive ? (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-normal uppercase bg-emerald-500/10 text-emerald-400">
                              Win
                            </span>
                          ) : isNegative ? (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-normal uppercase bg-rose-500/10 text-rose-400">
                              Loss
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-normal uppercase bg-indigo-500/10 text-indigo-400">
                              BE
                            </span>
                          )}
                        </td>

                        {/* 4. P/L */}
                        <td className="py-2 px-2 text-right whitespace-nowrap text-[10px] font-normal">
                          <span
                            className={
                              isPositive
                                ? "text-emerald-500 dark:text-emerald-400"
                                : isNegative
                                  ? "text-rose-500 dark:text-rose-400"
                                  : "text-muted-foreground"
                            }
                          >
                            {isPositive ? "+" : ""}
                            ${t.pnl.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </td>

                        {/* 5. TYPE */}
                        <td className="py-2 px-2 text-center whitespace-nowrap">
                          <span className="inline-flex items-center rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                            {instrumentType}
                          </span>
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-2 pl-2 pr-4 text-right whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-normal capitalize",
                              isOpen
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-muted/60 text-muted-foreground/80",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                isOpen
                                  ? "bg-blue-400 animate-pulse"
                                  : "bg-muted-foreground/50",
                              )}
                            />
                            {t.status || "Closed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right Column: 60% (3 of 5 cols) - Container ready for next section */}
        <motion.div
          variants={cardVariant}
          initial="hidden"
          animate="visible"
          className="lg:col-span-3 flex h-full min-h-[250px] flex-col overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-md bg-violet-500/10">
                <Activity size={13} className="text-violet-400" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                Performance & Analytics
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              {analytics.closedCount} closed trades
            </span>
          </div>

          <div className="grid flex-1 grid-cols-1 divide-y divide-border/60 md:grid-cols-2 md:divide-y-0 md:divide-x xl:grid-cols-3">
            <section className="min-w-0 py-4 md:px-4 md:first:pl-0 md:last:pr-0" aria-label="Behavioral radar">
              <h3 className="text-[11px] font-semibold tracking-wide text-foreground">BEHAVIORAL RADAR</h3>
              <div className="mt-2 flex justify-center">
                <svg viewBox="0 0 220 190" className="h-[172px] w-full max-w-[250px]" role="img" aria-label={`Radar: ${analytics.radar.map((item) => `${item.label} ${item.value}%`).join(", ")}`}>
                  <g transform="translate(110 92)">
                    {[25, 50, 75, 100].map((level) => <polygon key={level} points={analytics.radar.map((_, i) => { const angle = -Math.PI / 2 + (i * 2 * Math.PI) / analytics.radar.length; return `${Math.cos(angle) * 72 * level / 100},${Math.sin(angle) * 72 * level / 100}`; }).join(" ")} fill="none" stroke="currentColor" strokeOpacity="0.12" />)}
                    {analytics.radar.map((item, i) => { const angle = -Math.PI / 2 + (i * 2 * Math.PI) / analytics.radar.length; return <line key={item.label} x1="0" y1="0" x2={Math.cos(angle) * 72} y2={Math.sin(angle) * 72} stroke="currentColor" strokeOpacity="0.14" />; })}
                    <motion.polygon points={analytics.radar.map((item, i) => { const angle = -Math.PI / 2 + (i * 2 * Math.PI) / analytics.radar.length; return `${Math.cos(angle) * 72 * item.value / 100},${Math.sin(angle) * 72 * item.value / 100}`; }).join(" ")} fill="rgb(139 92 246 / 0.2)" stroke="#8b5cf6" strokeWidth="2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }} />
                  </g>
                  {analytics.radar.map((item, i) => { const angle = -Math.PI / 2 + (i * 2 * Math.PI) / analytics.radar.length; const x = 110 + Math.cos(angle) * 88; const y = 92 + Math.sin(angle) * 88; return <text key={item.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize="9">{item.label}</text>; })}
                </svg>
              </div>
            </section>

            <section className="min-w-0 py-4 md:px-4 md:first:pl-0 md:last:pr-0" aria-label="Risk runway and analysis">
              <h3 className="text-[11px] font-semibold tracking-wide text-foreground">RISK RUNWAY &amp; ANALYSIS</h3>
              <div className="mt-5 flex items-end justify-between gap-2">
                <div><p className="text-3xl font-semibold tracking-tight">{100 - analytics.risk}<span className="text-base text-muted-foreground">/100</span></p><p className="mt-1 text-[10px] text-muted-foreground">Risk runway</p></div>
                <span className={cn("mb-1 rounded-full px-2 py-1 text-[10px] font-medium", analytics.risk >= 65 ? "bg-rose-500/10 text-rose-500" : analytics.risk >= 35 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500")}>{analytics.risk >= 65 ? "Elevated" : analytics.risk >= 35 ? "Watch" : "Steady"}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><motion.div className={cn("h-full rounded-full", analytics.risk >= 65 ? "bg-rose-500" : analytics.risk >= 35 ? "bg-amber-500" : "bg-emerald-500")} initial={{ width: 0 }} animate={{ width: `${100 - analytics.risk}%` }} transition={{ type: "spring", damping: 24, stiffness: 140 }} /></div>
            </section>

            <section className="min-w-0 py-4 md:px-4 md:first:pl-0 md:last:pr-0" aria-label="Asset intelligence">
              <h3 className="text-[11px] font-semibold tracking-wide text-foreground">ASSET INTELLIGENCE</h3>
              {analytics.bestAsset ? <>
                <div className="mt-4 flex justify-center">
                  <svg viewBox="0 0 160 160" className="h-44 w-44" role="img" aria-label={`${analytics.bestAsset[0]} is the most profitable pair, with ${fmtCurrency(analytics.bestAsset[1].pnl)} net across ${analytics.bestAsset[1].count} trades`}>
                    <circle cx="80" cy="80" r="58" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="13" />
                    <motion.circle cx="80" cy="80" r="58" fill="none" stroke={analytics.bestAsset[1].pnl >= 0 ? "#8b5cf6" : "#f43f5e"} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 58}`} strokeDashoffset={2 * Math.PI * 58 * (1 - analytics.bestAsset[1].wins / analytics.bestAsset[1].count)} transform="rotate(-90 80 80)" initial={{ strokeDashoffset: 2 * Math.PI * 58 }} animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - analytics.bestAsset[1].wins / analytics.bestAsset[1].count) }} transition={{ type: "spring", damping: 24, stiffness: 120 }} />
                    <text x="80" y="75" textAnchor="middle" className="fill-foreground" fontSize="13" fontWeight="600">{analytics.bestAsset[0]}</text>
                    <text x="80" y="94" textAnchor="middle" className="fill-muted-foreground" fontSize="10">TOP PAIR</text>
                  </svg>
                </div>
              </> : <div className="flex min-h-[190px] flex-col items-center justify-center text-center"><TrendingUp size={20} className="text-muted-foreground/50" /><p className="mt-2 text-xs font-medium">Waiting for trade history</p><p className="mt-1 max-w-[200px] text-[10px] text-muted-foreground">Close trades on an instrument to reveal your strongest performer.</p></div>}
            </section>
          </div>
        </motion.div>
      </div>

      {/* ─── Third Row: Trading Activity Calendar + Period Summary ─── */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-5">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm lg:col-span-3" aria-label="Trading activities calendar">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card/60 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-violet-500/10"><CalendarDays size={13} className="text-violet-400" /></span>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">Trading Activities</h2>
              </div>
              <div className="inline-flex rounded-lg border border-border/70 bg-muted/40 p-0.5" role="group" aria-label="Calendar view">
                {(["weekly", "monthly"] as const).map((view) => <button key={view} type="button" aria-pressed={activityView === view} onClick={() => setActivityView(view)} className={cn("rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition-colors", activityView === view ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{view}</button>)}
              </div>
            </div>
            <div className={cn("relative isolate overflow-hidden rounded-full border px-3 py-1.5 text-[10px] font-semibold tabular-nums", activityPnl >= 0 ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "border-rose-500/30 bg-rose-500/15 text-rose-700 dark:text-rose-300")} aria-label={`${periodLabel}, ${Math.round(progressInPeriod * 100)}% through period, ${fmtCurrency(activityPnl)} profit and loss`}>
              <motion.span aria-hidden="true" className={cn("absolute inset-y-0 left-0 z-0", activityPnl >= 0 ? "bg-emerald-500/45" : "bg-rose-500/45")} initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, progressInPeriod * 100))}%` }} transition={{ duration: 0.45, ease: "easeOut" }} />
              <span className="relative z-10">{periodLabel} <span className="opacity-80">·</span> {activityPnl >= 0 ? "+" : "−"}{fmtCurrency(Math.abs(activityPnl))}</span>
            </div>
          </header>
          <div className="overflow-x-auto p-3">
            <div className={cn("space-y-2", activityView === "monthly" ? "min-w-[760px]" : "min-w-[620px]")}>
              <div className={cn("grid gap-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground", activityView === "monthly" ? "grid-cols-[repeat(7,minmax(0,1fr))_104px]" : "grid-cols-7")}>
                {DAYS_OF_WEEK.map((day) => <div key={day} className="rounded-md bg-secondary/40 py-2 text-center">{day}</div>)}
                {activityView === "monthly" && <div className="rounded-md bg-secondary/60 py-2 text-center font-bold text-foreground">Week P/L</div>}
              </div>
              <div className="space-y-2">
                {calendarWeeks.map((week) => {
                  const weekDays = week.days;
                  const includedDays = weekDays.filter((day) => activityView === "weekly" || day.isCurrentMonth);
                  const weekPnl = includedDays.reduce((sum, day) => sum + day.totalPnl, 0);
                  const weekTrades = includedDays.reduce((sum, day) => sum + day.tradeCount, 0);
                  const weekWins = includedDays.reduce((sum, day) => sum + day.wins, 0);
                  const weekLosses = includedDays.reduce((sum, day) => sum + day.losses, 0);
                  return <div key={week.startDate} className={cn("grid gap-2", activityView === "monthly" ? "grid-cols-[repeat(7,minmax(0,1fr))_104px]" : "grid-cols-7")}>
                    {weekDays.map((day) => {
                      const visible = activityView === "weekly" || day.isCurrentMonth;
                      const hasTrades = visible && day.tradeCount > 0;
                      const positive = day.totalPnl > 0;
                      const negative = day.totalPnl < 0;
                      return <div key={day.date} className={cn("group flex min-h-[94px] flex-col justify-between rounded-lg border p-2 transition-colors sm:min-h-[104px]", !visible ? "border-border/20 bg-secondary/5 opacity-20" : hasTrades ? positive ? "border-emerald-500/30 bg-emerald-500/[0.08] dark:bg-emerald-950/20 hover:border-emerald-500/50" : negative ? "border-rose-500/30 bg-rose-500/[0.08] dark:bg-rose-950/20 hover:border-rose-500/50" : "border-border/70 bg-card" : "border-border/50 bg-card/60 hover:bg-secondary/30", day.isToday && "ring-2 ring-blue-500/60 ring-offset-1 ring-offset-background")}>
                        <div className="flex items-center justify-between gap-1"><span className={cn("flex size-5 items-center justify-center rounded text-[10px] font-semibold", day.isToday ? "bg-blue-600 text-white" : "text-muted-foreground")}>{day.dayOfMonth}</span>{hasTrades && <span className={cn("rounded-full px-1 py-0.5 text-[8px] font-bold", positive ? "bg-emerald-500/20 text-emerald-400" : negative ? "bg-rose-500/20 text-rose-400" : "bg-secondary text-muted-foreground")}>{day.tradeCount}T</span>}</div>
                        <div className="my-auto">{hasTrades ? <><div className={cn("truncate text-xs font-bold tabular-nums", positive ? "text-emerald-400" : negative ? "text-rose-400" : "text-foreground/80")}>{positive ? "+" : negative ? "−" : ""}{fmtCurrency(Math.abs(day.totalPnl))}</div><div className="mt-0.5 text-[9px] text-muted-foreground">{day.wins}W · {day.losses}L</div></> : <span className="text-[10px] text-muted-foreground/30">—</span>}</div>
                        <div className="flex flex-wrap gap-1">{hasTrades && Array.from(new Set(day.trades.map((trade) => trade.symbol))).slice(0, 2).map((symbol) => <span key={symbol} className="max-w-full truncate rounded border border-border/60 bg-background/60 px-1 py-0.5 text-[8px] font-medium text-foreground/75">{symbol}</span>)}</div>
                      </div>;
                    })}
                    {activityView === "monthly" && <div className={cn("flex flex-col justify-between rounded-lg border p-2.5", weekTrades ? weekPnl > 0 ? "border-emerald-500/35 bg-emerald-500/[0.1] dark:bg-emerald-950/30" : weekPnl < 0 ? "border-rose-500/35 bg-rose-500/[0.1] dark:bg-rose-950/30" : "border-border/70 bg-secondary/40" : "border-border/50 bg-secondary/20")}>
                      <div><div className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{week.weekLabel}</div><div className={cn("mt-2 text-sm font-extrabold tabular-nums", weekPnl > 0 ? "text-emerald-400" : weekPnl < 0 ? "text-rose-400" : "text-muted-foreground")}>{weekPnl > 0 ? "+" : weekPnl < 0 ? "−" : ""}{fmtCurrency(Math.abs(weekPnl))}</div></div>
                      <div className="mt-2 border-t border-border/50 pt-2 text-[9px] text-muted-foreground"><div className="flex justify-between gap-1"><span>Trades</span><b className="text-foreground">{weekTrades}</b></div><div className="flex justify-between gap-1"><span>Record</span><b className="text-foreground">{weekWins}W · {weekLosses}L</b></div></div>
                    </div>}
                  </div>;
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col rounded-xl border border-border/80 bg-card p-4 shadow-sm lg:col-span-2" aria-label="Trading period summary">
          <div className="flex items-center justify-between border-b border-border/60 pb-3"><div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-md bg-emerald-500/10"><Activity size={13} className="text-emerald-400" /></span><h2 className="text-xs font-semibold uppercase tracking-wide">Period Summary</h2></div><span className="text-[10px] text-muted-foreground">{activityView === "weekly" ? "This week" : "This month"}</span></div>
          <div className="mb-3 mt-3 flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 px-2.5 py-2" aria-label="Heatmap legend: loss to profit">
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">Heatmap Legend</span>
            <span className="text-[9px] text-rose-400">Loss</span>
            <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-rose-500/80 via-muted to-emerald-500/80" aria-hidden="true" />
            <span className="text-[9px] text-emerald-400">Profit</span>
          </div>
          <div className="mt-4"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Net P&amp;L</p><p className={cn("mt-1 text-3xl font-semibold tracking-tight tabular-nums", activityPnl > 0 ? "text-emerald-400" : activityPnl < 0 ? "text-rose-400" : "text-foreground")}>{activityPnl > 0 ? "+" : activityPnl < 0 ? "−" : ""}{fmtCurrency(Math.abs(activityPnl))}</p></div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]"><div className="rounded-lg bg-muted/40 p-2.5"><p className="text-muted-foreground">Trades</p><p className="mt-1 font-semibold">{activityTradeCount}</p></div><div className="rounded-lg bg-muted/40 p-2.5"><p className="text-muted-foreground">Win rate</p><p className="mt-1 font-semibold">{activityTradeCount ? Math.round(activityWins / activityTradeCount * 100) : 0}%</p></div></div>
          <div className="mt-4 space-y-3 border-t border-border/50 pt-3 text-[11px]"><div className="flex items-center justify-between"><span className="text-muted-foreground">Record</span><b>{activityWins}W · {activityLosses}L</b></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Profitable days</span><b className="text-emerald-400">{activityProfitDays}</b></div><div className="flex items-center justify-between"><span className="text-muted-foreground">Losing days</span><b className="text-rose-400">{activityLossDays}</b></div></div>
          {activityView === "monthly" && <div className="mt-4 space-y-2 border-t border-border/50 pt-3"><h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Weekly P&amp;L</h3>{activityMonth.weeks.map((week) => { const pnl = week.days.filter((day) => day.isCurrentMonth).reduce((sum, day) => sum + day.totalPnl, 0); return <div key={week.startDate} className="flex justify-between gap-2 text-[10px]"><span className="text-muted-foreground">{week.weekLabel}</span><b className={pnl > 0 ? "text-emerald-400" : pnl < 0 ? "text-rose-400" : "text-foreground"}>{pnl > 0 ? "+" : pnl < 0 ? "−" : ""}{fmtCurrency(Math.abs(pnl))}</b></div>; })}</div>}
        </section>
      </div>

      {/* ─── Fourth Row: Trading Year At A Glance ─── */}
      <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm" aria-label="Trading year at a glance">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-card/60 px-4 py-2.5">
          <div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-md bg-violet-500/10"><TrendingUp size={13} className="text-violet-400" /></span><h2 className="text-xs font-semibold uppercase tracking-wide">Trading Year At A Glance</h2></div>
          <div className="flex items-center gap-3">
            {activeTradingYear !== undefined && <div className="hidden items-center gap-3 text-[10px] sm:flex"><span className="text-muted-foreground">{annualTradeCount} trades</span><b className={cn("tabular-nums", annualPnl > 0 ? "text-emerald-400" : annualPnl < 0 ? "text-rose-400" : "text-foreground")}>{annualPnl > 0 ? "+" : annualPnl < 0 ? "−" : ""}{fmtCurrency(Math.abs(annualPnl))}</b></div>}
            <label className="sr-only" htmlFor="trading-year-select">Select trading year</label>
            <select id="trading-year-select" value={activeTradingYear ?? ""} disabled={tradingYears.length === 0} onChange={(event) => setSelectedTradingYear(event.target.value ? Number(event.target.value) : null)} className="h-8 rounded-md border border-border/70 bg-background px-2.5 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:text-muted-foreground">
              {tradingYears.length === 0 ? <option value="">No years with trades</option> : tradingYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </header>
        {activeTradingYear === undefined ? <div className="flex min-h-[220px] flex-col items-center justify-center p-6 text-center"><CalendarDays size={22} className="text-muted-foreground/50" /><p className="mt-2 text-xs font-medium">No trading history yet</p><p className="mt-1 text-[10px] text-muted-foreground">Years will appear here once trades are recorded.</p></div> : <div className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3 sm:hidden"><span className="text-[10px] text-muted-foreground">{annualTradeCount} trades</span><b className={cn("text-xs tabular-nums", annualPnl > 0 ? "text-emerald-400" : annualPnl < 0 ? "text-rose-400" : "text-foreground")}>{annualPnl > 0 ? "+" : annualPnl < 0 ? "−" : ""}{fmtCurrency(Math.abs(annualPnl))}</b></div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {annualMonths.map((month, index) => {
              const positive = month.pnl > 0;
              const negative = month.pnl < 0;
              return <div key={`${activeTradingYear}-${index}`} className={cn("flex min-h-[112px] flex-col rounded-lg border px-2.5 py-2 transition-colors", positive ? "border-emerald-500/30 bg-emerald-500/[0.08] dark:bg-emerald-950/20 hover:border-emerald-500/50" : negative ? "border-rose-500/30 bg-rose-500/[0.08] dark:bg-rose-950/20 hover:border-rose-500/50" : "border-border/50 bg-background/30 hover:bg-muted/30")} aria-label={`${new Date(activeTradingYear, index, 1).toLocaleDateString("en-US", { month: "long" })}: ${month.trades} trades, ${month.pnl >= 0 ? "profit" : "loss"} ${fmtCurrency(Math.abs(month.pnl))}, ${month.wins} winning and ${month.losses} losing trades`}>
                <div className="text-center text-[10px] font-semibold text-foreground">{new Date(activeTradingYear, index, 1).toLocaleDateString("en-US", { month: "short" })}</div>
                <div className="mt-auto border-t border-border/50 pt-2">
                  <div className={cn("text-center text-[11px] font-semibold tabular-nums", positive ? "text-emerald-500" : negative ? "text-rose-500" : "text-foreground")}>{month.pnl > 0 ? "+" : month.pnl < 0 ? "−" : ""}{fmtCurrency(Math.abs(month.pnl))}</div>
                  <div className="mt-1 flex justify-between gap-1 text-[9px] tabular-nums text-muted-foreground"><span>{month.trades} {month.trades === 1 ? "trade" : "trades"}</span><span><b className="font-medium text-emerald-500">W {month.wins}</b> <b className="font-medium text-rose-500">L {month.losses}</b></span></div>
                </div>
              </div>;
            })}
            <aside className="flex min-h-[232px] flex-col rounded-lg border border-border/70 bg-muted/20 p-2 lg:col-start-7 lg:row-span-2 lg:row-start-1" aria-label={`Year summary for ${activeTradingYear}`}>
              <h3 className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Year Summary</h3>
              <div className="mt-2 text-center"><div className={cn("text-lg font-bold tabular-nums", annualPnl > 0 ? "text-emerald-500" : annualPnl < 0 ? "text-rose-500" : "text-foreground")}>{annualPnl > 0 ? "+" : annualPnl < 0 ? "−" : ""}{fmtCurrency(Math.abs(annualPnl))}</div><div className="text-[9px] text-muted-foreground">Net P&amp;L</div></div>
              <div className="mt-3 grid grid-cols-2 gap-x-1 border-y border-border/50 py-2 text-center"><div><div className="text-xs font-semibold tabular-nums">{annualTradeCount}</div><div className="text-[9px] text-muted-foreground">Trades</div></div><div><div className="text-xs font-semibold tabular-nums"><span className="text-emerald-500">{annualMonths.reduce((sum, month) => sum + month.wins, 0)}</span><span className="text-muted-foreground">/</span><span className="text-rose-500">{annualMonths.reduce((sum, month) => sum + month.losses, 0)}</span></div><div className="text-[9px] text-muted-foreground">Wins / Losses</div></div></div>
            </aside>
          </div>
        </div>}
      </section>
    </div>
  );
}
