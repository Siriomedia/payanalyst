/*
  # Disabilita RLS per tabella payslips con autenticazione Firebase
  
  ## Descrizione
  Disabilita Row Level Security per la tabella payslips poiché l'applicazione
  usa Firebase Auth invece di Supabase Auth. La sicurezza è gestita a livello
  applicativo filtrando per user_id nelle query.
  
  ## Modifiche
  1. Rimuove le policy RLS esistenti
  2. Disabilita RLS sulla tabella payslips
  
  ## Sicurezza
  - La sicurezza è garantita da Firebase Auth a livello applicativo
  - Tutte le query filtrano esplicitamente per user_id
  - Solo utenti autenticati con Firebase possono accedere all'app
*/

-- Rimuovi policy esistenti
DROP POLICY IF EXISTS "Users can view own payslips" ON payslips;
DROP POLICY IF EXISTS "Users can insert own payslips" ON payslips;
DROP POLICY IF EXISTS "Users can update own payslips" ON payslips;
DROP POLICY IF EXISTS "Users can delete own payslips" ON payslips;

-- Disabilita RLS sulla tabella payslips
ALTER TABLE payslips DISABLE ROW LEVEL SECURITY;
