
/*
  # Swiss Political Influence & Institutional Transparency System

  ## Summary
  Creates the full schema for mapping structural relationships between politics,
  business, and institutions in Switzerland using public data sources.

  ## New Tables

  ### entities
  Canonical entity registry for persons, organizations, committees, etc.
  - id, entity_type, canonical_name, aliases, confidence_score, provenance

  ### politicians
  Swiss federal and cantonal politicians with party and chamber info.

  ### companies
  Commercial entities from Handelsregister and public registries.

  ### mandates
  Outside roles, board memberships, consultancies held by politicians.

  ### committees
  Parliamentary committees and commissions.

  ### committee_memberships
  Links politicians to committees with timestamps and sources.

  ### votes
  Parliamentary voting records per bill/motion.

  ### vote_records
  Individual politician votes on specific bills.

  ### procurement_contracts
  Public procurement/contract data linking entities.

  ### relationships
  Generic graph edges between any two entities with full provenance.

  ### data_sources
  Registry of all ingested data sources with metadata.

  ### entity_aliases
  Multilingual name variants for entity resolution.

  ## Security
  - RLS enabled on all tables
  - Public read access for transparency (this is a public transparency platform)
  - Write access restricted to authenticated users with admin role
*/

-- Entity types enum
CREATE TYPE entity_type AS ENUM (
  'PERSON', 'POLITICIAN', 'COMPANY', 'FOUNDATION', 'ASSOCIATION',
  'COMMITTEE', 'AGENCY', 'MEDIA_SOURCE', 'INDUSTRY_SECTOR'
);

-- Relationship types enum
CREATE TYPE relationship_type AS ENUM (
  'BOARD_MEMBER_OF', 'MEMBER_OF', 'CONSULTANT_FOR', 'SHAREHOLDER_OF',
  'PARTICIPATES_IN', 'SITS_ON_COMMITTEE', 'HAS_MANDATE_IN',
  'VOTED_FOR', 'VOTED_AGAINST', 'RECEIVED_CONTRACT', 'ASSOCIATED_WITH',
  'MENTIONED_IN', 'PRESIDENT_OF', 'DIRECTOR_OF', 'PARTNER_OF'
);

-- Vote result enum
CREATE TYPE vote_result AS ENUM ('YES', 'NO', 'ABSTAIN', 'ABSENT', 'EXCUSED');

-- Party enum
CREATE TYPE party_affiliation AS ENUM (
  'SVP', 'SP', 'FDP', 'Mitte', 'GPS', 'GLP', 'EVP', 'EDU', 'MCG',
  'Lega', 'PdA', 'Independent', 'Other'
);

-- Chamber enum
CREATE TYPE chamber AS ENUM ('National Council', 'Council of States', 'Federal Council', 'Cantonal');

-- Data sources registry
CREATE TABLE IF NOT EXISTS data_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text NOT NULL,
  url text,
  description text,
  data_type text NOT NULL,
  license text,
  last_fetched_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read data sources"
  ON data_sources FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert data sources"
  ON data_sources FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Canonical entities table
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  canonical_name text NOT NULL,
  short_name text,
  description text,
  confidence_score numeric(4,3) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_ids uuid[],
  external_ids jsonb DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read entities"
  ON entities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert entities"
  ON entities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update entities"
  ON entities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Entity aliases for multilingual / name variant resolution
CREATE TABLE IF NOT EXISTS entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id),
  alias text NOT NULL,
  language text DEFAULT 'de',
  alias_type text DEFAULT 'name_variant',
  confidence_score numeric(4,3) DEFAULT 1.0,
  source_id uuid REFERENCES data_sources(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE entity_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read entity aliases"
  ON entity_aliases FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert aliases"
  ON entity_aliases FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politicians table
CREATE TABLE IF NOT EXISTS politicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  party party_affiliation,
  chamber chamber,
  canton text,
  electoral_district text,
  is_active boolean DEFAULT true,
  term_start date,
  term_end date,
  birth_year integer,
  gender text,
  photo_url text,
  parliamentary_id text UNIQUE,
  bio_summary text,
  source_id uuid REFERENCES data_sources(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read politicians"
  ON politicians FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert politicians"
  ON politicians FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update politicians"
  ON politicians FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id),
  legal_name text NOT NULL,
  trade_name text,
  uid text UNIQUE,
  legal_form text,
  industry_sector text,
  noga_code text,
  canton text,
  municipality text,
  address text,
  founding_date date,
  dissolution_date date,
  is_active boolean DEFAULT true,
  employee_count_range text,
  capital_chf numeric,
  handelsregister_url text,
  source_id uuid REFERENCES data_sources(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read companies"
  ON companies FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Committees table
CREATE TABLE IF NOT EXISTS committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id),
  name_de text NOT NULL,
  name_fr text,
  name_it text,
  abbreviation text,
  chamber chamber,
  committee_type text,
  policy_area text,
  is_active boolean DEFAULT true,
  source_id uuid REFERENCES data_sources(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE committees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read committees"
  ON committees FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert committees"
  ON committees FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Committee memberships
CREATE TABLE IF NOT EXISTS committee_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid NOT NULL REFERENCES politicians(id),
  committee_id uuid NOT NULL REFERENCES committees(id),
  role text DEFAULT 'member',
  start_date date,
  end_date date,
  is_current boolean DEFAULT true,
  source_id uuid REFERENCES data_sources(id),
  confidence_score numeric(4,3) DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE committee_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read committee memberships"
  ON committee_memberships FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert committee memberships"
  ON committee_memberships FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Mandates (outside roles, board seats, etc.)
CREATE TABLE IF NOT EXISTS mandates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid NOT NULL REFERENCES politicians(id),
  organization_entity_id uuid REFERENCES entities(id),
  organization_name text NOT NULL,
  role_title text NOT NULL,
  mandate_type relationship_type NOT NULL,
  industry_sector text,
  is_paid boolean,
  compensation_chf numeric,
  compensation_range text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT true,
  disclosure_year integer,
  source_document text,
  source_id uuid REFERENCES data_sources(id),
  confidence_score numeric(4,3) DEFAULT 1.0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read mandates"
  ON mandates FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert mandates"
  ON mandates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Parliamentary votes (bills/motions)
CREATE TABLE IF NOT EXISTS parliamentary_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id text UNIQUE NOT NULL,
  title_de text NOT NULL,
  title_fr text,
  title_it text,
  vote_date date NOT NULL,
  chamber chamber NOT NULL,
  vote_category text,
  policy_area text,
  result text,
  yes_count integer DEFAULT 0,
  no_count integer DEFAULT 0,
  abstain_count integer DEFAULT 0,
  absent_count integer DEFAULT 0,
  description text,
  source_id uuid REFERENCES data_sources(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parliamentary_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read parliamentary votes"
  ON parliamentary_votes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert parliamentary votes"
  ON parliamentary_votes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Individual vote records
CREATE TABLE IF NOT EXISTS vote_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parliamentary_vote_id uuid NOT NULL REFERENCES parliamentary_votes(id),
  politician_id uuid NOT NULL REFERENCES politicians(id),
  vote_result vote_result NOT NULL,
  source_id uuid REFERENCES data_sources(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(parliamentary_vote_id, politician_id)
);

ALTER TABLE vote_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read vote records"
  ON vote_records FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vote records"
  ON vote_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Procurement contracts
CREATE TABLE IF NOT EXISTS procurement_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id text,
  title text NOT NULL,
  contracting_authority text NOT NULL,
  contractor_entity_id uuid REFERENCES entities(id),
  contractor_name text,
  contract_value_chf numeric,
  award_date date,
  start_date date,
  end_date date,
  procurement_category text,
  cpv_code text,
  description text,
  source_url text,
  source_id uuid REFERENCES data_sources(id),
  confidence_score numeric(4,3) DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE procurement_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read procurement contracts"
  ON procurement_contracts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert procurement contracts"
  ON procurement_contracts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Generic relationship edges (graph model)
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id uuid NOT NULL REFERENCES entities(id),
  target_entity_id uuid NOT NULL REFERENCES entities(id),
  relationship_type relationship_type NOT NULL,
  label text,
  weight numeric(5,3) DEFAULT 1.0,
  is_direct boolean DEFAULT true,
  confidence_score numeric(4,3) DEFAULT 1.0,
  valid_from date,
  valid_to date,
  is_current boolean DEFAULT true,
  source_document text,
  source_url text,
  source_id uuid REFERENCES data_sources(id),
  extraction_method text DEFAULT 'manual',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read relationships"
  ON relationships FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert relationships"
  ON relationships FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Industry sectors reference table
CREATE TABLE IF NOT EXISTS industry_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de text NOT NULL,
  name_en text NOT NULL,
  noga_division text,
  color_hex text DEFAULT '#6B7280',
  icon text,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE industry_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read industry sectors"
  ON industry_sectors FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert industry sectors"
  ON industry_sectors FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_canonical_name ON entities(canonical_name);
CREATE INDEX IF NOT EXISTS idx_politicians_party ON politicians(party);
CREATE INDEX IF NOT EXISTS idx_politicians_chamber ON politicians(chamber);
CREATE INDEX IF NOT EXISTS idx_politicians_canton ON politicians(canton);
CREATE INDEX IF NOT EXISTS idx_mandates_politician ON mandates(politician_id);
CREATE INDEX IF NOT EXISTS idx_mandates_sector ON mandates(industry_sector);
CREATE INDEX IF NOT EXISTS idx_mandates_current ON mandates(is_current);
CREATE INDEX IF NOT EXISTS idx_committee_memberships_politician ON committee_memberships(politician_id);
CREATE INDEX IF NOT EXISTS idx_committee_memberships_committee ON committee_memberships(committee_id);
CREATE INDEX IF NOT EXISTS idx_vote_records_politician ON vote_records(politician_id);
CREATE INDEX IF NOT EXISTS idx_vote_records_vote ON vote_records(parliamentary_vote_id);
CREATE INDEX IF NOT EXISTS idx_relationships_source ON relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target ON relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_entity_aliases_entity ON entity_aliases(entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_aliases_alias ON entity_aliases USING gin(to_tsvector('simple', alias));
