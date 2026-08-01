-- ============================================================
-- BMC Website — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ── 0. difficulty_levels ────────────────────────────────────
-- Lookup table: integer id → display label + default points

CREATE TABLE IF NOT EXISTS difficulty_levels (
  id     INT  PRIMARY KEY,
  label  TEXT NOT NULL,
  points INT  NOT NULL DEFAULT 3
);

ALTER TABLE difficulty_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read difficulty_levels"
  ON difficulty_levels FOR SELECT
  USING (true);

INSERT INTO difficulty_levels (id, label, points) VALUES
  (1, 'Easy',   3),
  (2, 'Medium', 5),
  (3, 'Hard',   8)
ON CONFLICT (id) DO NOTHING;


-- ── 1. problems ─────────────────────────────────────────────
-- Each row represents one difficulty tier of one cycle.
-- cycle_number groups the three tiers together.

CREATE TABLE IF NOT EXISTS problems (
  id                   BIGSERIAL    PRIMARY KEY,
  cycle_number         INT          NOT NULL,
  difficulty_level_id  INT          NOT NULL REFERENCES difficulty_levels(id),
  title                TEXT         NOT NULL,
  latex                TEXT         NOT NULL,
  solution             TEXT,
  start_date           TIMESTAMPTZ,
  end_date             TIMESTAMPTZ,
  is_active            BOOLEAN      NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read problems"
  ON problems FOR SELECT
  USING (true);

-- Insert seed data for Cycle 1
INSERT INTO problems (cycle_number, difficulty_level_id, title, latex, is_active)
VALUES
  (1, 1, '等差數列求和',
   '計算 $1 + 2 + 3 + \cdots + 100$ 的和。',
   true),
  (1, 2, '證明 √2 為無理數',
   '證明$\sqrt{2}$是無理數。',
   true),
  (1, 3, '立方和公式',
   '對於任意正整數 $n$，證明：$\sum_{k=1}^{n} k^3 = \left( \frac{n(n+1)}{2} \right)^2$',
   true);


-- ── 2. submissions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS submissions (
  id             BIGSERIAL    PRIMARY KEY,
  problem_id     BIGINT       REFERENCES problems(id) ON DELETE CASCADE,
  student_name   TEXT         NOT NULL,
  is_anonymous   BOOLEAN      NOT NULL DEFAULT false,
  answer         TEXT         NOT NULL,
  is_correct     BOOLEAN,
  score          INT          NOT NULL DEFAULT 0,
  submitted_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read submissions"
  ON submissions FOR SELECT
  USING (true);


-- ── 3. speed_records ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS speed_records (
  id             BIGSERIAL    PRIMARY KEY,
  student_name   TEXT         NOT NULL,
  score          INT          NOT NULL,
  correct_count  INT          NOT NULL DEFAULT 0,
  total_count    INT          NOT NULL DEFAULT 0,
  time_seconds   INT          NOT NULL,
  mode           TEXT         NOT NULL DEFAULT 'solo',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE speed_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert speed_records"
  ON speed_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read speed_records"
  ON speed_records FOR SELECT
  USING (true);


-- ============================================================
-- Migration for existing databases
-- ============================================================
-- If you already have the old schema (problems.level TEXT, problems.label TEXT),
-- run this section SEPARATELY (not together with the CREATE TABLE above):

/*
-- Step 1: create the lookup table
CREATE TABLE difficulty_levels (
  id     INT  PRIMARY KEY,
  label  TEXT NOT NULL,
  points INT  NOT NULL DEFAULT 3
);

ALTER TABLE difficulty_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read difficulty_levels"
  ON difficulty_levels FOR SELECT
  USING (true);

INSERT INTO difficulty_levels (id, label, points) VALUES
  (1, 'Easy',   3),
  (2, 'Medium', 5),
  (3, 'Hard',   8);

-- Step 2: add the new FK column (nullable first)
ALTER TABLE problems ADD COLUMN difficulty_level_id INT;

-- Step 3: map old TEXT values to new INT ids
UPDATE problems SET difficulty_level_id = CASE level
  WHEN 'easy'   THEN 1
  WHEN 'medium' THEN 2
  WHEN 'hard'   THEN 3
END;

-- Step 4: make NOT NULL + add FK
ALTER TABLE problems ALTER COLUMN difficulty_level_id SET NOT NULL;
ALTER TABLE problems ADD CONSTRAINT problems_level_fk
  FOREIGN KEY (difficulty_level_id) REFERENCES difficulty_levels(id);

-- Step 5: drop old columns
ALTER TABLE problems DROP COLUMN level;
ALTER TABLE problems DROP COLUMN label;
*/


-- ============================================================
-- Migration: add solution column
-- ============================================================
-- Run this to add the official-solution field to an existing DB:

/*
ALTER TABLE problems ADD COLUMN IF NOT EXISTS solution TEXT;

-- Example: fill in solution for 立方和公式 (cycle 1, hard)
UPDATE problems SET solution = '證明：令 $S = \sum_{k=1}^{n} k^3$。已知 $\sum_{k=1}^{n} k = \frac{n(n+1)}{2}$。

$$
\begin{align}
n^4 - (n-1)^4 &= 4n^3 - 6n^2 + 4n - 1 \\
(n-1)^4 - (n-2)^4 &= 4(n-1)^3 - 6(n-1)^2 + 4(n-1) - 1 \\
&\;\vdots \\
2^4 - 1^4 &= 4 \cdot 2^3 - 6 \cdot 2^2 + 4 \cdot 2 - 1 \\
1^4 - 0^4 &= 4 \cdot 1^3 - 6 \cdot 1^2 + 4 \cdot 1 - 1
\end{align}
$$

累加得 $n^4 = 4S - 6\sum k^2 + 4\sum k - n$，整理後即得 $S = \left(\frac{n(n+1)}{2}\right)^2$。'
WHERE title = '立方和公式';

-- Then mark it as past problem
UPDATE problems SET is_active = false WHERE title = '立方和公式';
*/


-- ============================================================
-- Migration: remove points column from problems
-- ============================================================
-- Points are now managed exclusively in difficulty_levels.
-- Run this to clean up an existing DB:

/*
ALTER TABLE problems DROP COLUMN IF EXISTS points;
*/

