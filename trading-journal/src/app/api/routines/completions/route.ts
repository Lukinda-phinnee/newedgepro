import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/server";
import { sql } from "@/lib/db";
import {
  DEFAULT_PRE_MARKET_ROUTINE,
  DEFAULT_DURING_MARKET_ROUTINE,
  DEFAULT_POST_MARKET_ROUTINE,
  type Routine,
} from "@/lib/routines";

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  routineType: z.enum(["premarket", "intraday", "duringmarket", "postmarket"]),
  stepId: z.string().min(1).max(60),
  completed: z.boolean(),
});

let routineSchemaEnsured = false;
let routineSchemaEnsurePromise: Promise<void> | null = null;

async function ensureRoutineSchema() {
  if (routineSchemaEnsured) return;
  if (!routineSchemaEnsurePromise) {
    routineSchemaEnsurePromise = (async () => {
      await sql`ALTER TABLE user_profile_settings ADD COLUMN IF NOT EXISTS pre_market_routine JSONB`;
      await sql`ALTER TABLE user_profile_settings ADD COLUMN IF NOT EXISTS during_market_routine JSONB`;
      await sql`ALTER TABLE user_profile_settings ADD COLUMN IF NOT EXISTS post_market_routine JSONB`;
      await sql`CREATE TABLE IF NOT EXISTS routine_completions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        routine_type TEXT NOT NULL DEFAULT 'premarket',
        completed_steps TEXT[] NOT NULL DEFAULT '{}',
        all_completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT routine_completions_user_date_type_key UNIQUE (user_id, date, routine_type)
      )`;
      await sql`CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date ON routine_completions (user_id, date)`;
      routineSchemaEnsured = true;
    })().finally(() => {
      routineSchemaEnsurePromise = null;
    });
  }
  await routineSchemaEnsurePromise;
}

export async function GET(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureRoutineSchema();
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month"); // e.g. "2026-11"

  const profileRows = await sql`
    SELECT pre_market_routine, during_market_routine, post_market_routine
    FROM user_profile_settings
    WHERE user_id = ${session.user.id}
    LIMIT 1
  `;

  const userRoutines = {
    premarket: (profileRows[0]?.pre_market_routine as Routine) ?? DEFAULT_PRE_MARKET_ROUTINE,
    intraday: (profileRows[0]?.during_market_routine as Routine) ?? DEFAULT_DURING_MARKET_ROUTINE,
    postmarket: (profileRows[0]?.post_market_routine as Routine) ?? DEFAULT_POST_MARKET_ROUTINE,
  };

  let rows;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const startDate = `${month}-01`;
    // Approximate end of month filter
    rows = await sql`
      SELECT * FROM routine_completions
      WHERE user_id = ${session.user.id}
        AND date >= ${startDate}::date
        AND date <= (${startDate}::date + INTERVAL '1 month' - INTERVAL '1 day')::date
      ORDER BY date ASC, routine_type ASC
    `;
  } else {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    rows = await sql`
      SELECT * FROM routine_completions
      WHERE user_id = ${session.user.id} AND date = ${targetDate}
    `;
  }

  return NextResponse.json({
    date: date || new Date().toISOString().slice(0, 10),
    completions: rows,
    routines: userRoutines,
    routine: userRoutines.premarket, // backwards compatibility
  });
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureRoutineSchema();

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  let { date, routineType, stepId, completed } = parsed.data;
  if (routineType === "duringmarket") {
    routineType = "intraday";
  }
  const userId = session.user.id;

  // Get current completion row
  const existing = await sql`
    SELECT * FROM routine_completions
    WHERE user_id = ${userId} AND date = ${date} AND routine_type = ${routineType}
    LIMIT 1
  `;
  const current = existing[0];
  const currentSteps: string[] = Array.isArray(current?.completed_steps) ? current.completed_steps : [];

  // Get routine config to know total steps
  const profileRows = await sql`
    SELECT pre_market_routine, during_market_routine, post_market_routine
    FROM user_profile_settings
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  let routine: Routine;
  if (routineType === "premarket") {
    routine = (profileRows[0]?.pre_market_routine as Routine) ?? DEFAULT_PRE_MARKET_ROUTINE;
  } else if (routineType === "intraday") {
    routine = (profileRows[0]?.during_market_routine as Routine) ?? DEFAULT_DURING_MARKET_ROUTINE;
  } else {
    routine = (profileRows[0]?.post_market_routine as Routine) ?? DEFAULT_POST_MARKET_ROUTINE;
  }

  const totalSteps = Array.isArray(routine?.steps) ? routine.steps.length : 0;

  let newSteps: string[];
  if (completed) {
    newSteps = [...new Set([...currentSteps, stepId])];
  } else {
    newSteps = currentSteps.filter((s: string) => s !== stepId);
  }

  const allCompleted = totalSteps > 0 && newSteps.length >= totalSteps;
  const completedAt = allCompleted ? (current?.completed_at ?? new Date().toISOString()) : null;

  const rows = await sql`
    INSERT INTO routine_completions (user_id, date, routine_type, completed_steps, all_completed, completed_at, updated_at)
    VALUES (${userId}, ${date}, ${routineType}, ${newSteps}, ${allCompleted}, ${completedAt}, NOW())
    ON CONFLICT (user_id, date, routine_type) DO UPDATE
    SET completed_steps = EXCLUDED.completed_steps,
        all_completed = EXCLUDED.all_completed,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW()
    RETURNING *
  `;

  return NextResponse.json(rows[0]);
}
