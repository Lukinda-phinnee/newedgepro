import "server-only";
import { sql } from "@/lib/db";
import type {
  CreateStrategyInput,
  Strategy,
  StrategyCategory,
  StrategyStatus,
  UpdateStrategyInput,
} from "@/types/strategy";

function mapStrategyRow(row: Record<string, unknown>): Strategy {
  const parseJson = <T>(val: unknown, fallback: T): T => {
    if (!val) return fallback;
    if (typeof val === "object") return val as T;
    if (typeof val === "string") {
      try {
        return JSON.parse(val) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  return {
    id: String(row.id),
    userId: String(row.user_id),
    accountId: row.account_id ? String(row.account_id) : null,
    name: String(row.name || "Untitled Strategy"),
    category: (row.category as StrategyCategory) || "Liquidity Sweep",
    version: String(row.version || "v1.0"),
    status: (row.status as StrategyStatus) || "ACTIVE",
    description: row.description ? String(row.description) : null,
    thesis: row.thesis ? String(row.thesis) : null,
    assetUniverse: parseJson<string[]>(row.asset_universe, ["NQ", "ES"]),
    marketRegime: String(row.market_regime || "Trending & High Volatility"),
    edgeScore: Number(row.edge_score) || 85,
    expectancyR: Number(row.expectancy_r) || 0.85,
    winRateTarget: Number(row.win_rate_target) || 60,
    profitFactor: Number(row.profit_factor) || 2.1,
    sampleSize: Number(row.sample_size) || 40,
    edgeStateNotes: row.edge_state_notes ? String(row.edge_state_notes) : null,
    maxRiskPercent: Number(row.max_risk_percent) || 1.0,
    minRrRatio: Number(row.min_rr_ratio) || 2.0,
    invalidationRule: row.invalidation_rule ? String(row.invalidation_rule) : null,
    stopLossLogic: row.stop_loss_logic ? String(row.stop_loss_logic) : null,
    killSwitchRule: row.kill_switch_rule ? String(row.kill_switch_rule) : null,
    tradingSessions: parseJson<string[]>(row.trading_sessions, ["London Open", "New York AM"]),
    killZoneStart: String(row.kill_zone_start || "09:30"),
    killZoneEnd: String(row.kill_zone_end || "11:30"),
    timeZone: String(row.time_zone || "EST (UTC-5)"),
    daysOfWeek: parseJson<string[]>(row.days_of_week, ["Tuesday", "Wednesday", "Thursday"]),
    newsBlackoutRule: row.news_blackout_rule ? String(row.news_blackout_rule) : null,
    entryChecklist: parseJson(row.entry_checklist, []),
    disqualifiers: parseJson(row.disqualifiers, []),
    exitStrategy: parseJson(row.exit_strategy, {
      tp1Ratio: 1.5,
      tp1Percent: 50,
      tp2Ratio: 3.0,
      tp2Percent: 35,
      runnerRule: "Trail 15m structure pivot",
      breakevenRule: "Move to BE after TP1 hit",
      timeStopMinutes: 45,
    }),
    refinements: parseJson(row.refinements, []),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

const DEFAULT_STRATEGIES: CreateStrategyInput[] = [
  {
    accountId: null,
    name: "London Liquidity Sweep & Displacement",
    category: "Liquidity Sweep",
    version: "v1.2",
    status: "ACTIVE",
    description: "Exploits liquidity pool raids of the Asian session high or low during the London Open, followed by a confirmed 5m displacement and Fair Value Gap reclaim.",
    thesis: "Retail stop orders cluster outside the tight Asian session range. When London opens, institutional volume drives price into these stop clusters to engineer fill liquidity before reversing direction.",
    assetUniverse: ["EURUSD", "GBPUSD", "NQ"],
    marketRegime: "Session Expansion / High Volatility",
    edgeScore: 92,
    expectancyR: 0.94,
    winRateTarget: 64.0,
    profitFactor: 2.45,
    sampleSize: 68,
    edgeStateNotes: "Consistently positive across 68 audited executions. Expectancy peaked (+1.12R) when London Open aligned with higher-timeframe 4H order blocks.",
    maxRiskPercent: 1.0,
    minRrRatio: 2.0,
    invalidationRule: "If a 5-minute candle closes beyond the extreme sweep candle wick, the thesis is immediately invalidated.",
    stopLossLogic: "1 tick beyond the sweep wick extreme + 1 pip spread buffer.",
    killSwitchRule: "2 consecutive full stop-outs in London session immediately freezes the setup until New York AM.",
    tradingSessions: ["London Open"],
    killZoneStart: "07:30",
    killZoneEnd: "09:45",
    timeZone: "GMT (London)",
    daysOfWeek: ["Tuesday", "Wednesday", "Thursday"],
    newsBlackoutRule: "Strict stand-down 15 min before and after UK CPI / BoE rate releases.",
    entryChecklist: [
      {
        id: "c1",
        label: "Asian Session high/low cleanly swept by 5 to 20 pips",
        phase: "PRE_CONDITION",
        required: true,
        notes: "Must sweep resting stops without acceptance inside the level.",
      },
      {
        id: "c2",
        label: "5-minute Market Structure Shift (MSS) with energetic displacement candle",
        phase: "TRIGGER",
        required: true,
        notes: "Displacement candle body must close outside previous structural swing pivot.",
      },
      {
        id: "c3",
        label: "Fair Value Gap (FVG) or Order Block left behind after displacement",
        phase: "CONFIRMATION",
        required: true,
        notes: "Limit entry set at the 50% equilibrium of the FVG.",
      },
      {
        id: "c4",
        label: "Higher-Timeframe (1H/4H) trend alignment or key level confluence",
        phase: "CONFIRMATION",
        required: false,
        notes: "Adds 8% win-rate edge when HTF direction aligns with reversal.",
      },
    ],
    disqualifiers: [
      {
        id: "d1",
        condition: "High-impact red folder news event occurring within 15 minutes of trigger",
        severity: "SKIP_TRADE",
        explanation: "Slippage and unpredictable spread expansion destroy risk parameters.",
      },
      {
        id: "d2",
        condition: "Sweep was accompanied by high-volume sustained candle close outside the range",
        severity: "FATAL_EXIT",
        explanation: "Indicates genuine breakout momentum rather than a fakeout/liquidity sweep.",
      },
      {
        id: "d3",
        condition: "Target already reached before limit entry fills on the retest",
        severity: "SKIP_TRADE",
        explanation: "Risk/reward asymmetry is lost if opposing liquidity is already cleared.",
      },
    ],
    exitStrategy: {
      tp1Ratio: 1.5,
      tp1Percent: 50,
      tp2Ratio: 2.8,
      tp2Percent: 35,
      runnerRule: "Trail remaining 15% position behind 15-minute swing pivot lows until opposing session liquidity is tagged.",
      breakevenRule: "Move stop to entry + 0.1R immediately once TP1 is triggered.",
      timeStopMinutes: 60,
    },
    refinements: [
      {
        id: "r1",
        version: "v1.2",
        date: "2026-03-14",
        author: "Lead Trader",
        changeSummary: "Increased TP1 from 1:1R to 1:1.5R based on trade review cluster analysis.",
        hypothesis: "Allowing trades to expand an extra 0.5R before scaling improves total net expectancy without significantly hurting win rate.",
        impactObserved: "Net expectancy rose from +0.76R to +0.94R over 24 subsequent trades.",
        tradesSampled: 24,
        status: "IMPLEMENTED",
      },
      {
        id: "r2",
        version: "v1.1",
        date: "2026-01-20",
        author: "Lead Trader",
        changeSummary: "Added strict Asian range size filter (maximum 40 pips).",
        hypothesis: "When Asian range is wider than 40 pips, London moves often chop rather than cleanly reverse.",
        impactObserved: "Eliminated 6 false-break losses in high-range market days.",
        tradesSampled: 40,
        status: "IMPLEMENTED",
      },
    ],
  },
  {
    accountId: null,
    name: "NY Opening Drive VWAP Continuation",
    category: "Trend Continuation",
    version: "v1.0",
    status: "ACTIVE",
    description: "Captures high-probability trend continuation during the New York morning drive when price pulls back to the session Volume-Weighted Average Price (VWAP) after directional displacement.",
    thesis: "Large institutional participants execute passive volume at VWAP benchmark. In strong trending sessions, the initial pullback to VWAP finds aggressive limit buyer defense.",
    assetUniverse: ["NQ", "ES"],
    marketRegime: "Trending & Directional Momentum",
    edgeScore: 88,
    expectancyR: 0.81,
    winRateTarget: 59.0,
    profitFactor: 2.18,
    sampleSize: 52,
    edgeStateNotes: "Performs with highest edge on Tuesdays and Thursdays. Avoid trading when market opens inside the previous day's value area chop.",
    maxRiskPercent: 1.0,
    minRrRatio: 2.2,
    invalidationRule: "Two consecutive 5-minute candle closes on the opposite side of VWAP with negative delta cancels setup.",
    stopLossLogic: "Behind the 15-minute swing low created by the initial opening drive, or 12 NQ points behind VWAP.",
    killSwitchRule: "Strategy paused if opening drive fails twice in the first 45 minutes of cash open.",
    tradingSessions: ["New York AM"],
    killZoneStart: "09:45",
    killZoneEnd: "11:15",
    timeZone: "EST (New York)",
    daysOfWeek: ["Tuesday", "Wednesday", "Thursday"],
    newsBlackoutRule: "10:00 AM ISM / Consumer Sentiment / Fed speakers require 5 min flat window.",
    entryChecklist: [
      {
        id: "vc1",
        label: "Opening 15-minute drive establishes clear directional slope with Cumulative Volume Delta (CVD) confirmation",
        phase: "PRE_CONDITION",
        required: true,
      },
      {
        id: "vc2",
        label: "First orderly pullback into VWAP equilibrium (volume should decline during pullback)",
        phase: "TRIGGER",
        required: true,
      },
      {
        id: "vc3",
        label: "Bullish/Bearish rejection wick at VWAP with tape absorbing aggressive counter-orders",
        phase: "CONFIRMATION",
        required: true,
      },
    ],
    disqualifiers: [
      {
        id: "vd1",
        condition: "Opening drive was less than 30 NQ points (lacks institutional displacement)",
        severity: "SKIP_TRADE",
      },
      {
        id: "vd2",
        condition: "Pullback slices through VWAP with heavy volume acceleration",
        severity: "FATAL_EXIT",
      },
    ],
    exitStrategy: {
      tp1Ratio: 2.0,
      tp1Percent: 60,
      tp2Ratio: 3.5,
      tp2Percent: 30,
      runnerRule: "Trail 10% runner under 5m 20 EMA until 11:30 EST lunch consolidation.",
      breakevenRule: "Move stop to BE after taking TP1.",
      timeStopMinutes: 45,
    },
    refinements: [
      {
        id: "vr1",
        version: "v1.0",
        date: "2026-02-10",
        author: "Quantitative Team",
        changeSummary: "Formalized baseline rules from 120 backtested sessions.",
        hypothesis: "Entering only on first test of VWAP yields +0.3R higher edge than second/third tests.",
        status: "IMPLEMENTED",
      },
    ],
  },
  {
    accountId: null,
    name: "Opening Range Breakout & Volume Expansion",
    category: "Breakout & Momentum",
    version: "v1.1",
    status: "CALIBRATING",
    description: "Systematic breakout execution on 15-minute Opening Range high/low breaks supported by above-average relative volume (RVOL > 2.0) and market breath confluence.",
    thesis: "When a stock or index coils into a tight 15m range at open, breakout participants and trapped counter-trend traders generate accelerated order flow momentum upon breach.",
    assetUniverse: ["NQ", "AAPL", "NVDA", "TSLA"],
    marketRegime: "Volatile Expansion / Catalyst Days",
    edgeScore: 78,
    expectancyR: 0.62,
    winRateTarget: 52.0,
    profitFactor: 1.85,
    sampleSize: 31,
    edgeStateNotes: "Currently under paper calibration. High reward-to-risk (1:2.8) compensates for lower 52% win rate.",
    maxRiskPercent: 0.75,
    minRrRatio: 2.5,
    invalidationRule: "Candle closes back inside the middle 50% of the opening range.",
    stopLossLogic: "At the midpoint of the 15-minute opening range candle.",
    killSwitchRule: "1 false breakout failure caps daily attempts on this instrument.",
    tradingSessions: ["New York AM"],
    killZoneStart: "09:45",
    killZoneEnd: "10:30",
    timeZone: "EST (New York)",
    daysOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    newsBlackoutRule: "Do not take breakout if major data release is scheduled at 10:00 AM.",
    entryChecklist: [
      {
        id: "orb1",
        label: "15-minute Opening Range established cleanly without excessive wicks",
        phase: "PRE_CONDITION",
        required: true,
      },
      {
        id: "orb2",
        label: "Breakout candle closes decisively outside the 15m high or low",
        phase: "TRIGGER",
        required: true,
      },
      {
        id: "orb3",
        label: "Relative Volume (RVOL) at breakout > 2.0x average",
        phase: "CONFIRMATION",
        required: true,
      },
    ],
    disqualifiers: [
      {
        id: "orbd1",
        condition: "Range is wider than 1.5x daily Average True Range (exhaustion breakout risk)",
        severity: "SKIP_TRADE",
      },
    ],
    exitStrategy: {
      tp1Ratio: 2.0,
      tp1Percent: 50,
      tp2Ratio: 3.5,
      tp2Percent: 50,
      breakevenRule: "Trail stop immediately to breakout level after 1R profit reached.",
      timeStopMinutes: 30,
    },
    refinements: [
      {
        id: "orbr1",
        version: "v1.1",
        date: "2026-03-01",
        author: "Trader",
        changeSummary: "Shifted from stop-market entry on break to candle-close confirmation to reduce false-break wicks.",
        hypothesis: "Waiting for candle close avoids 35% of false wick sweeps.",
        status: "TESTING",
      },
    ],
  },
];

export async function seedDefaultStrategiesIfEmpty(userId: string): Promise<void> {
  const existing = await sql`
    SELECT COUNT(*)::int as count FROM strategies WHERE user_id = ${userId}
  `;
  const count = Number(existing[0]?.count || 0);
  if (count > 0) return;

  for (const s of DEFAULT_STRATEGIES) {
    await createStrategy(userId, s);
  }
}

export async function getUserStrategies(
  userId: string,
  accountId?: string | null
): Promise<Strategy[]> {
  // Ensure default realistic strategies exist if user has none
  await seedDefaultStrategiesIfEmpty(userId);

  let rows: Record<string, unknown>[];
  if (accountId) {
    rows = (await sql`
      SELECT * FROM strategies 
      WHERE user_id = ${userId} AND (account_id = ${accountId} OR account_id IS NULL)
      ORDER BY edge_score DESC, created_at DESC
    `) as Record<string, unknown>[];
  } else {
    rows = (await sql`
      SELECT * FROM strategies 
      WHERE user_id = ${userId}
      ORDER BY edge_score DESC, created_at DESC
    `) as Record<string, unknown>[];
  }

  return rows.map(mapStrategyRow);
}

export async function getStrategyById(id: string, userId: string): Promise<Strategy | null> {
  const rows = (await sql`
    SELECT * FROM strategies 
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `) as Record<string, unknown>[];

  if (!rows.length) return null;
  return mapStrategyRow(rows[0]);
}

export async function createStrategy(
  userId: string,
  input: CreateStrategyInput
): Promise<Strategy> {
  const rows = (await sql`
    INSERT INTO strategies (
      user_id,
      account_id,
      name,
      category,
      version,
      status,
      description,
      thesis,
      asset_universe,
      market_regime,
      edge_score,
      expectancy_r,
      win_rate_target,
      profit_factor,
      sample_size,
      edge_state_notes,
      max_risk_percent,
      min_rr_ratio,
      invalidation_rule,
      stop_loss_logic,
      kill_switch_rule,
      trading_sessions,
      kill_zone_start,
      kill_zone_end,
      time_zone,
      days_of_week,
      news_blackout_rule,
      entry_checklist,
      disqualifiers,
      exit_strategy,
      refinements
    ) VALUES (
      ${userId},
      ${input.accountId || null},
      ${input.name},
      ${input.category || "Liquidity Sweep"},
      ${input.version || "v1.0"},
      ${input.status || "ACTIVE"},
      ${input.description || null},
      ${input.thesis || null},
      ${JSON.stringify(input.assetUniverse || ["NQ", "ES"])},
      ${input.marketRegime || "High Volatility Trend"},
      ${input.edgeScore ?? 85},
      ${input.expectancyR ?? 0.85},
      ${input.winRateTarget ?? 60.0},
      ${input.profitFactor ?? 2.10},
      ${input.sampleSize ?? 30},
      ${input.edgeStateNotes || null},
      ${input.maxRiskPercent ?? 1.0},
      ${input.minRrRatio ?? 2.0},
      ${input.invalidationRule || null},
      ${input.stopLossLogic || null},
      ${input.killSwitchRule || null},
      ${JSON.stringify(input.tradingSessions || ["New York AM"])},
      ${input.killZoneStart || "09:30"},
      ${input.killZoneEnd || "11:30"},
      ${input.timeZone || "EST (UTC-5)"},
      ${JSON.stringify(input.daysOfWeek || ["Tuesday", "Wednesday", "Thursday"])},
      ${input.newsBlackoutRule || null},
      ${JSON.stringify(input.entryChecklist || [])},
      ${JSON.stringify(input.disqualifiers || [])},
      ${JSON.stringify(input.exitStrategy || {})},
      ${JSON.stringify(input.refinements || [])}
    )
    RETURNING *
  `) as Record<string, unknown>[];

  return mapStrategyRow(rows[0]);
}

export async function updateStrategy(
  id: string,
  userId: string,
  input: UpdateStrategyInput
): Promise<Strategy | null> {
  const current = await getStrategyById(id, userId);
  if (!current) return null;

  const updatedName = input.name !== undefined ? input.name : current.name;
  const updatedCategory = input.category !== undefined ? input.category : current.category;
  const updatedVersion = input.version !== undefined ? input.version : current.version;
  const updatedStatus = input.status !== undefined ? input.status : current.status;
  const updatedDescription = input.description !== undefined ? input.description : current.description;
  const updatedThesis = input.thesis !== undefined ? input.thesis : current.thesis;
  const updatedAssetUniverse = input.assetUniverse !== undefined ? input.assetUniverse : current.assetUniverse;
  const updatedMarketRegime = input.marketRegime !== undefined ? input.marketRegime : current.marketRegime;
  const updatedEdgeScore = input.edgeScore !== undefined ? input.edgeScore : current.edgeScore;
  const updatedExpectancyR = input.expectancyR !== undefined ? input.expectancyR : current.expectancyR;
  const updatedWinRateTarget = input.winRateTarget !== undefined ? input.winRateTarget : current.winRateTarget;
  const updatedProfitFactor = input.profitFactor !== undefined ? input.profitFactor : current.profitFactor;
  const updatedSampleSize = input.sampleSize !== undefined ? input.sampleSize : current.sampleSize;
  const updatedEdgeStateNotes = input.edgeStateNotes !== undefined ? input.edgeStateNotes : current.edgeStateNotes;
  const updatedMaxRiskPercent = input.maxRiskPercent !== undefined ? input.maxRiskPercent : current.maxRiskPercent;
  const updatedMinRrRatio = input.minRrRatio !== undefined ? input.minRrRatio : current.minRrRatio;
  const updatedInvalidationRule = input.invalidationRule !== undefined ? input.invalidationRule : current.invalidationRule;
  const updatedStopLossLogic = input.stopLossLogic !== undefined ? input.stopLossLogic : current.stopLossLogic;
  const updatedKillSwitchRule = input.killSwitchRule !== undefined ? input.killSwitchRule : current.killSwitchRule;
  const updatedTradingSessions = input.tradingSessions !== undefined ? input.tradingSessions : current.tradingSessions;
  const updatedKillZoneStart = input.killZoneStart !== undefined ? input.killZoneStart : current.killZoneStart;
  const updatedKillZoneEnd = input.killZoneEnd !== undefined ? input.killZoneEnd : current.killZoneEnd;
  const updatedTimeZone = input.timeZone !== undefined ? input.timeZone : current.timeZone;
  const updatedDaysOfWeek = input.daysOfWeek !== undefined ? input.daysOfWeek : current.daysOfWeek;
  const updatedNewsBlackoutRule = input.newsBlackoutRule !== undefined ? input.newsBlackoutRule : current.newsBlackoutRule;
  const updatedEntryChecklist = input.entryChecklist !== undefined ? input.entryChecklist : current.entryChecklist;
  const updatedDisqualifiers = input.disqualifiers !== undefined ? input.disqualifiers : current.disqualifiers;
  const updatedExitStrategy = input.exitStrategy !== undefined ? input.exitStrategy : current.exitStrategy;
  const updatedRefinements = input.refinements !== undefined ? input.refinements : current.refinements;

  const rows = (await sql`
    UPDATE strategies SET
      name = ${updatedName},
      category = ${updatedCategory},
      version = ${updatedVersion},
      status = ${updatedStatus},
      description = ${updatedDescription},
      thesis = ${updatedThesis},
      asset_universe = ${JSON.stringify(updatedAssetUniverse)},
      market_regime = ${updatedMarketRegime},
      edge_score = ${updatedEdgeScore},
      expectancy_r = ${updatedExpectancyR},
      win_rate_target = ${updatedWinRateTarget},
      profit_factor = ${updatedProfitFactor},
      sample_size = ${updatedSampleSize},
      edge_state_notes = ${updatedEdgeStateNotes},
      max_risk_percent = ${updatedMaxRiskPercent},
      min_rr_ratio = ${updatedMinRrRatio},
      invalidation_rule = ${updatedInvalidationRule},
      stop_loss_logic = ${updatedStopLossLogic},
      kill_switch_rule = ${updatedKillSwitchRule},
      trading_sessions = ${JSON.stringify(updatedTradingSessions)},
      kill_zone_start = ${updatedKillZoneStart},
      kill_zone_end = ${updatedKillZoneEnd},
      time_zone = ${updatedTimeZone},
      days_of_week = ${JSON.stringify(updatedDaysOfWeek)},
      news_blackout_rule = ${updatedNewsBlackoutRule},
      entry_checklist = ${JSON.stringify(updatedEntryChecklist)},
      disqualifiers = ${JSON.stringify(updatedDisqualifiers)},
      exit_strategy = ${JSON.stringify(updatedExitStrategy)},
      refinements = ${JSON.stringify(updatedRefinements)},
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `) as Record<string, unknown>[];

  if (!rows.length) return null;
  return mapStrategyRow(rows[0]);
}

export async function deleteStrategy(id: string, userId: string): Promise<boolean> {
  const res = await sql`
    DELETE FROM strategies WHERE id = ${id} AND user_id = ${userId}
  `;
  return true;
}
