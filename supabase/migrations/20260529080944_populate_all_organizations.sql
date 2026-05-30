/*
  # Extract and Populate All Organizations from Mandates

  1. Problem
    - Mandates table contains organization_name for each mandate
    - Organizations table only has 5 manually created entries
    - Need to extract all unique organizations and populate properly
    
  2. Solution
    - Extract all unique organization names from mandates
    - Classify them by type (Company, Foundation, Association, etc.)
    - Populate the organizations table with ALL organizations
    - Link mandates to organizations via foreign key
*/

-- Step 1: Extract all unique organizations from mandates
WITH mandate_orgs AS (
  SELECT 
    organization_name,
    industry_sector,
    COUNT(*) as mandate_count,
    COUNT(DISTINCT politician_id) as politician_count,
    array_agg(DISTINCT industry_sector) FILTER (WHERE industry_sector IS NOT NULL) as sectors,
    bool_or(is_paid) as has_paid_positions
  FROM mandates
  WHERE organization_name IS NOT NULL
  GROUP BY organization_name, industry_sector
)
INSERT INTO organizations (
  name, 
  organization_type, 
  industry_sector,
  description,
  political_relevance,
  key_interests
)
SELECT
  organization_name,
  CASE
    WHEN organization_name LIKE '%AG' OR organization_name LIKE '%SA' THEN 'Company'
    WHEN organization_name LIKE '%Foundation' OR organization_name LIKE '%Stiftung%' THEN 'Foundation'
    WHEN organization_name LIKE '%Association%' OR organization_name LIKE '%Verband%' OR organization_name LIKE '%Union%' THEN 'Association'
    WHEN organization_name LIKE '%NGO%' OR organization_name LIKE 'WWF%' OR organization_name LIKE 'Amnesty%' THEN 'NGO'
    WHEN organization_name LIKE '%Bank%' OR organization_name LIKE '%Banking%' THEN 'Company'
    WHEN organization_name LIKE '%Chamber%' OR organization_name LIKE '%Gewerbe%' THEN 'Association'
    WHEN organization_name LIKE '%University%' OR organization_name LIKE '%ETH%' THEN 'Public Institution'
    ELSE 'Other'
  END as organization_type,
  industry_sector,
  'Organization linked to ' || politician_count || ' politician(s) through ' || mandate_count || ' mandate(s).' ||
  CASE WHEN has_paid_positions THEN ' Has paid positions.' ELSE '' END,
  'Politically relevant through connections to ' || politician_count || 
  CASE 
    WHEN politician_count = 1 THEN ' politician'
    ELSE ' politicians'
  END ||
  CASE 
    WHEN has_paid_positions THEN ' with paid positions'
    ELSE ''
  END,
  sectors
FROM mandate_orgs
WHERE organization_name NOT IN (SELECT name FROM organizations)
ORDER BY politician_count DESC, mandate_count DESC;

-- Step 2: Add organization_id column to mandates if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mandates' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE mandates ADD COLUMN organization_id UUID REFERENCES organizations(id);
  END IF;
END $$;

-- Step 3: Link mandates to organizations
UPDATE mandates m
SET organization_id = o.id
FROM organizations o
WHERE m.organization_name = o.name
AND m.organization_id IS NULL;