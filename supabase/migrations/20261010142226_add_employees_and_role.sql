/*
# Add employees table and role column to company_profiles

## Purpose
AI KAVASH needs to track company employees by name. Only the company manager
(the account owner who signed up) can add and remove employees. The manager's
role is stored as 'manager' on company_profiles. Each employee record stores
a name and belongs to the manager's company (via user_id).

## Changes

### company_profiles — add column
- `role` (text, default 'manager') — identifies the account holder as the company manager.
  Currently all accounts are managers; this column supports future employee login roles.

### New table: employees
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users, defaults to auth.uid()) — the manager who owns this employee record
- `name` (text) — employee's full name
- `email` (text, nullable) — employee's email (optional)
- `position` (text, nullable) — employee's job title (optional)
- `created_at` (timestamptz)

## Security
- RLS enabled on employees.
- Owner-scoped CRUD: only the manager (auth.uid() = user_id) can see, add, edit, or remove their employees.
- 4 separate policies (select/insert/update/delete).
- company_profiles role column: only the owner can read/update their own profile (existing policies already cover this).
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'company_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE company_profiles ADD COLUMN role text NOT NULL DEFAULT 'manager';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  position text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_employees" ON employees;
CREATE POLICY "select_own_employees" ON employees FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_employees" ON employees;
CREATE POLICY "insert_own_employees" ON employees FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_employees" ON employees;
CREATE POLICY "update_own_employees" ON employees FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_employees" ON employees;
CREATE POLICY "delete_own_employees" ON employees FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
