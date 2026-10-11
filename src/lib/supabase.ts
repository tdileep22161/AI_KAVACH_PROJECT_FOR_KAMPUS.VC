import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type ThreatLevel = 'safe' | 'suspicious' | 'malicious';
export type ThreatStatus = 'pending' | 'investigating' | 'blocked' | 'resolved';
export type ContentType = 'link' | 'message' | 'poster' | 'email' | 'other';
export type ThreatSource = 'email' | 'social' | 'web' | 'sms' | 'other';

export interface Threat {
  id: string;
  user_id: string;
  title: string;
  content_type: ContentType;
  content_value: string;
  threat_level: ThreatLevel;
  status: ThreatStatus;
  source: ThreatSource;
  description: string;
  ai_analysis: string | null;
  risk_score: number;
  created_at: string;
}

export interface CompanyProfile {
  id: string;
  company_name: string;
  industry: string;
  website: string;
  role: string;
  created_at: string;
}

export interface Employee {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  position: string | null;
  created_at: string;
}

export interface BlockedItem {
  id: string;
  user_id: string;
  content_value: string;
  content_type: ContentType;
  threat_id: string | null;
  blocked_at: string;
}

export interface ThreatInput {
  title: string;
  content_type: ContentType;
  content_value: string;
  threat_level: ThreatLevel;
  status: ThreatStatus;
  source: ThreatSource;
  description: string;
  ai_analysis?: string | null;
  risk_score?: number;
}

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface Transaction {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  status: TransactionStatus;
  recipient: string | null;
  notes: string | null;
  created_at: string;
}

export type AlertType = 'threat' | 'transaction' | 'login' | 'custom';
export type AlertStatus = 'sent' | 'pending' | 'failed';

export interface SmsAlert {
  id: string;
  user_id: string;
  employee_name: string;
  phone: string;
  message: string;
  alert_type: AlertType;
  status: AlertStatus;
  created_at: string;
}
