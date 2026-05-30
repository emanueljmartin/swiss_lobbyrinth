/*
  # Improve Organization Classification
  
  1. Add unique constraint on organization name
  2. Reclassify organizations based on sector and naming patterns
*/

-- Add unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'organizations_name_unique'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_name_unique UNIQUE (name);
  END IF;
END $$;

-- Improve classification
UPDATE organizations
SET organization_type = CASE
  WHEN name LIKE '%Services%' AND industry_sector = 'Social' THEN 'Public Institution'
  WHEN name LIKE '%Education%' THEN 'Public Institution'
  WHEN name LIKE '%Tourism%' OR name LIKE '%Tourismus%' THEN 'Association'
  WHEN name LIKE '%Chamber%' OR name LIKE '%Handelskammer%' THEN 'Association'
  WHEN industry_sector = 'Banking' THEN 'Company'
  WHEN industry_sector = 'Insurance' THEN 'Company'
  WHEN name LIKE '%Development%' AND industry_sector = 'Economy' THEN 'Public Institution'
  WHEN name LIKE '%Forum%' OR name LIKE '%Initiative%' THEN 'Association'
  WHEN industry_sector = 'NGOs' THEN 'NGO'
  ELSE organization_type
END
WHERE organization_type = 'Other';

-- Add UBS
INSERT INTO organizations (name, organization_type, industry_sector, description, political_relevance)
VALUES ('UBS Group AG', 'Company', 'Banking', 
'Largest Swiss bank and world''s largest wealth manager with 4.9 trillion CHF in assets. Employs 120,000 globally including 37,000 in Switzerland.', 
'Central to financial regulation and banking secrecy legislation')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  political_relevance = EXCLUDED.political_relevance;

-- Add ABB
INSERT INTO organizations (name, organization_type, industry_sector, description, political_relevance)
VALUES ('ABB Group', 'Company', 'Manufacturing', 
'Swiss-Swedish multinational specializing in robotics and automation with 105,000 employees globally.', 
'Essential for industrial policy and energy infrastructure')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  political_relevance = EXCLUDED.political_relevance;

-- Add Roche
INSERT INTO organizations (name, organization_type, industry_sector, description, political_relevance)
VALUES ('Roche Holding AG', 'Company', 'Healthcare', 
'World''s fifth-largest pharma company and global leader in cancer treatments. 100,000 employees, 14.7B CHF R&D investment.', 
'Major influence on pharmaceutical regulation and research funding')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  political_relevance = EXCLUDED.political_relevance;

-- Add Nestle
INSERT INTO organizations (name, organization_type, industry_sector, description, political_relevance)
VALUES ('Nestle S.A.', 'Company', 'Food & Beverage', 
'World''s largest food company with 93B CHF revenue and 270,000 employees. Represents 11% of Swiss exports.', 
'Central to agricultural policy and food safety regulation')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  political_relevance = EXCLUDED.political_relevance;

-- Add Swisscom
INSERT INTO organizations (name, organization_type, industry_sector, description, political_relevance)
VALUES ('Swisscom AG', 'Company', 'Telecommunications', 
'Switzerland''s largest telecom provider with 17,000 employees. 51% state-owned, operates national fiber network.', 
'Critical for digital infrastructure policy and telecom regulation')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  political_relevance = EXCLUDED.political_relevance;

-- Add SBB
INSERT INTO organizations (name, organization_type, industry_sector, description, political_relevance)
VALUES ('SBB AG', 'Company', 'Transportation', 
'Swiss Federal Railways, fully state-owned. Operates 3,200 km of railway serving 1.26M passengers daily.', 
'Essential for transport policy and infrastructure')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  political_relevance = EXCLUDED.political_relevance;