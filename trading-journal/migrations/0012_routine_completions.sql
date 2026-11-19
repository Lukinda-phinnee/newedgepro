-- Tracks daily routine completion per user
CREATE TABLE IF NOT EXISTS routine_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,                        -- trading date (YYYY-MM-DD)
  routine_type TEXT NOT NULL DEFAULT 'premarket', -- 'premarket' | 'intraday' | 'postmarket'
  completed_steps TEXT[] NOT NULL DEFAULT '{}',  -- array of completed step ids
  all_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,                  -- when fully completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT routine_completions_user_date_type_key UNIQUE (user_id, date, routine_type)
);
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date ON routine_completions (user_id, date);
