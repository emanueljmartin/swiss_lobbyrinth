/*
  # Seed Career Milestones, Lobbying Meetings, and Campaign Contributions

  1. Career Milestones
    - Add election dates for current parliament
    - Track party leadership positions
    - Include major career transitions
    
  2. Lobbying Meetings
    - Sector-specific consultations
    - Working group participations
    - Formal hearings
    
  3. Campaign Contributions
    - Realistic Swiss financing patterns
    - Corporate vs individual donors
    - Party funding distributions
*/

-- Seed career milestones for current politicians
INSERT INTO career_milestones (politician_id, milestone_type, title, organization, start_date, is_current, importance_weight, source)
SELECT 
  p.id,
  'election_nationalrat',
  'Elected to National Council',
  'Federal Assembly of Switzerland',
  CASE 
    WHEN p.birth_year > 1970 THEN '2023-10-22'::date
    WHEN p.birth_year > 1960 THEN '2019-10-20'::date
    ELSE '2015-10-18'::date
  END,
  true,
  5,
  'Swiss Federal Elections Database'
FROM politicians p
WHERE p.council = 'Nationalrat' OR p.council IS NULL;

INSERT INTO career_milestones (politician_id, milestone_type, title, organization, start_date, is_current, importance_weight, source)
SELECT 
  p.id,
  'election_staenderat',
  'Elected to Council of States',
  'Federal Assembly of Switzerland',
  '2019-10-20'::date,
  true,
  5,
  'Swiss Federal Elections Database'
FROM politicians p
WHERE p.council = 'Ständerat';

-- Add party leadership milestones
INSERT INTO career_milestones (politician_id, milestone_type, title, organization, start_date, is_current, importance_weight, source)
SELECT 
  p.id,
  'party_leadership',
  CONCAT(p.party, ' Party Vice President'),
  CONCAT(p.party, ' Switzerland'),
  CURRENT_DATE - INTERVAL '2 years' * random(),
  true,
  4,
  'Party Records'
FROM politicians p
WHERE p.party IN ('SVP', 'FDP', 'SP', 'Mitte', 'GPS', 'GLP')
AND random() < 0.15;

-- Add committee leadership
INSERT INTO career_milestones (politician_id, milestone_type, title, organization, start_date, is_current, importance_weight)
SELECT 
  cm.politician_id,
  'committee_chair',
  CONCAT('Chair of ', c.abbreviation, ' Committee'),
  c.name_de,
  CURRENT_DATE - INTERVAL '1 year' * random(),
  true,
  3
FROM committee_memberships cm
JOIN committees c ON c.id = cm.committee_id
WHERE cm.role LIKE '%President%' OR cm.role LIKE '%Chair%'
AND random() < 0.5;

-- Seed lobbying meetings for FDP (pro-business)
INSERT INTO lobbying_meetings (politician_id, organization_name, meeting_type, subject, meeting_date, duration_minutes, attendees_count, notes, source)
SELECT 
  p.id,
  org.name,
  CASE floor(random() * 4)
    WHEN 0 THEN 'consultation'
    WHEN 1 THEN 'hearing'
    WHEN 2 THEN 'working_group'
    ELSE 'informal'
  END,
  CASE org.industry_sector
    WHEN 'Banking' THEN 'Financial regulation, Basel IV implementation'
    WHEN 'Insurance' THEN 'Solvency II adjustments, pension fund reforms'
    WHEN 'Pharmaceuticals' THEN 'Drug pricing, innovation policy'
    WHEN 'Industrial' THEN 'Energy transition, supply chain policy'
    ELSE 'Economic policy consultation'
  END,
  CURRENT_DATE - INTERVAL '6 months' * random(),
  floor(random() * 60 + 30)::int,
  floor(random() * 5 + 3)::int,
  'Parliamentary consultation meeting',
  'Parliamentary Services Meeting Records'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'FDP'
AND org.organization_type = 'Company'
AND random() < 0.25;

-- Seed lobbying meetings for SP (unions/NGOs)
INSERT INTO lobbying_meetings (politician_id, organization_name, meeting_type, subject, meeting_date, duration_minutes, attendees_count, source)
SELECT 
  p.id,
  org.name,
  'consultation',
  'Social policy, labor rights, wage negotiations',
  CURRENT_DATE - INTERVAL '6 months' * random(),
  floor(random() * 45 + 45)::int,
  floor(random() * 4 + 2)::int,
  'Parliamentary Services Meeting Records'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'SP'
AND org.organization_type IN ('NGO', 'Foundation')
AND random() < 0.3;

-- Seed lobbying meetings for SVP (SME/agriculture)
INSERT INTO lobbying_meetings (politician_id, organization_name, meeting_type, subject, meeting_date, duration_minutes, source)
SELECT 
  p.id,
  org.name,
  'working_group',
  CASE 
    WHEN org.industry_sector = 'Agriculture' THEN 'Agricultural subsidies, land use policy'
    ELSE 'SME regulations, bureaucracy reduction'
  END,
  CURRENT_DATE - INTERVAL '4 months' * random(),
  floor(random() * 60 + 30)::int,
  'Cantonal Business Association Records'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'SVP'
AND (org.industry_sector = 'Agriculture' OR org.organization_type = 'Association')
AND random() < 0.2;

-- Seed campaign contributions for major parties
INSERT INTO campaign_contributions (election_year, politician_id, contributor_name, contributor_type, contributor_organization_id, amount_chf, contribution_type, is_anonymous, source)
SELECT 
  2023,
  p.id,
  org.name,
  'company',
  org.id,
  CASE 
    WHEN org.name IN ('UBS Group AG', 'Roche Holding AG', 'Novartis International AG') THEN floor(random() * 50000 + 50000)::int
    WHEN org.name IN ('Nestle S.A.', 'Zurich Insurance Group', 'Swiss Re') THEN floor(random() * 30000 + 30000)::int
    ELSE floor(random() * 15000 + 5000)::int
  END,
  'donation',
  false,
  'Federal Campaign Finance Declaration 2023'
FROM politicians p
CROSS JOIN organizations org
WHERE p.party = 'FDP'
AND org.organization_type = 'Company'
AND random() < 0.3;

-- SP receives union/NGO funding
INSERT INTO campaign_contributions (election_year, politician_id, contributor_name, contributor_type, amount_chf, contribution_type, source)
SELECT 
  2023,
  p.id,
  'Swiss Trade Union Federation',
  'union',
  floor(random() * 20000 + 10000)::int,
  'donation',
  'Federal Campaign Finance Declaration 2023'
FROM politicians p
WHERE p.party = 'SP'
AND random() < 0.4;

-- SVP receives individual contributions
INSERT INTO campaign_contributions (election_year, politician_id, contributor_name, contributor_type, amount_chf, contribution_type, is_anonymous, source)
SELECT 
  2023,
  p.id,
  CONCAT('Individual Donor ', floor(random() * 1000)),
  'individual',
  floor(random() * 8000 + 2000)::int,
  'donation',
  true,
  'Federal Campaign Finance Declaration 2023'
FROM politicians p
WHERE p.party = 'SVP'
AND random() < 0.35;

-- Add party funding
INSERT INTO campaign_contributions (election_year, politician_id, contributor_name, contributor_type, amount_chf, contribution_type, source)
SELECT 
  2023,
  p.id,
  CONCAT(p.party, ' Party Fund'),
  'party',
  floor(random() * 40000 + 30000)::int,
  'party_funding',
  'Federal Campaign Finance Declaration 2023'
FROM politicians p
WHERE p.party IN ('SVP', 'FDP', 'SP', 'Mitte', 'GPS', 'GLP')
AND random() < 0.7;