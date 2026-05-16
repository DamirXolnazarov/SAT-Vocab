-- ═══════════════════════════════════════════════════════════════════════════════
-- VOCABSAT DATABASE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users table (extended profile) ────────────────────────────────────────────
-- Extended by Supabase Auth, this table stores additional user data
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_emoji text DEFAULT '🦁',
  level text CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  daily_goal integer DEFAULT 10,
  xp integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ─── Units (Sessions) ─────────────────────────────────────────────────────────
-- Pre-created curriculum units (138 units for 1,380 words at 10 words/unit)
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_number integer UNIQUE NOT NULL, -- 1-138
  is_story_session boolean DEFAULT false, -- Every 5th is story
  is_test_session boolean DEFAULT false, -- Sessions 15, 30, 45, etc.
  unit_type text DEFAULT 'lesson', -- 'lesson', 'story', 'test'
  theme text, -- e.g., "Success & Ambition", "Skepticism & Doubt"
  description text,
  word_count integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── Words (Curriculum) ───────────────────────────────────────────────────────
-- Master word list for SAT prep
CREATE TABLE IF NOT EXISTS curriculum_words (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  word text NOT NULL,
  pronunciation text,
  part_of_speech text,
  definition text NOT NULL,
  example text,
  mnemonic text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  position_in_unit integer, -- Order within unit (1-10)
  created_at timestamp with time zone DEFAULT now()
);

-- ─── User Progress (Unit Completion) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  state text DEFAULT 'locked', -- 'locked', 'active', 'completed'
  xp_earned integer DEFAULT 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  attempts integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, unit_id)
);

-- ─── User's Personal Word Bank ────────────────────────────────────────────────
-- Words users add themselves (to be included in story mode & tests)
CREATE TABLE IF NOT EXISTS user_words (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word text NOT NULL,
  pronunciation text,
  part_of_speech text,
  definition text,
  example text,
  mnemonic text,
  target_unit_id uuid REFERENCES units(id) ON DELETE SET NULL, -- Which session to add this to (default next)
  mastery_score integer DEFAULT 0,
  state text DEFAULT 'new', -- 'new', 'learning', 'struggling', 'mastered'
  times_seen integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  last_reviewed_at timestamp with time zone,
  next_review_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, word)
);

-- ─── Story Mode Sessions (every 5th unit) ─────────────────────────────────────
-- Each story incorporates curriculum words + user's custom words
CREATE TABLE IF NOT EXISTS story_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  story_text text NOT NULL,
  story_title text,
  narrative_theme text,
  difficulty text DEFAULT 'medium',
  word_count_in_story integer,
  created_at timestamp with time zone DEFAULT now()
);

-- ─── Comprehensive Tests (sessions 15, 30, 45, etc.) ──────────────────────────
CREATE TABLE IF NOT EXISTS comprehensive_tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  test_number integer, -- Which test (1st, 2nd, 3rd, etc.)
  total_questions integer,
  time_limit_minutes integer DEFAULT 30,
  passing_score integer DEFAULT 70,
  question_types text[], -- ['definition', 'usage', 'synonym', 'fill_blank']
  covers_unit_range text, -- e.g., "Units 1-15"
  created_at timestamp with time zone DEFAULT now()
);

-- ─── Test Results ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES comprehensive_tests(id) ON DELETE CASCADE,
  score integer,
  percentage integer,
  time_taken_minutes integer,
  passed boolean,
  answered_at timestamp with time zone DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_units_unit_number ON units(unit_number);
CREATE INDEX idx_curriculum_words_unit_id ON curriculum_words(unit_id);
CREATE INDEX idx_user_units_user_id ON user_units(user_id);
CREATE INDEX idx_user_units_state ON user_units(state);
CREATE INDEX idx_user_words_user_id ON user_words(user_id);
CREATE INDEX idx_user_words_state ON user_words(state);
CREATE INDEX idx_story_sessions_unit_id ON story_sessions(unit_id);
CREATE INDEX idx_comprehensive_tests_unit_id ON comprehensive_tests(unit_id);
CREATE INDEX idx_test_results_user_id ON test_results(user_id);

-- ─── Seed Units (1-138 sessions) ───────────────────────────────────────────────
-- This creates basic unit structure; adjust themes as needed
INSERT INTO units (unit_number, is_story_session, is_test_session, unit_type, theme)
SELECT
  num,
  (num % 5 = 0) as is_story_session,
  (num IN (15, 30, 45, 60, 75, 90, 105, 120, 135)) as is_test_session,
  CASE 
    WHEN num % 5 = 0 THEN 'story'
    WHEN num IN (15, 30, 45, 60, 75, 90, 105, 120, 135) THEN 'test'
    ELSE 'lesson'
  END,
  'Unit ' || num::text
FROM GENERATE_SERIES(1, 138) num
WHERE NOT EXISTS (SELECT 1 FROM units WHERE unit_number = num);
