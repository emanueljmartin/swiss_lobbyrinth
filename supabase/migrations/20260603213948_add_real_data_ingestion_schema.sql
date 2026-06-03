/*
  # Real Data Ingestion Schema Expansion

  ## Summary
  Adds tables to support ingestion of real Swiss political transparency data from:
  - Parliament.ch OData API (votes, councillors, sessions)
  - Lobbywatch (lobbying mandates, access badges, interest groups)
  - Zefix (company registry enrichment)
  - Data sync tracking and provenance

  ## New Tables

  ### 1. `parliament_members_raw`
  Raw councillor data from ws.parlament.ch/odata.svc/MemberCouncil
  - PersonNumber (official Parliament ID), party, canton, council, active status
  - Used to match/update our politicians table with official IDs

  ### 2. `parliament_votes_raw`
  Raw vote summaries from ws.parlament.ch/odata.svc/Vote
  - Bill title (DE/FR), session, legislative period, registration number
  - Deduplicates on (IdVote, Language='DE')

  ### 3. `parliament_votings_raw`
  Raw individual MP vote records from ws.parlament.ch/odata.svc/Voting
  - PersonNumber, Decision (1=Yes, 2=No, 3=Abstain, 4=Absent, 5=Excused), vote ref
  - Links to parliament_votes_raw via IdVote

  ### 4. `lobbywatch_mandates_raw`
  Raw mandate/Interessenbindung data from Lobbywatch SPARQL endpoint
  - Parlamentarier URI, Organisation URI, role, compensation, sector
  - Source-keyed so incremental updates don't duplicate

  ### 5. `lobbywatch_access_rights_raw`
  Lobbywatch Zutrittsberechtigung (lobby access badge) data
  - Which MP sponsored which lobbyist's parliament access pass
  - Organisation represented by the lobbyist

  ### 6. `zefix_companies_raw`
  Company registry data from Zefix REST API
  - UID, legal form, canton, status, purpose text
  - Linked to organizations table via name matching

  ### 7. `data_sync_log`
  Tracks every ingestion run with status, record counts, errors
  - Enables incremental sync (last_fetched_at per source + entity)
  - Provides provenance UI data

  ### 8. `influence_vote_correlations`
  Pre-computed correlation scores between mandate relationships and voting behaviour
  - politician_id, organization sector, vote policy area, alignment score
  - Refreshed after each vote ingestion run

  ## New Views

  ### `real_data_parliament_votes`
  Joins parliament_votes_raw + parliament_votings_raw + politicians for enriched vote display

  ### `lobbywatch_influence_map`
  Joins lobbywatch_mandates_raw + politicians + organizations for influence mapping

  ### `mandate_vote_alignment`
  Core analytical view: for each politician, cross-references their mandates (sectors)
  with their voting record on related policy areas — the influence-to-vote correlation engine

  ## Security
  - RLS enabled on all tables, public SELECT, no public write
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. parliament_members_raw
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parliament_members_raw (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_number         integer NOT NULL,
  language              text NOT NULL DEFAULT 'DE',
  first_name            text,
  last_name             text,
  gender                text,
  canton_abbreviation   text,
  council_abbreviation  text,
  parl_group_code       text,
  parl_group_name       text,
  party_abbreviation    text,
  party_name            text,
  active                boolean DEFAULT false,
  date_of_birth         timestamptz,
  date_joining          timestamptz,
  date_leaving          timestamptz,
  mandates_text         text,
  raw_json              jsonb,
  fetched_at            timestamptz DEFAULT now(),
  UNIQUE (person_number, language)
);

ALTER TABLE parliament_members_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read parliament_members_raw"
  ON parliament_members_raw FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_pmr_person_number ON parliament_members_raw(person_number);
CREATE INDEX IF NOT EXISTS idx_pmr_party ON parliament_members_raw(party_abbreviation);
CREATE INDEX IF NOT EXISTS idx_pmr_active ON parliament_members_raw(active);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. parliament_votes_raw  (Vote = bill-level summary)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parliament_votes_raw (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_vote                   integer NOT NULL,
  language                  text NOT NULL DEFAULT 'DE',
  registration_number       integer,
  business_number           bigint,
  business_short_number     text,
  business_title            text,
  bill_number               integer,
  bill_title                text,
  id_legislative_period     integer,
  id_session                integer,
  session_name              text,
  subject                   text,
  meaning_yes               text,
  meaning_no                text,
  vote_end                  timestamptz,
  raw_json                  jsonb,
  fetched_at                timestamptz DEFAULT now(),
  UNIQUE (id_vote, language)
);

ALTER TABLE parliament_votes_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read parliament_votes_raw"
  ON parliament_votes_raw FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_pvr_id_vote ON parliament_votes_raw(id_vote);
CREATE INDEX IF NOT EXISTS idx_pvr_legislative_period ON parliament_votes_raw(id_legislative_period);
CREATE INDEX IF NOT EXISTS idx_pvr_vote_end ON parliament_votes_raw(vote_end);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. parliament_votings_raw  (Voting = individual MP vote record)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parliament_votings_raw (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  odata_id                  integer NOT NULL,
  language                  text NOT NULL DEFAULT 'DE',
  id_vote                   integer NOT NULL,
  registration_number       integer,
  person_number             integer NOT NULL,
  first_name                text,
  last_name                 text,
  canton                    text,
  canton_name               text,
  parl_group_code           text,
  parl_group_name           text,
  decision                  integer,
  decision_text             text,
  business_number           bigint,
  business_title            text,
  bill_title                text,
  id_legislative_period     integer,
  id_session                integer,
  vote_end                  timestamptz,
  raw_json                  jsonb,
  fetched_at                timestamptz DEFAULT now(),
  UNIQUE (odata_id, language)
);

ALTER TABLE parliament_votings_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read parliament_votings_raw"
  ON parliament_votings_raw FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_pvgr_id_vote ON parliament_votings_raw(id_vote);
CREATE INDEX IF NOT EXISTS idx_pvgr_person_number ON parliament_votings_raw(person_number);
CREATE INDEX IF NOT EXISTS idx_pvgr_legislative_period ON parliament_votings_raw(id_legislative_period);
CREATE INDEX IF NOT EXISTS idx_pvgr_decision ON parliament_votings_raw(decision);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. lobbywatch_mandates_raw
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lobbywatch_mandates_raw (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_uri            text NOT NULL UNIQUE,
  parlamentarier_uri    text,
  parlamentarier_name   text,
  organisation_uri      text,
  organisation_name     text,
  role                  text,
  sector                text,
  compensation_chf      numeric,
  is_paid               boolean DEFAULT false,
  start_date            date,
  end_date              date,
  is_current            boolean DEFAULT true,
  parliament_member_id  integer,
  raw_json              jsonb,
  fetched_at            timestamptz DEFAULT now()
);

ALTER TABLE lobbywatch_mandates_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read lobbywatch_mandates_raw"
  ON lobbywatch_mandates_raw FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_lmr_parlamentarier ON lobbywatch_mandates_raw(parlamentarier_uri);
CREATE INDEX IF NOT EXISTS idx_lmr_organisation ON lobbywatch_mandates_raw(organisation_uri);
CREATE INDEX IF NOT EXISTS idx_lmr_sector ON lobbywatch_mandates_raw(sector);
CREATE INDEX IF NOT EXISTS idx_lmr_member_id ON lobbywatch_mandates_raw(parliament_member_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. lobbywatch_access_rights_raw  (Zutrittsberechtigung)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lobbywatch_access_rights_raw (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_uri            text NOT NULL UNIQUE,
  lobbyist_uri          text,
  lobbyist_name         text,
  sponsor_uri           text,
  sponsor_name          text,
  organisation_uri      text,
  organisation_name     text,
  valid_from            date,
  valid_to              date,
  is_current            boolean DEFAULT true,
  raw_json              jsonb,
  fetched_at            timestamptz DEFAULT now()
);

ALTER TABLE lobbywatch_access_rights_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read lobbywatch_access_rights_raw"
  ON lobbywatch_access_rights_raw FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_lar_sponsor ON lobbywatch_access_rights_raw(sponsor_uri);
CREATE INDEX IF NOT EXISTS idx_lar_organisation ON lobbywatch_access_rights_raw(organisation_uri);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. zefix_companies_raw
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zefix_companies_raw (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid                   text NOT NULL UNIQUE,
  name                  text NOT NULL,
  legal_form            text,
  status                text,
  canton                text,
  municipality          text,
  purpose               text,
  capital_chf           numeric,
  registered_at         date,
  cancelled_at          date,
  shab_date             date,
  raw_json              jsonb,
  fetched_at            timestamptz DEFAULT now()
);

ALTER TABLE zefix_companies_raw ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read zefix_companies_raw"
  ON zefix_companies_raw FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_zcr_name ON zefix_companies_raw(name);
CREATE INDEX IF NOT EXISTS idx_zcr_uid ON zefix_companies_raw(uid);
CREATE INDEX IF NOT EXISTS idx_zcr_canton ON zefix_companies_raw(canton);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. data_sync_log
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_sync_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name           text NOT NULL,
  sync_type             text NOT NULL DEFAULT 'full',
  status                text NOT NULL DEFAULT 'running',
  records_fetched       integer DEFAULT 0,
  records_inserted      integer DEFAULT 0,
  records_updated       integer DEFAULT 0,
  records_skipped       integer DEFAULT 0,
  error_message         text,
  metadata              jsonb,
  started_at            timestamptz DEFAULT now(),
  completed_at          timestamptz,
  duration_seconds      numeric GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (completed_at - started_at))
  ) STORED
);

ALTER TABLE data_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read data_sync_log"
  ON data_sync_log FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_dsl_source ON data_sync_log(source_name);
CREATE INDEX IF NOT EXISTS idx_dsl_status ON data_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_dsl_started_at ON data_sync_log(started_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. influence_vote_correlations
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influence_vote_correlations (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id             uuid REFERENCES politicians(id) ON DELETE CASCADE,
  politician_name           text,
  party                     text,
  mandate_sector            text NOT NULL,
  vote_policy_area          text NOT NULL,
  votes_analyzed            integer DEFAULT 0,
  votes_aligned             integer DEFAULT 0,
  alignment_score           numeric(5,4) DEFAULT 0,
  mandate_count             integer DEFAULT 0,
  has_paid_mandate          boolean DEFAULT false,
  total_compensation_chf    numeric DEFAULT 0,
  computed_at               timestamptz DEFAULT now(),
  UNIQUE (politician_id, mandate_sector, vote_policy_area)
);

ALTER TABLE influence_vote_correlations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read influence_vote_correlations"
  ON influence_vote_correlations FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_ivc_politician ON influence_vote_correlations(politician_id);
CREATE INDEX IF NOT EXISTS idx_ivc_sector ON influence_vote_correlations(mandate_sector);
CREATE INDEX IF NOT EXISTS idx_ivc_alignment ON influence_vote_correlations(alignment_score DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. voting_similarity  (MP-to-MP voting alignment pre-computed)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS voting_similarity (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_a_id       uuid REFERENCES politicians(id) ON DELETE CASCADE,
  politician_b_id       uuid REFERENCES politicians(id) ON DELETE CASCADE,
  party_a               text,
  party_b               text,
  votes_compared        integer DEFAULT 0,
  votes_aligned         integer DEFAULT 0,
  similarity_score      numeric(5,4) DEFAULT 0,
  is_cross_party        boolean GENERATED ALWAYS AS (party_a <> party_b) STORED,
  computed_at           timestamptz DEFAULT now(),
  UNIQUE (politician_a_id, politician_b_id)
);

ALTER TABLE voting_similarity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read voting_similarity"
  ON voting_similarity FOR SELECT
  TO public
  USING (true);

CREATE INDEX IF NOT EXISTS idx_vs_politician_a ON voting_similarity(politician_a_id);
CREATE INDEX IF NOT EXISTS idx_vs_similarity ON voting_similarity(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_vs_cross_party ON voting_similarity(is_cross_party) WHERE is_cross_party = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. VIEWS
-- ─────────────────────────────────────────────────────────────────────────────

-- Real parliament vote data enriched with politician matches
CREATE OR REPLACE VIEW parliament_vote_summary AS
SELECT
  v.id_vote,
  v.business_short_number,
  v.business_title,
  v.bill_title,
  v.session_name,
  v.id_legislative_period,
  v.vote_end,
  COUNT(vg.id) FILTER (WHERE vg.decision = 1) AS yes_count,
  COUNT(vg.id) FILTER (WHERE vg.decision = 2) AS no_count,
  COUNT(vg.id) FILTER (WHERE vg.decision = 3) AS abstain_count,
  COUNT(vg.id) FILTER (WHERE vg.decision = 4) AS absent_count,
  COUNT(vg.id) FILTER (WHERE vg.decision = 5) AS excused_count,
  COUNT(vg.id) AS total_votes,
  ROUND(
    COUNT(vg.id) FILTER (WHERE vg.decision = 1) * 100.0
    / NULLIF(COUNT(vg.id) FILTER (WHERE vg.decision IN (1,2)), 0),
    1
  ) AS yes_percentage
FROM parliament_votes_raw v
LEFT JOIN parliament_votings_raw vg ON vg.id_vote = v.id_vote AND vg.language = 'DE'
WHERE v.language = 'DE'
GROUP BY v.id, v.id_vote, v.business_short_number, v.business_title,
         v.bill_title, v.session_name, v.id_legislative_period, v.vote_end;

-- Mandate-to-vote alignment: core influence analysis view
CREATE OR REPLACE VIEW mandate_vote_alignment AS
WITH politician_mandates AS (
  SELECT
    p.id AS politician_id,
    p.full_name,
    p.party,
    m.industry_sector,
    m.is_paid,
    m.compensation_chf,
    COUNT(m.id) AS mandate_count
  FROM politicians p
  JOIN mandates m ON m.politician_id = p.id AND m.is_current = true
  WHERE m.industry_sector IS NOT NULL
  GROUP BY p.id, p.full_name, p.party, m.industry_sector, m.is_paid, m.compensation_chf
),
politician_votes AS (
  SELECT
    vr.politician_id,
    pv.policy_area,
    vr.vote_result,
    COUNT(*) AS vote_count
  FROM vote_records vr
  JOIN parliamentary_votes pv ON pv.id = vr.parliamentary_vote_id
  WHERE pv.policy_area IS NOT NULL
  GROUP BY vr.politician_id, pv.policy_area, vr.vote_result
)
SELECT
  pm.politician_id,
  pm.full_name,
  pm.party,
  pm.industry_sector AS mandate_sector,
  pv.policy_area,
  pm.mandate_count,
  pm.is_paid,
  pm.compensation_chf,
  SUM(pv.vote_count) AS total_votes_in_area,
  SUM(pv.vote_count) FILTER (WHERE pv.vote_result = 'YES') AS yes_votes,
  SUM(pv.vote_count) FILTER (WHERE pv.vote_result = 'NO') AS no_votes,
  ROUND(
    SUM(pv.vote_count) FILTER (WHERE pv.vote_result = 'YES') * 100.0
    / NULLIF(SUM(pv.vote_count), 0),
    1
  ) AS yes_rate_pct
FROM politician_mandates pm
JOIN politician_votes pv ON pv.politician_id = pm.politician_id
GROUP BY pm.politician_id, pm.full_name, pm.party,
         pm.industry_sector, pv.policy_area,
         pm.mandate_count, pm.is_paid, pm.compensation_chf;

-- Lobbywatch influence map joining raw data with our politicians
CREATE OR REPLACE VIEW lobbywatch_influence_map AS
SELECT
  lm.parlamentarier_name,
  lm.organisation_name,
  lm.role,
  lm.sector,
  lm.is_paid,
  lm.compensation_chf,
  lm.is_current,
  p.id AS politician_id,
  p.party,
  p.chamber,
  p.canton
FROM lobbywatch_mandates_raw lm
LEFT JOIN parliament_members_raw pmr
  ON pmr.person_number = lm.parliament_member_id AND pmr.language = 'DE'
LEFT JOIN politicians p
  ON LOWER(p.full_name) = LOWER(lm.parlamentarier_name)
WHERE lm.is_current = true;

-- Data freshness summary for provenance UI
CREATE OR REPLACE VIEW data_source_freshness AS
SELECT
  source_name,
  MAX(started_at) AS last_sync_started,
  MAX(completed_at) AS last_sync_completed,
  (SELECT status FROM data_sync_log d2
   WHERE d2.source_name = d1.source_name
   ORDER BY started_at DESC LIMIT 1) AS last_status,
  (SELECT records_fetched FROM data_sync_log d2
   WHERE d2.source_name = d1.source_name AND d2.status = 'success'
   ORDER BY completed_at DESC LIMIT 1) AS last_records_fetched,
  COUNT(*) AS total_sync_runs
FROM data_sync_log d1
GROUP BY source_name;
