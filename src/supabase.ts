import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface CCNL {
  id: string;
  code: string;
  name: string;
  sector: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollCodeCategory {
  id: string;
  code: string;
  name: string;
  type: 'competenze' | 'trattenute' | 'contributi' | 'fiscali' | 'ratei' | 'progressivi';
  description: string | null;
  created_at: string;
}

export interface PayrollCode {
  id: string;
  code: string;
  name: string;
  category_id: string | null;
  calculation_base: string | null;
  unit: 'ORE' | 'GG' | '%' | 'EURO' | 'SETTIMANE' | null;
  affects_gross: boolean;
  affects_net: boolean;
  affects_tfr: boolean;
  is_deduction: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContributionType {
  id: string;
  code: string;
  name: string;
  entity: string;
  rate_employee: number | null;
  rate_employer: number | null;
  calculation_base: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayrollCodeWithCategory extends PayrollCode {
  category?: PayrollCodeCategory;
}
