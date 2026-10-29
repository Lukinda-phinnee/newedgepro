import "server-only";
import { sql } from "@/lib/db";
import { generateSampleTrades } from "@/lib/demo-trades";
import type { ExecutionGrade, FollowedRules, ReviewStatus, Trade, TradeSide, TradeStatus } from "@/types/trade";

function mapTradeRow(row: Record<string, unknown>): Trade {
  const pnl = Number(row.pnl) || 0;
  const pnlPercentage = Number(row.pnl_percentage) || 0;
  const entryPrice = Number(row.entry_price) || 0;
  const exitPrice = row.exit_price !== null && row.exit_price !== undefined ? Number(row.exit_price) : null;
  const quantity = Number(row.quantity) || 1;
  const side = (row.side as TradeSide) || "long";
  const stopLoss = row.stop_loss !== null && row.stop_loss !== undefined ? Number(row.stop_loss) : null;
  const takeProfit = row.take_profit !== null && row.take_profit !== undefined ? Number(row.take_profit) : null;

  const plannedEntry = row.planned_entry !== null && row.planned_entry !== undefined ? Number(row.planned_entry) : null;

  let mistakeTags: string[] = [];
  if (Array.isArray(row.mistake_tags)) {
    mistakeTags = row.mistake_tags.map(String);
  } else if (typeof row.mistake_tags === "string" && row.mistake_tags.trim()) {
    try {
      const parsed = JSON.parse(row.mistake_tags);
      mistakeTags = Array.isArray(parsed) ? parsed : row.mistake_tags.split(",").map((s: string) => s.trim());
    } catch {
      mistakeTags = row.mistake_tags.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  let screenshots: string[] = [];
  if (Array.isArray(row.screenshots)) {
    screenshots = row.screenshots.map(String);
  } else if (typeof row.screenshots === "string" && row.screenshots.trim()) {
    try {
      const parsed = JSON.parse(row.screenshots);
      screenshots = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      screenshots = row.screenshots.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  const parseStoredArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map(String);
    if (typeof value !== "string" || !value.trim()) return [];
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
  };

  const reviewStatus = (row.review_status as ReviewStatus) || "unreviewed";
  const executionGrade = row.execution_grade ? (String(row.execution_grade) as ExecutionGrade) : null;
  const reviewRating = row.review_rating !== null && row.review_rating !== undefined ? Number(row.review_rating) : null;
  const followedRules = row.followed_rules ? (String(row.followed_rules) as FollowedRules) : null;
  const whatWentWell = row.what_went_well ? String(row.what_went_well) : null;
  const whatToImprove = row.what_to_improve ? String(row.what_to_improve) : null;
  const lessonsLearned = row.lessons_learned ? String(row.lessons_learned) : null;
  const reviewNotes = row.review_notes ? String(row.review_notes) : null;
  const tradeManagement = row.trade_management ? String(row.trade_management) : null;
  const reviewedAt = row.reviewed_at instanceof Date ? row.reviewed_at.toISOString() : row.reviewed_at ? String(row.reviewed_at) : null;

  let ruleEvaluation: Trade["ruleEvaluation"] = null;
  if (row.rule_evaluation) {
    if (typeof row.rule_evaluation === "string") {
      try {
        ruleEvaluation = JSON.parse(row.rule_evaluation);
      } catch {
        ruleEvaluation = null;
      }
    } else if (typeof row.rule_evaluation === "object") {
      ruleEvaluation = row.rule_evaluation as Trade["ruleEvaluation"];
    }
  }

  const ruleVerdict = (row.rule_verdict as "ACCEPT" | "WARN" | "BLOCK") || null;
  const ruleViolationsCount =
    row.rule_violations_count !== null && row.rule_violations_count !== undefined
      ? Number(row.rule_violations_count)
      : 0;

  return {
    id: String(row.id),
    isDemo: Boolean(row.is_demo),
    userId: String(row.user_id),
    accountId: String(row.account_id || ""),
    symbol: String(row.symbol || "").toUpperCase(),
    side,
    entryPrice,
    exitPrice,
    quantity,
    stopLoss,
    takeProfit,
    pnl,
    pnlPercentage,
    status: (row.status as TradeStatus) || "closed",
    strategy: row.strategy ? String(row.strategy) : null,
    marketSession: row.market_session ? String(row.market_session) : null,
    marketCondition: row.market_condition ? String(row.market_condition) : null,
    confidence: row.confidence !== null && row.confidence !== undefined ? Number(row.confidence) : null,
    plannedEntry,
    notes: row.notes ? String(row.notes) : null,
    openedAt: row.opened_at instanceof Date ? row.opened_at.toISOString() : String(row.opened_at),
    closedAt: row.closed_at instanceof Date ? row.closed_at.toISOString() : row.closed_at ? String(row.closed_at) : null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
    rMultiple: stopLoss && stopLoss !== entryPrice
      ? Math.round(((side === "long" ? 1 : -1) * ((exitPrice || entryPrice) - entryPrice)) / Math.abs(entryPrice - stopLoss) * 10) / 10
      : undefined,
    // Professional review properties
    reviewStatus,
    reviewedAt,
    executionGrade,
    reviewRating,
    followedRules,
    mistakeTags,
    whatWentWell,
    whatToImprove,
    lessonsLearned,
    reviewNotes,
    tradeManagement,
    screenshots,
    screenshotTitles: parseStoredArray(row.screenshot_titles),
    entryConfluences: parseStoredArray(row.entry_confluences),
    entryEmotion: row.entry_emotion ? String(row.entry_emotion) : null,
    exitEmotion: row.exit_emotion ? String(row.exit_emotion) : null,
    // Automated Rule Engine evaluation properties
    ruleVerdict,
    ruleViolationsCount,
    ruleEvaluation,
  };
}

async function seedEmptyDemoAccount(userId: string, accountId: string): Promise<void> {
  const accounts = await sql`
    SELECT account.account_type, account.demo_data_seeded_at,
      EXISTS (
        SELECT 1 FROM trades trade
        WHERE trade.user_id::text = account.user_id::text
          AND trade.account_id::text = account.id::text
      ) AS has_trades
    FROM trading_accounts account
    WHERE account.id = ${accountId} AND account.user_id = ${userId}
    LIMIT 1
  `;
  const account = accounts[0];
  if (!account || account.account_type !== "demo" || account.demo_data_seeded_at || account.has_trades) return;

  const fixtures = generateSampleTrades(accountId, userId).map((trade) => ({
    symbol: trade.symbol,
    side: trade.side,
    entry_price: trade.entryPrice,
    exit_price: trade.exitPrice,
    quantity: trade.quantity,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit,
    pnl: trade.pnl,
    pnl_percentage: trade.pnlPercentage,
    status: trade.status,
    strategy: trade.strategy,
    market_session: trade.marketSession,
    market_condition: trade.marketCondition,
    confidence: trade.confidence,
    planned_entry: trade.plannedEntry,
    notes: trade.notes,
    opened_at: trade.openedAt,
    closed_at: trade.closedAt,
    review_status: trade.reviewStatus,
    reviewed_at: trade.reviewedAt,
    execution_grade: trade.executionGrade,
    review_rating: trade.reviewRating,
    followed_rules: trade.followedRules,
    mistake_tags: trade.mistakeTags ? JSON.stringify(trade.mistakeTags) : null,
    what_went_well: trade.whatWentWell,
    what_to_improve: trade.whatToImprove,
    lessons_learned: trade.lessonsLearned,
    review_notes: trade.reviewNotes,
    trade_management: trade.tradeManagement,
    screenshots: trade.screenshots ? JSON.stringify(trade.screenshots) : "[]",
    screenshot_titles: trade.screenshotTitles ? JSON.stringify(trade.screenshotTitles) : "[]",
    entry_confluences: trade.entryConfluences ? JSON.stringify(trade.entryConfluences) : "[]",
    entry_emotion: trade.entryEmotion,
    exit_emotion: trade.exitEmotion,
    rule_verdict: trade.ruleVerdict,
    rule_violations_count: trade.ruleViolationsCount ?? 0,
    rule_evaluation: trade.ruleEvaluation ? JSON.stringify(trade.ruleEvaluation) : null,
  }));

  await sql`
    WITH fixtures AS (
      SELECT *
      FROM jsonb_to_recordset(${JSON.stringify(fixtures)}::jsonb) AS fixture(
        symbol text, side text, entry_price numeric, exit_price numeric,
        quantity numeric, stop_loss numeric, take_profit numeric, pnl numeric,
        pnl_percentage numeric, status text, strategy text, market_session text,
        market_condition text, confidence numeric, planned_entry numeric,
        notes text, opened_at timestamptz, closed_at timestamptz,
        review_status text, reviewed_at timestamptz, execution_grade text,
        review_rating integer, followed_rules text, mistake_tags text,
        what_went_well text, what_to_improve text, lessons_learned text,
        review_notes text, trade_management text, screenshots text,
        screenshot_titles text, entry_confluences text, entry_emotion text,
        exit_emotion text, rule_verdict text, rule_violations_count integer,
        rule_evaluation jsonb
      )
    ), seed_claim AS (
      UPDATE trading_accounts account
      SET demo_data_seeded_at = NOW(),
          current_balance = COALESCE(account.current_balance, account.starting_balance)
            + COALESCE((SELECT SUM(fixture.pnl) FROM fixtures fixture WHERE fixture.status = 'closed'), 0)
      WHERE account.id = ${accountId}
        AND account.user_id = ${userId}
        AND account.account_type = 'demo'
        AND account.demo_data_seeded_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM trades trade
          WHERE trade.user_id = ${userId} AND trade.account_id = ${accountId}
        )
      RETURNING account.id
    )
    INSERT INTO trades (
      user_id, account_id, symbol, side, entry_price, exit_price, quantity,
      stop_loss, take_profit, pnl, pnl_percentage, status, strategy,
      market_session, market_condition, confidence, planned_entry, notes,
      opened_at, closed_at, review_status, reviewed_at, execution_grade,
      review_rating, followed_rules, mistake_tags, what_went_well,
      what_to_improve, lessons_learned, review_notes, trade_management,
      screenshots, screenshot_titles, entry_confluences, entry_emotion,
      exit_emotion, rule_verdict, rule_violations_count, rule_evaluation,
      is_demo
    )
    SELECT
      ${userId}, seed_claim.id, fixture.symbol, fixture.side,
      fixture.entry_price, fixture.exit_price, fixture.quantity,
      fixture.stop_loss, fixture.take_profit, fixture.pnl,
      fixture.pnl_percentage, fixture.status, fixture.strategy,
      fixture.market_session, fixture.market_condition, fixture.confidence,
      fixture.planned_entry, fixture.notes, fixture.opened_at, fixture.closed_at,
      fixture.review_status, fixture.reviewed_at, fixture.execution_grade,
      fixture.review_rating, fixture.followed_rules, fixture.mistake_tags,
      fixture.what_went_well, fixture.what_to_improve, fixture.lessons_learned,
      fixture.review_notes, fixture.trade_management, fixture.screenshots,
      fixture.screenshot_titles, fixture.entry_confluences, fixture.entry_emotion,
      fixture.exit_emotion, fixture.rule_verdict, fixture.rule_violations_count,
      fixture.rule_evaluation, true
    FROM seed_claim CROSS JOIN fixtures AS fixture
  `;
}

export async function getUserTrades(
  userId: string,
  accountId?: string,
): Promise<Trade[]> {
  if (accountId) await seedEmptyDemoAccount(userId, accountId);
  const rows = accountId
    ? await sql`
        SELECT * FROM trades
        WHERE user_id = ${userId} AND account_id = ${accountId}
        ORDER BY opened_at DESC
      `
    : await sql`
        SELECT * FROM trades
        WHERE user_id = ${userId}
        ORDER BY opened_at DESC
      `;
  return (rows as Record<string, unknown>[]).map(mapTradeRow);
}

export async function createTrade(
  userId: string,
  trade: {
    accountId: string;
    symbol: string;
    side: TradeSide;
    entryPrice: number;
    exitPrice?: number | null;
    quantity: number;
    stopLoss?: number | null;
    takeProfit?: number | null;
    pnl?: number;
    pnlPercentage?: number;
    status?: TradeStatus;
    strategy?: string | null;
    marketSession?: string | null;
    marketCondition?: string | null;
    confidence?: number | null;
    plannedEntry?: number | null;
    notes?: string | null;
    openedAt: string;
    closedAt?: string | null;
    reviewStatus?: ReviewStatus;
    reviewedAt?: string | null;
    executionGrade?: ExecutionGrade | null;
    reviewRating?: number | null;
    followedRules?: FollowedRules | null;
    mistakeTags?: string[] | null;
    whatWentWell?: string | null;
    whatToImprove?: string | null;
    lessonsLearned?: string | null;
    reviewNotes?: string | null;
    tradeManagement?: string | null;
    screenshots?: string[] | null;
    screenshotTitles?: string[] | null;
    entryConfluences?: string[] | null;
    entryEmotion?: string | null;
    exitEmotion?: string | null;
    ruleVerdict?: "ACCEPT" | "WARN" | "BLOCK" | null;
    ruleViolationsCount?: number | null;
    ruleEvaluation?: Record<string, unknown> | null;
    isDemo?: boolean;
  },
): Promise<Trade> {
  const pnl = trade.pnl ?? (trade.exitPrice ? (trade.side === "long" ? (trade.exitPrice - trade.entryPrice) * trade.quantity : (trade.entryPrice - trade.exitPrice) * trade.quantity) : 0);
  const pnlPct = trade.pnlPercentage ?? (trade.entryPrice > 0 ? (pnl / (trade.entryPrice * trade.quantity)) * 100 : 0);
  const reviewStatus = trade.reviewStatus || "unreviewed";
  const mistakeTagsStr = trade.mistakeTags ? JSON.stringify(trade.mistakeTags) : null;
  const screenshotsStr = trade.screenshots ? JSON.stringify(trade.screenshots) : JSON.stringify([]);
  const screenshotTitlesStr = trade.screenshotTitles ? JSON.stringify(trade.screenshotTitles) : JSON.stringify([]);
  const entryConfluencesStr = trade.entryConfluences ? JSON.stringify(trade.entryConfluences) : JSON.stringify([]);
  const ruleEvaluationStr = trade.ruleEvaluation ? JSON.stringify(trade.ruleEvaluation) : null;

  const rows = (await sql`
    WITH created AS (
    INSERT INTO trades (
      user_id,
      account_id,
      symbol,
      side,
      entry_price,
      exit_price,
      quantity,
      stop_loss,
      take_profit,
      pnl,
      pnl_percentage,
      status,
      strategy,
      market_session,
      market_condition,
      confidence,
      planned_entry,
      notes,
      opened_at,
      closed_at,
      review_status,
      reviewed_at,
      execution_grade,
      review_rating,
      followed_rules,
      mistake_tags,
      what_went_well,
      what_to_improve,
      lessons_learned,
      review_notes,
      trade_management,
      screenshots,
      screenshot_titles,
      entry_confluences,
      entry_emotion,
      exit_emotion,
      rule_verdict,
      rule_violations_count,
      rule_evaluation,
      is_demo
    ) VALUES (
      ${userId},
      ${trade.accountId},
      ${trade.symbol.toUpperCase()},
      ${trade.side},
      ${trade.entryPrice},
      ${trade.exitPrice ?? null},
      ${trade.quantity},
      ${trade.stopLoss ?? null},
      ${trade.takeProfit ?? null},
      ${pnl},
      ${pnlPct},
      ${trade.status ?? "closed"},
      ${trade.strategy ?? null},
      ${trade.marketSession ?? null},
      ${trade.marketCondition ?? null},
      ${trade.confidence ?? null},
      ${trade.plannedEntry ?? null},
      ${trade.notes ?? null},
      ${trade.openedAt},
      ${trade.closedAt ?? null},
      ${reviewStatus},
      ${trade.reviewedAt ?? null},
      ${trade.executionGrade ?? null},
      ${trade.reviewRating ?? null},
      ${trade.followedRules ?? null},
      ${mistakeTagsStr},
      ${trade.whatWentWell ?? null},
      ${trade.whatToImprove ?? null},
      ${trade.lessonsLearned ?? null},
      ${trade.reviewNotes ?? null},
      ${trade.tradeManagement ?? null},
      ${screenshotsStr},
      ${screenshotTitlesStr},
      ${entryConfluencesStr},
      ${trade.entryEmotion ?? null},
      ${trade.exitEmotion ?? null},
      ${trade.ruleVerdict ?? null},
      ${trade.ruleViolationsCount ?? 0},
      ${ruleEvaluationStr}::jsonb,
      ${Boolean(trade.isDemo)}
    )
    RETURNING *
    ), balance_update AS (
      UPDATE trading_accounts account
      SET current_balance = COALESCE(account.current_balance, account.starting_balance)
        + CASE WHEN created.status = 'closed' THEN COALESCE(created.pnl, 0) ELSE 0 END,
        updated_at = NOW()
      FROM created
      WHERE account.id::text = created.account_id::text AND account.user_id = ${userId}
      RETURNING account.id
    )
    SELECT * FROM created
  `) as Record<string, unknown>[];

  return mapTradeRow(rows[0]);
}

export async function updateTrade(
  id: string,
  userId: string,
  updates: Partial<Trade>,
): Promise<Trade | null> {
  const existing = (await sql`
    SELECT * FROM trades WHERE id = ${id} AND user_id = ${userId}
  `) as Record<string, unknown>[];

  if (!existing || existing.length === 0) return null;

  const current = existing[0];
  const symbol = updates.symbol ? updates.symbol.toUpperCase() : current.symbol;
  const side = updates.side ?? current.side;
  const entryPrice = updates.entryPrice ?? Number(current.entry_price);
  const exitPrice = updates.exitPrice !== undefined ? updates.exitPrice : current.exit_price;
  const quantity = updates.quantity ?? Number(current.quantity);
  const stopLoss = updates.stopLoss !== undefined ? updates.stopLoss : current.stop_loss;
  const takeProfit = updates.takeProfit !== undefined ? updates.takeProfit : current.take_profit;
  const status = updates.status ?? current.status;
  const pnlInputsChanged = [updates.side, updates.entryPrice, updates.exitPrice, updates.quantity, updates.status]
    .some((value) => value !== undefined);
  const pnl = updates.pnl !== undefined
    ? updates.pnl
    : pnlInputsChanged
      ? status === "closed" && exitPrice !== null
        ? (side === "long" ? 1 : -1) * (Number(exitPrice) - entryPrice) * quantity
        : 0
      : Number(current.pnl);
  const pnlPercentage = updates.pnlPercentage !== undefined
    ? updates.pnlPercentage
    : pnlInputsChanged && entryPrice > 0 && quantity > 0
      ? (pnl / (entryPrice * quantity)) * 100
      : Number(current.pnl_percentage);
  const strategy = updates.strategy !== undefined ? updates.strategy : current.strategy;
  const marketSession = updates.marketSession !== undefined ? updates.marketSession : current.market_session;
  const marketCondition = updates.marketCondition !== undefined ? updates.marketCondition : current.market_condition;
  const confidence = updates.confidence !== undefined ? updates.confidence : current.confidence;
  const plannedEntry = updates.plannedEntry !== undefined ? updates.plannedEntry : current.planned_entry;
  const notes = updates.notes !== undefined ? updates.notes : current.notes;
  const openedAt = updates.openedAt ?? current.opened_at;
  const closedAt = updates.closedAt !== undefined ? updates.closedAt : current.closed_at;

  const reviewStatus = updates.reviewStatus !== undefined ? updates.reviewStatus : ((current.review_status as ReviewStatus) || "unreviewed");
  const reviewedAtVal = updates.reviewedAt !== undefined ? updates.reviewedAt : current.reviewed_at;
  const reviewedAt = reviewedAtVal ? new Date(String(reviewedAtVal)).toISOString() : null;
  const executionGrade = updates.executionGrade !== undefined ? updates.executionGrade : (current.execution_grade as ExecutionGrade | null);
  const reviewRating = updates.reviewRating !== undefined ? updates.reviewRating : (current.review_rating ? Number(current.review_rating) : null);
  const followedRules = updates.followedRules !== undefined ? updates.followedRules : (current.followed_rules as FollowedRules | null);
  const mistakeTagsStr = updates.mistakeTags !== undefined ? (Array.isArray(updates.mistakeTags) ? JSON.stringify(updates.mistakeTags) : (updates.mistakeTags ? String(updates.mistakeTags) : null)) : (current.mistake_tags ? String(current.mistake_tags) : null);
  const whatWentWell = updates.whatWentWell !== undefined ? updates.whatWentWell : (current.what_went_well ? String(current.what_went_well) : null);
  const whatToImprove = updates.whatToImprove !== undefined ? updates.whatToImprove : (current.what_to_improve ? String(current.what_to_improve) : null);
  const lessonsLearned = updates.lessonsLearned !== undefined ? updates.lessonsLearned : (current.lessons_learned ? String(current.lessons_learned) : null);
  const reviewNotes = updates.reviewNotes !== undefined ? updates.reviewNotes : (current.review_notes ? String(current.review_notes) : null);
  const tradeManagement = updates.tradeManagement !== undefined ? updates.tradeManagement : (current.trade_management ? String(current.trade_management) : null);
  const screenshotsStr = updates.screenshots !== undefined ? (Array.isArray(updates.screenshots) ? JSON.stringify(updates.screenshots) : (updates.screenshots ? String(updates.screenshots) : null)) : (current.screenshots ? String(current.screenshots) : null);
  const screenshotTitlesStr = updates.screenshotTitles !== undefined ? JSON.stringify(updates.screenshotTitles ?? []) : (current.screenshot_titles ? String(current.screenshot_titles) : JSON.stringify([]));
  const entryConfluencesStr = updates.entryConfluences !== undefined ? JSON.stringify(updates.entryConfluences ?? []) : (current.entry_confluences ? String(current.entry_confluences) : JSON.stringify([]));
  const entryEmotion = updates.entryEmotion !== undefined ? updates.entryEmotion : (current.entry_emotion ? String(current.entry_emotion) : null);
  const exitEmotion = updates.exitEmotion !== undefined ? updates.exitEmotion : (current.exit_emotion ? String(current.exit_emotion) : null);

  const ruleVerdict = updates.ruleVerdict !== undefined ? updates.ruleVerdict : (current.rule_verdict as "ACCEPT" | "WARN" | "BLOCK" | null);
  const ruleViolationsCount = updates.ruleViolationsCount !== undefined ? updates.ruleViolationsCount : (current.rule_violations_count !== null ? Number(current.rule_violations_count) : 0);
  const ruleEvaluationStr = updates.ruleEvaluation !== undefined
    ? (updates.ruleEvaluation ? JSON.stringify(updates.ruleEvaluation) : null)
    : (current.rule_evaluation ? (typeof current.rule_evaluation === "string" ? current.rule_evaluation : JSON.stringify(current.rule_evaluation)) : null);

  const rows = (await sql`
    WITH updated AS (
    UPDATE trades
    SET
      symbol = ${symbol},
      side = ${side},
      entry_price = ${entryPrice},
      exit_price = ${exitPrice},
      quantity = ${quantity},
      stop_loss = ${stopLoss},
      take_profit = ${takeProfit},
      pnl = ${pnl},
      pnl_percentage = ${pnlPercentage},
      status = ${status},
      strategy = ${strategy},
      market_session = ${marketSession},
      market_condition = ${marketCondition},
      confidence = ${confidence},
      planned_entry = ${plannedEntry},
      notes = ${notes},
      opened_at = ${openedAt},
      closed_at = ${closedAt},
      review_status = ${reviewStatus},
      reviewed_at = ${reviewedAt},
      execution_grade = ${executionGrade ?? null},
      review_rating = ${reviewRating ?? null},
      followed_rules = ${followedRules ?? null},
      mistake_tags = ${mistakeTagsStr ?? null},
      what_went_well = ${whatWentWell ?? null},
      what_to_improve = ${whatToImprove ?? null},
      lessons_learned = ${lessonsLearned ?? null},
      review_notes = ${reviewNotes ?? null},
      trade_management = ${tradeManagement ?? null},
      screenshots = ${screenshotsStr ?? null},
      screenshot_titles = ${screenshotTitlesStr},
      entry_confluences = ${entryConfluencesStr},
      entry_emotion = ${entryEmotion ?? null},
      exit_emotion = ${exitEmotion ?? null},
      rule_verdict = ${ruleVerdict ?? null},
      rule_violations_count = ${ruleViolationsCount ?? 0},
      rule_evaluation = ${ruleEvaluationStr}::jsonb,
      updated_at = NOW()
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *,
      CASE WHEN status = 'closed' THEN COALESCE(pnl, 0) ELSE 0 END AS new_balance_contribution,
      CASE WHEN ${String(current.status)} = 'closed' THEN COALESCE(${Number(current.pnl)}, 0) ELSE 0 END AS old_balance_contribution
    ), balance_update AS (
      UPDATE trading_accounts account
      SET current_balance = COALESCE(account.current_balance, account.starting_balance)
        + updated.new_balance_contribution - updated.old_balance_contribution,
        updated_at = NOW()
      FROM updated
      WHERE account.id::text = updated.account_id::text AND account.user_id = ${userId}
      RETURNING account.id
    )
    SELECT * FROM updated
  `) as Record<string, unknown>[];

  return rows[0] ? mapTradeRow(rows[0]) : null;
}

export async function deleteTrade(id: string, userId: string): Promise<boolean> {
  const res = (await sql`
    WITH deleted AS (
      DELETE FROM trades
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, user_id, account_id, status, pnl
    ), balance_update AS (
      UPDATE trading_accounts account
      SET current_balance = COALESCE(account.current_balance, account.starting_balance)
        - CASE WHEN deleted.status = 'closed' THEN COALESCE(deleted.pnl, 0) ELSE 0 END,
        updated_at = NOW()
      FROM deleted
      WHERE account.id::text = deleted.account_id::text
        AND account.user_id::text = deleted.user_id::text
      RETURNING account.id
    )
    SELECT id FROM deleted
  `) as Record<string, unknown>[];

  return res.length > 0;
}
