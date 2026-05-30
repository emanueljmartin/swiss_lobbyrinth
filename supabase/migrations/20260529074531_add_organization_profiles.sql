/*
  # Add Organization Profiles and Relationship Context

  1. New Tables
    - `organizations` - Detailed profiles of companies, foundations, associations
    - `political_parties` - Detailed party profiles with ideology and positions
    
  2. Modified Tables
    - `committees` - Add detailed descriptions and policy focus
    
  3. Purpose
    - Provide contextual information for each relationship
    - Allow users to understand why an organization is politically relevant
    - Track potential conflicts of interest
*/

-- Create organizations table for detailed company profiles
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_type TEXT CHECK (organization_type IN ('Company', 'Foundation', 'Association', 'NGO', 'Public Institution', 'Trade Union', 'Other')),
  industry_sector TEXT,
  headquarters_canton TEXT,
  founded_year INTEGER,
  employees_range TEXT,
  revenue_range TEXT,
  description TEXT,
  political_relevance TEXT,
  lobbying_activities TEXT,
  key_interests TEXT[],
  parent_company TEXT,
  subsidiaries TEXT[],
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create political_parties table for detailed party profiles
CREATE TABLE IF NOT EXISTS political_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  ideology TEXT,
  political_position TEXT CHECK (political_position IN ('Far Left', 'Left', 'Center Left', 'Center', 'Center Right', 'Right', 'Far Right')),
  founding_year INTEGER,
  headquarters_canton TEXT,
  president TEXT,
  parliamentary_group_size INTEGER,
  description TEXT,
  key_positions TEXT[],
  voting_history_summary TEXT,
  young_organization TEXT,
  women_organization TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add detailed descriptions to committees
ALTER TABLE committees 
ADD COLUMN IF NOT EXISTS detailed_description TEXT,
ADD COLUMN IF NOT EXISTS policy_focus TEXT[],
ADD COLUMN IF NOT EXISTS meeting_frequency TEXT;

-- Update committees with detailed information
UPDATE committees
SET 
  detailed_description = CASE name_de
    WHEN 'Aussenpolitische Kommission' THEN 'Oversees Swiss foreign policy, diplomatic relations, and international agreements. Reviews treaties and monitors Switzerland''s role in international organizations.'
    WHEN 'Finanzkommission' THEN 'Responsible for federal budget, taxation policy, and financial regulations. Reviews all financial legislation and oversees the Federal Finance Administration.'
    WHEN 'Kommission für Wirtschaft und Abgaben' THEN 'Deals with economic policy, trade agreements, and tax legislation. Monitors Swiss economic performance and business regulations.'
    WHEN 'Sicherheitspolitische Kommission' THEN 'Oversees national security, defense policy, and military matters. Reviews security cooperation agreements and defense spending.'
    WHEN 'Staatspolitische Kommission' THEN 'Handles legal matters related to civil law, criminal law, and constitutional affairs. Reviews judicial appointments and legal system reforms.'
    WHEN 'Kommission für Wissenschaft, Bildung und Kultur' THEN 'Responsible for education policy, research funding, and cultural affairs. Oversees universities and research institutions.'
    WHEN 'Kommission für soziale Sicherheit und Gesundheit' THEN 'Handles healthcare policy, social security, and welfare programs. Reviews public health initiatives and social insurance.'
    WHEN 'Kommission für Umwelt, Raumplanung und Energie' THEN 'Deals with environmental protection, land use planning, and energy policy. Reviews climate legislation and sustainability initiatives.'
    WHEN 'Kommission für Verkehr und Fernmeldewesen' THEN 'Oversees transportation infrastructure, communications policy, and digital infrastructure. Reviews rail, road, and aviation policies.'
    WHEN 'Bau- und Umweltausschuss' THEN 'Responsible for federal construction projects, infrastructure development, environmental protection and public works.'
    ELSE 'Parliamentary committee responsible for legislative oversight and policy development in its designated area.'
  END,
  policy_focus = CASE name_de
    WHEN 'Aussenpolitische Kommission' THEN ARRAY['Diplomacy', 'International Treaties', 'Development Aid', 'Sanctions']
    WHEN 'Finanzkommission' THEN ARRAY['Federal Budget', 'Taxation', 'Financial Regulation', 'Public Spending']
    WHEN 'Kommission für Wirtschaft und Abgaben' THEN ARRAY['Trade Policy', 'Business Regulation', 'Labor Law', 'Competition']
    WHEN 'Sicherheitspolitische Kommission' THEN ARRAY['Defense', 'Intelligence', 'Counter-terrorism', 'Military Procurement']
    WHEN 'Staatspolitische Kommission' THEN ARRAY['Civil Law', 'Criminal Justice', 'Constitutional Reform', 'Courts']
    WHEN 'Kommission für Wissenschaft, Bildung und Kultur' THEN ARRAY['Universities', 'Research', 'Cultural Policy', 'Education Standards']
    WHEN 'Kommission für soziale Sicherheit und Gesundheit' THEN ARRAY['Healthcare', 'Social Security', 'Pension System', 'Public Health']
    WHEN 'Kommission für Umwelt, Raumplanung und Energie' THEN ARRAY['Climate Policy', 'Land Use', 'Energy Transition', 'Conservation']
    WHEN 'Kommission für Verkehr und Fernmeldewesen' THEN ARRAY['Infrastructure', 'Rail Network', 'Digital Policy', 'Aviation']
    WHEN 'Bau- und Umweltausschuss' THEN ARRAY['Construction', 'Environment', 'Infrastructure', 'Public Works']
    ELSE ARRAY['Legislative Oversight', 'Policy Development']
  END
WHERE detailed_description IS NULL;

-- Insert party profiles
INSERT INTO political_parties (party_code, full_name, ideology, political_position, founding_year, description, key_positions, parliamentary_group_size)
VALUES
  ('SVP', 'Swiss People''s Party', 'National conservatism, Right-wing populism', 'Right', 1936, 'Largest party in Switzerland, known for euroscepticism, immigration restrictions, and direct democracy advocacy. Strong support in rural areas and among working-class voters.', ARRAY['Immigration restriction', 'Euroscepticism', 'Tax reduction', 'Law and order'], 58),
  ('SP', 'Social Democratic Party of Switzerland', 'Social democracy, Progressivism', 'Center Left', 1888, 'Second-largest party, advocates for social justice, workers'' rights, and environmental protection. Strong support in urban areas and among young voters.', ARRAY['Social welfare', 'Climate action', 'Workers'' rights', 'Gender equality'], 46),
  ('FDP', 'FDP.The Liberals', 'Classical liberalism, Economic liberalism', 'Center Right', 1894, 'Pro-business party advocating for free markets, individual freedoms, and limited government intervention. Strong in business communities and urban centers.', ARRAY['Free market', 'Tax reduction', 'Individual liberty', 'EU integration'], 27),
  ('Mitte', 'The Centre', 'Christian democracy, Social conservatism', 'Center', 1912, 'Centrist party formed from merger of CVP and BDP. Advocates for social market economy, federalism, and traditional values. Strong in Catholic cantons.', ARRAY['Social market economy', 'Federalism', 'Family policy', 'Rural development'], 28),
  ('GPS', 'Green Party of Switzerland', 'Green politics, Progressivism', 'Left', 1983, 'Environmental party focused on climate action, sustainability, and social justice. Growing support among urban and younger voters.', ARRAY['Climate protection', 'Renewable energy', 'Biodiversity', 'Social equity'], 19),
  ('GLP', 'Green Liberal Party of Switzerland', 'Green liberalism, Environmentalism', 'Center', 2007, 'Environmentally-focused but economically liberal. Supports market-based solutions to environmental challenges.', ARRAY['Market-based environmentalism', 'Innovation', 'Sustainability'], 16),
  ('EVP', 'Evangelical People''s Party', 'Christian socialism, Social conservatism', 'Center Left', 1919, 'Christian-democratic party with focus on ethical issues, social responsibility, and family values.', ARRAY['Christian values', 'Family policy', 'Social responsibility'], 3),
  ('EDU', 'Federal Democratic Union', 'Christian nationalism, Social conservatism', 'Right', 1975, 'Conservative Christian party advocating for traditional values and stricter asylum policies.', ARRAY['Traditional values', 'Asylum restrictions', 'National sovereignty'], 3)
ON CONFLICT (party_code) DO UPDATE SET
  description = EXCLUDED.description,
  key_positions = EXCLUDED.key_positions,
  parliamentary_group_size = EXCLUDED.parliamentary_group_size;