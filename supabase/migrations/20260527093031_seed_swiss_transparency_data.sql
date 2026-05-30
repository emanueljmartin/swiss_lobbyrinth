
/*
  # Seed Swiss Transparency System with Reference Data

  ## Summary
  Populates the database with:
  1. Data sources (official Swiss public registries)
  2. Industry sectors (Swiss NOGA classifications)
  3. Representative politicians, companies, committees
  4. Mandates and committee memberships
  5. Parliamentary votes and vote records

  All data is representative/illustrative - based on publicly known structural
  patterns in Swiss politics. Names and relationships are illustrative for
  demonstration purposes.

  ## Notes
  - All entries have full source attribution
  - Confidence scores reflect data quality
  - This is structural transparency data, not accusation data
*/

-- ==========================================
-- DATA SOURCES
-- ==========================================

INSERT INTO data_sources (name, short_name, url, description, data_type, license) VALUES
  ('Parlamentsdienste - Interessenbindungen', 'parl_interests', 'https://www.parlament.ch/de/ratsmitglieder', 'Official parliamentary disclosure of outside interests', 'mandate_disclosures', 'CC BY 4.0'),
  ('Handelsregister Schweiz', 'zefix', 'https://www.zefix.ch', 'Swiss central business register', 'company_registry', 'Public Domain'),
  ('SIMAP - Beschaffungsplattform', 'simap', 'https://www.simap.ch', 'Swiss public procurement platform', 'procurement', 'CC BY 4.0'),
  ('Abstimmungsresultate Nationalrat', 'parl_votes_nr', 'https://www.parlament.ch/de/ratsbetrieb/abstimmungen', 'National Council voting records', 'voting_records', 'CC BY 4.0'),
  ('Abstimmungsresultate Ständerat', 'parl_votes_sr', 'https://www.parlament.ch/de/ratsbetrieb/abstimmungen', 'Council of States voting records', 'voting_records', 'CC BY 4.0'),
  ('Stiftungsverzeichnis Schweiz', 'zewo', 'https://www.stiftungsverzeichnis.ch', 'Swiss foundation registry', 'foundation_registry', 'CC BY 4.0'),
  ('opendata.swiss', 'opendata_swiss', 'https://opendata.swiss', 'Swiss open government data portal', 'open_data', 'CC BY 4.0'),
  ('Lobbywatch', 'lobbywatch', 'https://lobbywatch.ch', 'Parliamentary lobby accreditation data', 'lobbying', 'CC BY 4.0')
ON CONFLICT DO NOTHING;

-- ==========================================
-- INDUSTRY SECTORS
-- ==========================================

INSERT INTO industry_sectors (name_de, name_en, noga_division, color_hex, icon) VALUES
  ('Finanzdienstleistungen', 'Financial Services', '64-66', '#1D4ED8', 'building-2'),
  ('Gesundheitswesen', 'Healthcare', '86-88', '#059669', 'heart-pulse'),
  ('Energie & Versorgung', 'Energy & Utilities', '35-39', '#D97706', 'zap'),
  ('Immobilien', 'Real Estate', '68', '#7C3AED', 'home'),
  ('Technologie & Telekommunikation', 'Technology & Telecom', '61-63', '#0891B2', 'cpu'),
  ('Transport & Logistik', 'Transport & Logistics', '49-53', '#DC2626', 'truck'),
  ('Landwirtschaft & Ernährung', 'Agriculture & Food', '01-10', '#65A30D', 'wheat'),
  ('Bauwirtschaft', 'Construction', '41-43', '#92400E', 'hard-hat'),
  ('Medien & Kommunikation', 'Media & Communications', '58-60', '#BE185D', 'radio'),
  ('Pharma & Chemie', 'Pharma & Chemicals', '20-21', '#7C3AED', 'flask-conical'),
  ('Versicherungen', 'Insurance', '65', '#1E40AF', 'shield'),
  ('Bildung & Forschung', 'Education & Research', '85-86', '#0F766E', 'graduation-cap'),
  ('Verbände & NGO', 'Associations & NGO', '94-99', '#6B7280', 'users'),
  ('Öffentliche Verwaltung', 'Public Administration', '84', '#374151', 'landmark'),
  ('Tourismus & Gastgewerbe', 'Tourism & Hospitality', '55-56', '#F59E0B', 'utensils')
ON CONFLICT DO NOTHING;

-- ==========================================
-- ENTITIES + POLITICIANS
-- ==========================================

-- Create entities first, then politicians
-- Using representative Swiss political figures (public figures with public roles)

WITH entity_inserts AS (
  INSERT INTO entities (entity_type, canonical_name, short_name, description, confidence_score) VALUES
    ('POLITICIAN', 'Anna Müller', 'Müller', 'National Council member, SVP', 0.98),
    ('POLITICIAN', 'Thomas Schneider', 'Schneider', 'National Council member, FDP', 0.97),
    ('POLITICIAN', 'Sophie Dubois', 'Dubois', 'National Council member, SP', 0.97),
    ('POLITICIAN', 'Marco Bernasconi', 'Bernasconi', 'Council of States member, Mitte', 0.96),
    ('POLITICIAN', 'Petra Weber', 'Weber', 'National Council member, GPS', 0.97),
    ('POLITICIAN', 'Hans Zimmermann', 'Zimmermann', 'National Council member, SVP', 0.95),
    ('POLITICIAN', 'Claudia Ritter', 'Ritter', 'National Council member, FDP', 0.96),
    ('POLITICIAN', 'Michel Fontaine', 'Fontaine', 'Council of States member, FDP', 0.96),
    ('POLITICIAN', 'Eva Steiner', 'Steiner', 'National Council member, GLP', 0.95),
    ('POLITICIAN', 'Peter Keller', 'Keller', 'National Council member, SVP', 0.94),
    ('COMPANY', 'UBS Group AG', 'UBS', 'Major Swiss bank', 1.0),
    ('COMPANY', 'Credit Suisse AG', 'CS', 'Swiss bank (in restructuring)', 0.98),
    ('COMPANY', 'Nestlé SA', 'Nestlé', 'Swiss multinational food company', 1.0),
    ('COMPANY', 'Novartis AG', 'Novartis', 'Swiss pharmaceutical company', 1.0),
    ('COMPANY', 'Roche Holding AG', 'Roche', 'Swiss pharmaceutical company', 1.0),
    ('COMPANY', 'Swiss Re AG', 'Swiss Re', 'Swiss reinsurance company', 1.0),
    ('COMPANY', 'Zurich Insurance Group', 'Zurich', 'Swiss insurance company', 1.0),
    ('COMPANY', 'ABB Ltd', 'ABB', 'Swiss-Swedish technology company', 1.0),
    ('COMPANY', 'Lonza Group AG', 'Lonza', 'Swiss life science company', 1.0),
    ('COMPANY', 'Swisscom AG', 'Swisscom', 'Swiss telecommunications company', 1.0),
    ('ASSOCIATION', 'economiesuisse', 'economiesuisse', 'Swiss business federation', 1.0),
    ('ASSOCIATION', 'Schweizerischer Gewerkschaftsbund', 'SGB', 'Swiss Trade Union Federation', 1.0),
    ('ASSOCIATION', 'Schweizerischer Arbeitgeberverband', 'SAV', 'Swiss Employers Association', 1.0),
    ('ASSOCIATION', 'Schweizerischer Bauernverband', 'SBV', 'Swiss Farmers Union', 1.0),
    ('ASSOCIATION', 'Hausärzteverband Schweiz', 'Hausärzteverband', 'Swiss family physicians association', 0.97),
    ('FOUNDATION', 'Pro Helvetia', 'Pro Helvetia', 'Swiss arts council foundation', 1.0),
    ('FOUNDATION', 'Helvetas', 'Helvetas', 'Swiss development NGO', 1.0),
    ('COMMITTEE', 'Wirtschaftskommission NR (WAK-N)', 'WAK-N', 'Economic Affairs and Taxation Committee NR', 1.0),
    ('COMMITTEE', 'Gesundheitskommission NR (SGK-N)', 'SGK-N', 'Social Security and Health Committee NR', 1.0),
    ('COMMITTEE', 'Sicherheitspolitische Kommission NR (SIK-N)', 'SIK-N', 'Security Policy Committee NR', 1.0),
    ('COMMITTEE', 'Umweltkommission NR (UREK-N)', 'UREK-N', 'Environment Committee NR', 1.0),
    ('COMMITTEE', 'Rechtskommission NR (RK-N)', 'RK-N', 'Legal Affairs Committee NR', 1.0),
    ('COMMITTEE', 'Finanzkommission NR (FK-N)', 'FK-N', 'Finance Committee NR', 1.0),
    ('COMMITTEE', 'Wirtschaftskommission SR (WAK-S)', 'WAK-S', 'Economic Affairs Committee SR', 1.0),
    ('COMMITTEE', 'Gesundheitskommission SR (SGK-S)', 'SGK-S', 'Social Security and Health Committee SR', 1.0)
  RETURNING id, canonical_name
)
SELECT * FROM entity_inserts;

-- Now insert politicians referencing entity IDs
DO $$
DECLARE
  src_id uuid;
  e_id uuid;
BEGIN
  SELECT id INTO src_id FROM data_sources WHERE short_name = 'parl_interests' LIMIT 1;

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Anna Müller' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Anna', 'Müller', 'SVP', 'National Council', 'ZH', true, '2019-12-02', 1972, 'F', 'NR-001', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Thomas Schneider' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Thomas', 'Schneider', 'FDP', 'National Council', 'AG', true, '2015-11-30', 1968, 'M', 'NR-002', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Sophie Dubois' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Sophie', 'Dubois', 'SP', 'National Council', 'GE', true, '2019-12-02', 1980, 'F', 'NR-003', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Marco Bernasconi' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Marco', 'Bernasconi', 'Mitte', 'Council of States', 'TI', true, '2019-12-02', 1965, 'M', 'SR-001', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Petra Weber' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Petra', 'Weber', 'GPS', 'National Council', 'BE', true, '2019-12-02', 1978, 'F', 'NR-005', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Hans Zimmermann' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Hans', 'Zimmermann', 'SVP', 'National Council', 'BE', true, '2011-11-28', 1960, 'M', 'NR-006', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Claudia Ritter' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Claudia', 'Ritter', 'FDP', 'National Council', 'ZH', true, '2019-12-02', 1975, 'F', 'NR-007', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Michel Fontaine' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Michel', 'Fontaine', 'FDP', 'Council of States', 'VD', true, '2015-11-30', 1962, 'M', 'SR-002', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Eva Steiner' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Eva', 'Steiner', 'GLP', 'National Council', 'ZH', true, '2019-12-02', 1983, 'F', 'NR-009', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Peter Keller' LIMIT 1;
  INSERT INTO politicians (entity_id, first_name, last_name, party, chamber, canton, is_active, term_start, birth_year, gender, parliamentary_id, source_id)
  VALUES (e_id, 'Peter', 'Keller', 'SVP', 'National Council', 'NW', true, '2011-11-28', 1970, 'M', 'NR-010', src_id);

END $$;

-- ==========================================
-- COMMITTEES
-- ==========================================

DO $$
DECLARE
  src_id uuid;
  e_id uuid;
BEGIN
  SELECT id INTO src_id FROM data_sources WHERE short_name = 'parl_interests' LIMIT 1;

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Wirtschaftskommission NR (WAK-N)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Kommission für Wirtschaft und Abgaben des Nationalrates', 'Commission de l''économie et des redevances du Conseil national', 'WAK-N', 'National Council', 'Standing', 'Economy & Finance', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Gesundheitskommission NR (SGK-N)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Kommission für soziale Sicherheit und Gesundheit des Nationalrates', 'Commission de la sécurité sociale et de la santé publique du Conseil national', 'SGK-N', 'National Council', 'Standing', 'Health & Social Security', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Sicherheitspolitische Kommission NR (SIK-N)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Sicherheitspolitische Kommission des Nationalrates', 'Commission de la politique de sécurité du Conseil national', 'SIK-N', 'National Council', 'Standing', 'Security Policy', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Umweltkommission NR (UREK-N)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Kommission für Umwelt, Raumplanung und Energie des Nationalrates', 'Commission de l''environnement, de l''aménagement du territoire et de l''énergie du Conseil national', 'UREK-N', 'National Council', 'Standing', 'Environment & Energy', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Rechtskommission NR (RK-N)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Rechtskommission des Nationalrates', 'Commission des affaires juridiques du Conseil national', 'RK-N', 'National Council', 'Standing', 'Legal Affairs', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Finanzkommission NR (FK-N)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Finanzkommission des Nationalrates', 'Commission des finances du Conseil national', 'FK-N', 'National Council', 'Standing', 'Finance', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Wirtschaftskommission SR (WAK-S)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Kommission für Wirtschaft und Abgaben des Ständerates', 'Commission de l''économie et des redevances du Conseil des États', 'WAK-S', 'Council of States', 'Standing', 'Economy & Finance', src_id);

  SELECT id INTO e_id FROM entities WHERE canonical_name = 'Gesundheitskommission SR (SGK-S)' LIMIT 1;
  INSERT INTO committees (entity_id, name_de, name_fr, abbreviation, chamber, committee_type, policy_area, source_id)
  VALUES (e_id, 'Kommission für soziale Sicherheit und Gesundheit des Ständerates', 'Commission de la sécurité sociale et de la santé publique du Conseil des États', 'SGK-S', 'Council of States', 'Standing', 'Health & Social Security', src_id);

END $$;

-- ==========================================
-- COMMITTEE MEMBERSHIPS
-- ==========================================

DO $$
DECLARE
  src_id uuid;
  pol_id uuid;
  com_id uuid;
BEGIN
  SELECT id INTO src_id FROM data_sources WHERE short_name = 'parl_interests' LIMIT 1;

  -- Thomas Schneider (FDP) -> WAK-N (Economy)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  SELECT id INTO com_id FROM committees WHERE abbreviation = 'WAK-N' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'member', '2019-12-02', true, src_id, 0.98);

  -- Claudia Ritter (FDP) -> WAK-N
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-007' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'president', '2021-12-01', true, src_id, 0.98);

  -- Anna Müller (SVP) -> WAK-N
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-001' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'member', '2019-12-02', true, src_id, 0.97);

  -- Sophie Dubois (SP) -> SGK-N (Health)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-003' LIMIT 1;
  SELECT id INTO com_id FROM committees WHERE abbreviation = 'SGK-N' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'vice-president', '2019-12-02', true, src_id, 0.98);

  -- Eva Steiner (GLP) -> SGK-N
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-009' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'member', '2019-12-02', true, src_id, 0.97);

  -- Petra Weber (GPS) -> UREK-N (Environment)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-005' LIMIT 1;
  SELECT id INTO com_id FROM committees WHERE abbreviation = 'UREK-N' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'president', '2021-12-01', true, src_id, 0.98);

  -- Hans Zimmermann (SVP) -> SIK-N (Security)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-006' LIMIT 1;
  SELECT id INTO com_id FROM committees WHERE abbreviation = 'SIK-N' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'member', '2011-11-28', true, src_id, 0.96);

  -- Peter Keller (SVP) -> SIK-N
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-010' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'member', '2015-11-30', true, src_id, 0.96);

  -- Marco Bernasconi (Mitte, SR) -> WAK-S
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'SR-001' LIMIT 1;
  SELECT id INTO com_id FROM committees WHERE abbreviation = 'WAK-S' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'member', '2019-12-02', true, src_id, 0.97);

  -- Michel Fontaine (FDP, SR) -> WAK-S
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'SR-002' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'president', '2019-12-02', true, src_id, 0.98);

  -- Thomas Schneider -> FK-N
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  SELECT id INTO com_id FROM committees WHERE abbreviation = 'FK-N' LIMIT 1;
  INSERT INTO committee_memberships (politician_id, committee_id, role, start_date, is_current, source_id, confidence_score)
  VALUES (pol_id, com_id, 'member', '2015-11-30', true, src_id, 0.97);

END $$;

-- ==========================================
-- MANDATES (Outside Roles)
-- ==========================================

DO $$
DECLARE
  src_id uuid;
  pol_id uuid;
  org_id uuid;
BEGIN
  SELECT id INTO src_id FROM data_sources WHERE short_name = 'parl_interests' LIMIT 1;

  -- Thomas Schneider (FDP, banking sector mandates)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'economiesuisse' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'economiesuisse', 'Board Member', 'BOARD_MEMBER_OF', 'Verbände & NGO', true, '2018-01-01', true, 2023, src_id, 0.97);

  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Zurich Insurance Group' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Zurich Insurance Group', 'Advisory Board Member', 'BOARD_MEMBER_OF', 'Versicherungen', true, '2020-04-01', true, 2023, src_id, 0.95);

  INSERT INTO mandates (politician_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, 'Schweizerischer Bankiervereinigung', 'Delegate', 'MEMBER_OF', 'Finanzdienstleistungen', false, '2016-01-01', true, 2023, src_id, 0.96);

  -- Claudia Ritter (FDP) - finance/pharma
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-007' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Novartis AG' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Novartis AG', 'External Consultant', 'CONSULTANT_FOR', 'Pharma & Chemie', true, '2017-06-01', true, 2023, src_id, 0.90);

  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Swiss Re AG' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Swiss Re AG', 'Board Member', 'BOARD_MEMBER_OF', 'Versicherungen', true, '2021-01-01', true, 2023, src_id, 0.93);

  -- Anna Müller (SVP) - agriculture
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-001' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Schweizerischer Bauernverband' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Schweizerischer Bauernverband', 'Central Committee Member', 'MEMBER_OF', 'Verbände & NGO', false, '2014-01-01', true, 2023, src_id, 0.98);

  INSERT INTO mandates (politician_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, 'Agro-Industrie AG', 'Board Member', 'BOARD_MEMBER_OF', 'Landwirtschaft & Ernährung', true, '2015-03-01', true, 2023, src_id, 0.88);

  INSERT INTO mandates (politician_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, 'Landwirtschaftliche Genossenschaft Zürich', 'President', 'PRESIDENT_OF', 'Landwirtschaft & Ernährung', false, '2011-01-01', true, 2023, src_id, 0.96);

  -- Sophie Dubois (SP) - health/unions
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-003' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Schweizerischer Gewerkschaftsbund' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Schweizerischer Gewerkschaftsbund', 'Executive Committee', 'MEMBER_OF', 'Verbände & NGO', false, '2019-01-01', true, 2023, src_id, 0.97);

  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Hausärzteverband Schweiz' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Hausärzteverband Schweiz', 'Board Observer', 'ASSOCIATED_WITH', 'Gesundheitswesen', false, '2020-01-01', true, 2023, src_id, 0.85);

  -- Petra Weber (GPS) - environment/media
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-005' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Helvetas' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Helvetas', 'Board Member', 'BOARD_MEMBER_OF', 'Verbände & NGO', false, '2017-01-01', true, 2023, src_id, 0.96);

  INSERT INTO mandates (politician_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, 'Greenpeace Schweiz', 'Advisory Board', 'ASSOCIATED_WITH', 'Verbände & NGO', false, '2015-01-01', true, 2023, src_id, 0.94);

  -- Hans Zimmermann (SVP)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-006' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, 'Berner Kantonalbank', 'Board Member', 'BOARD_MEMBER_OF', 'Finanzdienstleistungen', true, '2016-01-01', true, 2023, src_id, 0.91);

  INSERT INTO mandates (politician_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, 'Sicherheitsberatung Schweiz GmbH', 'Managing Partner', 'PARTNER_OF', 'Öffentliche Verwaltung', true, '2012-01-01', true, 2023, src_id, 0.89);

  -- Marco Bernasconi (Mitte, SR)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'SR-001' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Lonza Group AG' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Lonza Group AG', 'Board Member', 'BOARD_MEMBER_OF', 'Pharma & Chemie', true, '2018-04-01', true, 2023, src_id, 0.93);

  INSERT INTO mandates (politician_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, 'Ticino Turismo', 'President', 'PRESIDENT_OF', 'Tourismus & Gastgewerbe', false, '2014-01-01', true, 2023, src_id, 0.97);

  -- Michel Fontaine (FDP, SR)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'SR-002' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Nestlé SA' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Nestlé SA', 'Advisory Board', 'ASSOCIATED_WITH', 'Landwirtschaft & Ernährung', true, '2016-06-01', true, 2023, src_id, 0.87);

  Select id INTO org_id FROM entities WHERE canonical_name = 'economiesuisse' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'economiesuisse', 'Board Member', 'BOARD_MEMBER_OF', 'Verbände & NGO', false, '2017-01-01', true, 2023, src_id, 0.96);

  -- Eva Steiner (GLP)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-009' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Swisscom AG' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Swisscom AG', 'External Consultant', 'CONSULTANT_FOR', 'Technologie & Telekommunikation', true, '2021-03-01', true, 2023, src_id, 0.84);

  -- Peter Keller (SVP)
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-010' LIMIT 1;
  SELECT id INTO org_id FROM entities WHERE canonical_name = 'Schweizerischer Arbeitgeberverband' LIMIT 1;
  INSERT INTO mandates (politician_id, organization_entity_id, organization_name, role_title, mandate_type, industry_sector, is_paid, start_date, is_current, disclosure_year, source_id, confidence_score)
  VALUES (pol_id, org_id, 'Schweizerischer Arbeitgeberverband', 'Delegate', 'MEMBER_OF', 'Verbände & NGO', false, '2015-01-01', true, 2023, src_id, 0.95);

END $$;

-- ==========================================
-- PARLIAMENTARY VOTES
-- ==========================================

DO $$
DECLARE
  src_id uuid;
BEGIN
  SELECT id INTO src_id FROM data_sources WHERE short_name = 'parl_votes_nr' LIMIT 1;

  INSERT INTO parliamentary_votes (vote_id, title_de, title_fr, vote_date, chamber, vote_category, policy_area, result, yes_count, no_count, abstain_count, absent_count, source_id)
  VALUES
    ('NR-2023-001', 'Finanzdienstleistungsgesetz - Revision', 'Loi sur les services financiers - révision', '2023-03-15', 'National Council', 'Legislation', 'Economy & Finance', 'Accepted', 108, 85, 2, 5, src_id),
    ('NR-2023-002', 'Krankenkassenprämien - Entlastungsinitiative', 'Initiative sur les primes des caisses-maladie', '2023-06-14', 'National Council', 'Initiative', 'Health & Social Security', 'Rejected', 72, 119, 5, 4, src_id),
    ('NR-2023-003', 'Klimagesetz - CO2-Reduktionsziele', 'Loi sur le climat - objectifs de réduction CO2', '2023-09-19', 'National Council', 'Legislation', 'Environment & Energy', 'Accepted', 112, 78, 8, 2, src_id),
    ('NR-2023-004', 'Landwirtschaftliche Direktzahlungen', 'Paiements directs agricoles', '2023-12-05', 'National Council', 'Budget', 'Agriculture', 'Accepted', 130, 52, 6, 12, src_id),
    ('NR-2024-001', 'Unternehmenssteuerreform OECD Mindeststeuer', 'Réforme fiscale impôt minimum OCDE', '2024-02-28', 'National Council', 'Legislation', 'Economy & Finance', 'Accepted', 145, 40, 5, 10, src_id),
    ('NR-2024-002', 'Pflegeinitiative - Umsetzung', 'Initiative soins infirmiers - mise en oeuvre', '2024-05-22', 'National Council', 'Legislation', 'Health & Social Security', 'Accepted', 118, 67, 4, 11, src_id),
    ('NR-2024-003', 'Rüstungsausgaben - Erhöhung auf 1% BIP', 'Dépenses d armement - hausse à 1% PIB', '2024-09-10', 'National Council', 'Budget', 'Security Policy', 'Rejected', 88, 96, 6, 10, src_id)
  ON CONFLICT (vote_id) DO NOTHING;
END $$;

-- ==========================================
-- VOTE RECORDS
-- ==========================================

DO $$
DECLARE
  src_id uuid;
  pol_id uuid;
  vote_id_val uuid;
BEGIN
  SELECT id INTO src_id FROM data_sources WHERE short_name = 'parl_votes_nr' LIMIT 1;

  -- NR-2023-001: Finanzdienstleistungsgesetz
  SELECT id INTO vote_id_val FROM parliamentary_votes WHERE vote_id = 'NR-2023-001' LIMIT 1;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-001' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-003' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-005' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-006' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-007' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-009' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-010' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;

  -- NR-2023-002: Krankenkassenprämien
  SELECT id INTO vote_id_val FROM parliamentary_votes WHERE vote_id = 'NR-2023-002' LIMIT 1;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-001' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-003' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-005' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-006' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-007' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-009' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-010' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;

  -- NR-2023-003: Klimagesetz
  SELECT id INTO vote_id_val FROM parliamentary_votes WHERE vote_id = 'NR-2023-003' LIMIT 1;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-001' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-003' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-005' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-006' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-007' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-009' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-010' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;

  -- NR-2023-004: Landwirtschaft
  SELECT id INTO vote_id_val FROM parliamentary_votes WHERE vote_id = 'NR-2023-004' LIMIT 1;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-001' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-003' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-005' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'ABSTAIN', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-006' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-007' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-009' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-010' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;

  -- NR-2024-001: OECD Mindeststeuer
  SELECT id INTO vote_id_val FROM parliamentary_votes WHERE vote_id = 'NR-2024-001' LIMIT 1;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-001' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-002' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-003' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-005' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-006' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-007' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-009' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'YES', src_id) ON CONFLICT DO NOTHING;
  SELECT id INTO pol_id FROM politicians WHERE parliamentary_id = 'NR-010' LIMIT 1;
  INSERT INTO vote_records (parliamentary_vote_id, politician_id, vote_result, source_id) VALUES (vote_id_val, pol_id, 'NO', src_id) ON CONFLICT DO NOTHING;

END $$;
