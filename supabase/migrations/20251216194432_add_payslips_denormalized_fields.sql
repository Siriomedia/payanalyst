/*
  # Aggiungi campi denormalizzati alla tabella payslips

  ## Descrizione
  Aggiunge campi denormalizzati per facilitare query e export CSV.
  Mantiene compatibilita con i dati esistenti.

  ## Modifiche
  1. Aggiunge colonne per dati frequentemente interrogati:
     - employee_first_name, employee_last_name
     - company_name
     - net_salary, gross_salary, total_deductions
  2. Rinomina month -> period_month e year -> period_year per coerenza

  ## Note
  - I valori di default permettono la compatibilita con record esistenti
  - Il campo data (jsonb) rimane la fonte principale dei dati completi
*/

-- Rinomina colonne esistenti
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'month') THEN
    ALTER TABLE payslips RENAME COLUMN month TO period_month;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'year') THEN
    ALTER TABLE payslips RENAME COLUMN year TO period_year;
  END IF;
END $$;

-- Aggiungi colonne denormalizzate se non esistono
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'employee_first_name') THEN
    ALTER TABLE payslips ADD COLUMN employee_first_name text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'employee_last_name') THEN
    ALTER TABLE payslips ADD COLUMN employee_last_name text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'company_name') THEN
    ALTER TABLE payslips ADD COLUMN company_name text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'net_salary') THEN
    ALTER TABLE payslips ADD COLUMN net_salary decimal(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'gross_salary') THEN
    ALTER TABLE payslips ADD COLUMN gross_salary decimal(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payslips' AND column_name = 'total_deductions') THEN
    ALTER TABLE payslips ADD COLUMN total_deductions decimal(10,2) DEFAULT 0;
  END IF;
END $$;

-- Aggiungi indici se non esistono
CREATE INDEX IF NOT EXISTS idx_payslips_user_id ON payslips(user_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period ON payslips(period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_payslips_user_period ON payslips(user_id, period_year DESC, period_month DESC);
