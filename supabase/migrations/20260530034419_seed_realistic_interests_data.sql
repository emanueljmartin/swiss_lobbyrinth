/*
  # Populate Interests with Realistic Swiss Board Declarations

  1. Swiss Transparency Requirements
    - Members must declared paid board positions
    - Income brackets: <15k, 15-30k, 30-50k, 50-100k, >100k CHF
    - Major companies typically pay 80k-150k per board seat
    
  2. Add realistic declarations for each party
    - FDP: Heavy corporate board presence
    - SVP: SME, agriculture, regional
    - Mitte: Insurance, cantonal banks
    - SP/GPS: Social enterprises, foundations (often unpaid)
*/

-- Seed Interests for FDP (pro-business party)
INSERT INTO interests (politician_id, organization_name, organization_id, role, function_type, is_paid, compensation_range, compensation_chf, declaration_year, verification_status, source_document)
SELECT 
  p.id,
  org.name,
  org.id,
  CASE floor(random() * 4)
    WHEN 0 THEN 'Verwaltungsratspräsident'
    WHEN 1 THEN 'Vizepräsident Verwaltungsrat'
    WHEN 2 THEN 'Verwaltungsrat'
    ELSE 'Beirat'
  END,
  'board_member',
  true,
  CASE 
    WHEN org.name IN ('UBS Group AG', 'Roche Holding AG', 'Novartis International AG', 'Nestle S.A.') 
      THEN '> CHF 100,000'
    WHEN org.name IN ('Zurich Insurance Group', 'Swiss Re', 'ABB Group', 'Swisscom AG') 
      THEN 'CHF 50,000 - 100,000'
    ELSE 'CHF 30,000 - 50,000'
  END,
  CASE 
    WHEN org.name IN ('UBS Group AG', 'Roche Holding AG', 'Novartis International AG', 'Nestle S.A.') 
      THEN floor(random() * 40000 + 120000)::int
    WHEN org.name IN ('Zurich Insurance Group', 'Swiss Re', 'ABB Group', 'Swisscom AG') 
      THEN floor(random() * 30000 + 65000)::int
    ELSE floor(random() * 15000 + 30000)::int
  END,
  2025,
  'declared',
  'Parlamentarier-Transparenz 2025'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'FDP' 
  AND org.organization_type = 'Company'
  AND random() < 0.35
ON CONFLICT DO NOTHING;

-- Seed Interests for SVP (SME/agriculture focus)
INSERT INTO interests (politician_id, organization_name, organization_id, role, function_type, is_paid, compensation_range, compensation_chf, declaration_year, verification_status)
SELECT 
  p.id,
  org.name,
  org.id,
  'Verwaltungsrat',
  'board_member',
  (random() > 0.3),
  CASE WHEN random() > 0.3 THEN 'CHF 15,000 - 30,000' ELSE 'Keine Entschädigung' END,
  CASE WHEN random() > 0.3 THEN floor(random() * 10000 + 18000)::int ELSE 0 END,
  2025,
  'declared'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'SVP' 
  AND (org.organization_type = 'Association' OR org.industry_sector IN ('Agriculture', 'Economy'))
  AND random() < 0.25
ON CONFLICT DO NOTHING;

-- Seed Interests for Mitte (insurance/regional)
INSERT INTO interests (politician_id, organization_name, organization_id, role, function_type, is_paid, compensation_range, compensation_chf, declaration_year, verification_status)
SELECT 
  p.id,
  org.name,
  org.id,
  'Verwaltungsrat',
  'board_member',
  true,
  'CHF 50,000 - 100,000',
  floor(random() * 35000 + 55000)::int,
  2025,
  'declared'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'Mitte' 
  AND org.industry_sector = 'Insurance'
  AND random() < 0.4
ON CONFLICT DO NOTHING;

-- Seed Interests for SP (mostly unpaid social sector)
INSERT INTO interests (politician_id, organization_name, organization_id, role, function_type, is_paid, compensation_range, compensation_chf, declaration_year, verification_status)
SELECT 
  p.id,
  org.name,
  org.id,
  'Stiftungsrat',
  'board_member',
  (random() > 0.7),
  CASE WHEN random() > 0.7 THEN 'CHF 15,000 - 30,000' ELSE 'Ehrenamtlich' END,
  CASE WHEN random() > 0.7 THEN floor(random() * 8000 + 15000)::int ELSE 0 END,
  2025,
  'declared'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'SP' 
  AND org.organization_type IN ('Foundation', 'NGO')
  AND random() < 0.35
ON CONFLICT DO NOTHING;

-- Seed Interests for GPS/GLP (environmental)
INSERT INTO interests (politician_id, organization_name, organization_id, role, function_type, is_paid, compensation_range, compensation_chf, declaration_year, verification_status)
SELECT 
  p.id,
  org.name,
  org.id,
  'Stiftungsrat',
  'board_member',
  (random() > 0.5),
  CASE WHEN random() > 0.5 THEN 'CHF 15,000 - 30,000' ELSE 'Ehrenamtlich' END,
  CASE WHEN random() > 0.5 THEN floor(random() * 8000 + 15000)::int ELSE 0 END,
  2025,
  'declared'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party IN ('GPS', 'GLP')
  AND org.industry_sector = 'Environment'
  AND random() < 0.3
ON CONFLICT DO NOTHING;

-- Update organization metrics
UPDATE organizations o
SET 
  politician_count = (SELECT COUNT(DISTINCT i.politician_id) FROM interests i WHERE i.organization_id = o.id),
  total_connections = (SELECT COUNT(*) FROM interests i WHERE i.organization_id = o.id),
  total_compensation_chf = (SELECT COALESCE(SUM(i.compensation_chf), 0) FROM interests i WHERE i.organization_id = o.id);

-- Update politician influence scores
UPDATE politicians p
SET influence_score = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN i.compensation_chf > 100000 THEN 10
      WHEN i.compensation_chf > 50000 THEN 7
      WHEN i.compensation_chf > 15000 THEN 4
      WHEN i.is_paid THEN 2
      ELSE 1
    END
  ), 0)
  FROM interests i
  WHERE i.politician_id = p.id
);