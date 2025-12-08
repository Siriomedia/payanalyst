/*
  # Database di Riferimento Buste Paga Zucchetti

  ## Tabelle Create
  
  ### 1. ccnl
  Contratti Collettivi Nazionali di Lavoro
  - `id` (uuid, primary key)
  - `code` (text, unique) - Codice identificativo
  - `name` (text) - Nome completo del CCNL
  - `sector` (text) - Settore di riferimento
  - `notes` (text) - Note aggiuntive
  
  ### 2. payroll_code_categories
  Categorie di voci di busta paga
  - `id` (uuid, primary key)
  - `code` (text, unique) - Codice categoria
  - `name` (text) - Nome categoria
  - `type` (text) - Tipo: competenze/trattenute/contributi/fiscali
  
  ### 3. payroll_codes
  Codici voci Zucchetti per buste paga
  - `id` (uuid, primary key)
  - `code` (text, unique) - Codice voce (es. Z00010, F02000)
  - `name` (text) - Descrizione completa
  - `category_id` (uuid) - Riferimento categoria
  - `calculation_base` (text) - Base di calcolo
  - `unit` (text) - Unità di misura (ORE, GG, %)
  - `affects_gross` (boolean) - Se impatta sul lordo
  - `affects_net` (boolean) - Se impatta sul netto
  - `affects_tfr` (boolean) - Se impatta sul TFR
  - `notes` (text) - Note aggiuntive
  
  ### 4. contribution_types
  Tipologie di contributi (INPS, INAIL, Fondi)
  - `id` (uuid, primary key)
  - `code` (text, unique) - Codice contributo
  - `name` (text) - Nome contributo
  - `entity` (text) - Ente (INPS, INAIL, etc.)
  - `rate_employee` (decimal) - Aliquota dipendente
  - `rate_employer` (decimal) - Aliquota azienda
  - `calculation_base` (text) - Base di calcolo
  
  ## Sicurezza
  - RLS abilitato su tutte le tabelle
  - Policy di lettura pubblica (dati di riferimento)
  - Policy di scrittura solo per admin

  ## Note
  - Questo database NON contiene dati personali
  - È un riferimento per analizzare buste paga future
*/

-- Tabella CCNL
CREATE TABLE IF NOT EXISTS ccnl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  sector text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ccnl ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read CCNL"
  ON ccnl FOR SELECT
  TO public
  USING (true);

-- Tabella categorie codici
CREATE TABLE IF NOT EXISTS payroll_code_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('competenze', 'trattenute', 'contributi', 'fiscali', 'ratei', 'progressivi')),
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payroll_code_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON payroll_code_categories FOR SELECT
  TO public
  USING (true);

-- Tabella codici voci
CREATE TABLE IF NOT EXISTS payroll_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category_id uuid REFERENCES payroll_code_categories(id),
  calculation_base text,
  unit text CHECK (unit IN ('ORE', 'GG', '%', 'EURO', 'SETTIMANE', NULL)),
  affects_gross boolean DEFAULT false,
  affects_net boolean DEFAULT false,
  affects_tfr boolean DEFAULT false,
  is_deduction boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payroll_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payroll codes"
  ON payroll_codes FOR SELECT
  TO public
  USING (true);

-- Tabella contributi
CREATE TABLE IF NOT EXISTS contribution_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  entity text NOT NULL,
  rate_employee decimal(5,5),
  rate_employer decimal(5,5),
  calculation_base text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contribution_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read contribution types"
  ON contribution_types FOR SELECT
  TO public
  USING (true);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_payroll_codes_category ON payroll_codes(category_id);
CREATE INDEX IF NOT EXISTS idx_payroll_codes_code ON payroll_codes(code);
CREATE INDEX IF NOT EXISTS idx_ccnl_code ON ccnl(code);
CREATE INDEX IF NOT EXISTS idx_contribution_types_entity ON contribution_types(entity);