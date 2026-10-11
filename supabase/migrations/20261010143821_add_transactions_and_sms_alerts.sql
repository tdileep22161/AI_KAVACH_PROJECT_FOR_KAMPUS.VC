/*
# Add transactions and sms_alerts tables

## Purpose
AI KAVASH needs to track money transactions for the company and send SMS security
alerts to employees. The manager can add, view, and manage financial transactions
and trigger SMS alerts to employees about security threats.

## New Tables

### transactions
- id (uuid, PK)
- user_id (uuid, FK to auth.users, defaults to auth.uid())
- title (text) - transaction description
- amount (numeric) - transaction amount
- type (text) - income or expense
- category (text) - salary, equipment, security, other
- status (text) - pending, completed, failed
- recipient (text, nullable) - who received/sent money
- notes (text, nullable) - additional notes
- created_at (timestamptz)

### sms_alerts
- id (uuid, PK)
- user_id (uuid, FK to auth.users, defaults to auth.uid())
- employee_name (text) - employee being alerted
- phone (text) - phone number
- message (text) - alert content
- alert_type (text) - threat, transaction, login, custom
- status (text) - sent, pending, failed
- created_at (timestamptz)

## Security
- RLS enabled on both tables.
- Owner-scoped CRUD with 4 policies each.
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'expense',
  category text NOT NULL DEFAULT 'other',
  status text NOT NULL DEFAULT 'completed',
  recipient text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS sms_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  phone text NOT NULL,
  message text NOT NULL,
  alert_type text NOT NULL DEFAULT 'custom',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sms_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sms_alerts" ON sms_alerts;
CREATE POLICY "select_own_sms_alerts" ON sms_alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sms_alerts" ON sms_alerts;
CREATE POLICY "insert_own_sms_alerts" ON sms_alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sms_alerts" ON sms_alerts;
CREATE POLICY "update_own_sms_alerts" ON sms_alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sms_alerts" ON sms_alerts;
CREATE POLICY "delete_own_sms_alerts" ON sms_alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_alerts_user_id ON sms_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_alerts_created_at ON sms_alerts(created_at DESC);
