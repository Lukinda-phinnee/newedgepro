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
    playbookContent: row.playbook_content == null ? null : String(row.playbook_content),
    playbookContinuous: Boolean(row.playbook_continuous),
    isReviewed: Boolean(row.is_reviewed),
    reviewedAt: row.reviewed_at ? (row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : String(row.reviewed_at)) : null,
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
    entryModelImages: parseJson(row.entry_model_images, []),
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
    tradeManagementRules: parseJson(row.trade_management_rules, []),
    refinements: parseJson(row.refinements, []),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function getUserStrategies(
  userId: string,
  accountId?: string | null
): Promise<Strategy[]> {
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
      playbook_content,
      playbook_continuous,
      is_reviewed,
      reviewed_at,
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
      entry_model_images,
      disqualifiers,
      exit_strategy,
      trade_management_rules,
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
      ${input.playbookContent ?? null},
      ${input.playbookContinuous ?? false},
      ${input.isReviewed ?? false},
      ${input.reviewedAt ?? null},
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
      ${JSON.stringify(input.entryModelImages || [])},
      ${JSON.stringify(input.disqualifiers || [])},
      ${JSON.stringify(input.exitStrategy || {})},
      ${JSON.stringify(input.tradeManagementRules || [])},
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
  const updatedPlaybookContent = input.playbookContent !== undefined ? input.playbookContent : current.playbookContent;
  const updatedPlaybookContinuous = input.playbookContinuous !== undefined ? input.playbookContinuous : current.playbookContinuous;
  const updatedIsReviewed = input.isReviewed !== undefined ? input.isReviewed : current.isReviewed;
  const updatedReviewedAt = input.reviewedAt !== undefined ? input.reviewedAt : current.reviewedAt;
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
  const updatedEntryModelImages = input.entryModelImages !== undefined ? input.entryModelImages : (current.entryModelImages || []);
  const updatedDisqualifiers = input.disqualifiers !== undefined ? input.disqualifiers : current.disqualifiers;
  const updatedExitStrategy = input.exitStrategy !== undefined ? input.exitStrategy : current.exitStrategy;
  const updatedTradeManagementRules = input.tradeManagementRules !== undefined ? input.tradeManagementRules : (current.tradeManagementRules || []);
  const updatedRefinements = input.refinements !== undefined ? input.refinements : current.refinements;

  const rows = (await sql`
    UPDATE strategies SET
      name = ${updatedName},
      category = ${updatedCategory},
      version = ${updatedVersion},
      status = ${updatedStatus},
      description = ${updatedDescription},
      thesis = ${updatedThesis},
      playbook_content = ${updatedPlaybookContent},
      playbook_continuous = ${updatedPlaybookContinuous},
      is_reviewed = ${updatedIsReviewed},
      reviewed_at = ${updatedReviewedAt},
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
      entry_model_images = ${JSON.stringify(updatedEntryModelImages)},
      disqualifiers = ${JSON.stringify(updatedDisqualifiers)},
      exit_strategy = ${JSON.stringify(updatedExitStrategy)},
      trade_management_rules = ${JSON.stringify(updatedTradeManagementRules)},
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
