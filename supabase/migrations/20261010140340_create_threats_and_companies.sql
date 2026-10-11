/*
# Create threats, company_profiles, and blocked_items tables

## Purpose
SentinelAI is a security platform where companies can report, analyze, and block
fake/malicious links, messages, posters, and any other fake content. The app
requires authentication — each company signs in and manages their own threat reports.

## New Tables

### company_profiles
- `id` (uuid, PK) — mirrors the auth user id
- `company_name` (text) — the company's display name
- `industry` (text) — industry sector
- `website` (text) — company website URL
- `created_at` (timestamptz)

### threats
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, defaults to auth.uid())
- `title` (text) — short title for the threat
- `content_type` (text) — link, message, poster, email, other
- `content_value` (text) — the actual URL, message text, or description
- `threat_level` (text) — safe, suspicious, malicious
- `status` (text) — pending, investigating, blocked, resolved
- `source` (text) — where it was found (email, social, web, sms, other)
- `description` (text) — additional details
- `ai_analysis` (text) — AI-generated risk analysis
- `risk_score` (int, 0–100) — AI-assigned risk score
- `created_at` (timestamptz)

### blocked_items
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, defaults to auth.uid())
- `content_value` (text) — the blocked URL/content identifier
- `content_type` (text) — link, message, poster, email, other
- `threat_id` (uuid, FK → threats, nullable)
- `blocked_at` (timestamptz)

## Security
- RLS enabled on all tables.
- company_profiles: owner-scoped (auth.uid() = id).
- threats: owner-scoped (auth.uid() = user_id), with DEFAULT auth.uid() on user_id.
- blocked_items: owner-scoped (auth.uid() = user_id), with DEFAULT auth.uid() on user_id.
- 4 separate policies per table (select/insert/update/delete).
*/

CREATE TABLE IF NOT EXISTS company_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON company_profiles;
CREATE POLICY "select_own_profile" ON company_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON company_profiles;
CREATE POLICY "insert_own_profile" ON company_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON company_profiles;
CREATE POLICY "update_own_profile" ON company_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON company_profiles;
CREATE POLICY "delete_own_profile" ON company_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS threats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'link',
  content_value text NOT NULL DEFAULT '',
  threat_level text NOT NULL DEFAULT 'suspicious',
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'other',
  description text NOT NULL DEFAULT '',
  ai_analysis text,
  risk_score int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE threats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_threats" ON threats;
CREATE POLICY "select_own_threats" ON threats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_threats" ON threats;
CREATE POLICY "insert_own_threats" ON threats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_threats" ON threats;
CREATE POLICY "update_own_threats" ON threats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_threats" ON threats;
CREATE POLICY "delete_own_threats" ON threats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS blocked_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content_value text NOT NULL,
  content_type text NOT NULL DEFAULT 'link',
  threat_id uuid REFERENCES threats(id) ON DELETE SET NULL,
  blocked_at timestamptz DEFAULT now()
);

ALTER TABLE blocked_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_blocked" ON blocked_items;
CREATE POLICY "select_own_blocked" ON blocked_items FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_blocked" ON blocked_items;
CREATE POLICY "insert_own_blocked" ON blocked_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_blocked" ON blocked_items;
CREATE POLICY "update_own_blocked" ON blocked_items FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_blocked" ON blocked_items;
CREATE POLICY "delete_own_blocked" ON blocked_items FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_threats_user_id ON threats(user_id);
CREATE INDEX IF NOT EXISTS idx_threats_status ON threats(status);
CREATE INDEX IF NOT EXISTS idx_threats_created_at ON threats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_items_user_id ON blocked_items(user_id);
