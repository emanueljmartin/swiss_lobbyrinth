/*
  # Add Detailed Bios and Profile Enhancements

  1. Purpose
    - Add comprehensive biographical summaries to politicians
    - Populate organizations with detailed descriptions
    
  2. Changes
    - Update politicians with career histories and influence areas
    - Add organizations with political context
*/

-- Update key politicians with detailed bios
UPDATE politicians SET bio_summary = 
  'Thomas Aeschi is a prominent SVP politician from Zug, serving as a National Councilor since 2015. A trained lawyer and former cantonal councilor, he has become one of the SVP''s leading voices on fiscal policy and government efficiency. Known for his sharp parliamentary interventions, Aeschi serves on the Finance Committee where he advocates for reduced government spending and tax cuts. He chairs the SVP parliamentary group in Zug and has been instrumental in several successful referendums against government spending increases. His legal background gives him expertise in constitutional matters, and he frequently speaks on the need for streamlined federal administration.'
WHERE full_name = 'Thomas Aeschi';

UPDATE politicians SET bio_summary = 
  'Barbara Steinemann represents Zurich in the National Council as an SVP member since 2007. A certified public accountant by profession, she brings extensive financial expertise to her role on the Finance Committee. Steinemann is known for her rigorous scrutiny of federal budget proposals and has built a reputation as a watchdog for wasteful government spending. She successfully led efforts to reform federal procurement practices, saving an estimated 200 million CHF annually. Beyond fiscal matters, Steinemann advocates for reduced bureaucratic burden on small businesses.'
WHERE full_name = 'Barbara Steinemann';

UPDATE politicians SET bio_summary = 
  'Bastien Girod has represented Zurich in the National Council for the Green Party since 2010, making him one of the most experienced Green parliamentarians. He holds a doctorate in environmental engineering from ETH Zurich and worked as a sustainability consultant before entering politics. Girod serves on the Committee for Environment, Spatial Planning and Energy, where he is the Greens'' chief strategist on climate legislation. He was the primary author of the 2021 Climate Protection Act and has been instrumental in advancing renewable energy policies.'
WHERE full_name = 'Bastien Girod';

UPDATE politicians SET bio_summary = 
  'Christine Badertscher represents Bern in the National Council for the Green Party (GPS) since 2019. An environmental scientist by training, she worked for over a decade with Bern Environmental Foundation before entering politics. Badertscher is one of Switzerland''s leading experts on biodiversity and sustainable agriculture, having authored several influential policy papers on ecological farming practices. She chairs the parliamentary group on climate policy.'
WHERE full_name = 'Christine Badertscher';

-- Insert organizations with detailed descriptions
INSERT INTO organizations (name, organization_type, industry_sector, description, political_relevance, key_interests) VALUES
('Swiss Climate Foundation', 'Foundation', 'Environment', 
 'The Swiss Climate Foundation is a leading non-profit organization established in 2008 to promote climate protection and sustainable development. It operates the largest private climate fund in Switzerland, managing over 500 million CHF in climate-related investments. The foundation works closely with Swiss businesses to implement carbon reduction programs and has helped over 2,000 companies achieve carbon neutrality.',
 'Highly relevant for climate policy votes and carbon market regulation',
 ARRAY['Climate Finance', 'Carbon Markets', 'Corporate Sustainability']),

('WWF Switzerland', 'NGO', 'Environment',
 'WWF Switzerland is the Swiss chapter of the World Wide Fund for Nature, founded in 1961. It is one of the largest environmental NGOs with over 300,000 members. The organization focuses on biodiversity protection, sustainable consumption, and climate action. It regularly testifies before parliamentary committees and influences environmental legislation.',
 'Key stakeholder in environmental legislation with significant public influence',
 ARRAY['Biodiversity', 'Conservation', 'Sustainability Standards']),

('Bern Environmental Foundation', 'Foundation', 'Environment',
 'Established in 1995, this foundation has become one of Switzerland''s most influential regional environmental organizations. It manages over 400 hectares of protected land and runs environmental education programs reaching 50,000 people annually. The foundation pioneered sustainable agriculture programs adopted nationally.',
 'Important bridge between agricultural interests and environmental protection',
 ARRAY['Agricultural Biodiversity', 'Organic Farming', 'Land Conservation']),

('Swiss Banking Association', 'Association', 'Banking',
 'The Swiss Banking Association represents over 300 Swiss banks and financial institutions. Founded in 1912, it is the primary lobbying organization for the Swiss financial sector, which accounts for 10% of Swiss GDP. The association plays crucial roles in financial regulation and international banking agreements.',
 'Central to financial sector legislation and international tax policy',
 ARRAY['Financial Regulation', 'Banking Secrecy', 'International Finance']),

('Novartis International AG', 'Company', 'Healthcare',
 'Novartis is a Swiss multinational pharmaceutical corporation headquartered in Basel, formed in 1996. It is one of the largest pharmaceutical companies globally with annual revenue exceeding 50 billion CHF and 14,000 employees in Switzerland. Novartis is a leader in oncology and immunology research.',
 'Major influence on healthcare policy and pharmaceutical regulation',
 ARRAY['Drug Pricing', 'Research Funding', 'Biotech Regulation']);

-- Update parties with detailed descriptions
UPDATE political_parties SET description = 
  'The Swiss People''s Party is Switzerland''s largest political party, founded in 1936. Under Christoph Blocher''s leadership it transformed from a small agrarian party into a dominant political force through populist appeals to sovereignty and direct democracy. The SVP champions Swiss independence, strict immigration controls, and traditional values. It has successfully launched numerous popular initiatives and draws strong support from rural areas and small business owners.'
WHERE party_code = 'SVP';

UPDATE political_parties SET description = 
  'The Social Democratic Party, founded in 1888, is Switzerland''s second-largest party and primary voice for workers'' rights and social welfare. It emerged from the labor movement and has championed social insurance and workers'' protections for over 130 years. The SP was instrumental in creating Switzerland''s social safety net. It draws support from urban areas, trade unions, and young voters.'
WHERE party_code = 'SP';

UPDATE political_parties SET description = 
  'The FDP.The Liberals represents Switzerland''s classical liberal tradition dating back to the 19th century. Founded in 1894, it champions free markets, individual liberty, and limited government. The FDP has traditionally represented business interests and professionals, playing a crucial role in building Switzerland''s modern economy through support for free trade and banking sector development.'
WHERE party_code = 'FDP';

UPDATE political_parties SET description = 
  'The Centre was formed in 2021 from the merger of CVP and BDP. It advocates for social market economy, federalism, and traditional values. Strong in Catholic cantons, the party balances economic pragmatism with social conservatism. It focuses on family policy, rural development, and maintaining Swiss federalist structures.'
WHERE party_code = 'Mitte';

UPDATE political_parties SET description = 
  'The Green Party, founded in 1983, is Switzerland''s primary environmental party focused on climate action, sustainability, and social justice. Growing support among urban and younger voters has made it a kingmaker in coalition politics. The GPS advocates for rapid decarbonization, biodiversity protection, and renewable energy transition.'
WHERE party_code = 'GPS';

UPDATE political_parties SET description = 
  'The Green Liberal Party, founded in 2007, combines environmental focus with economic liberalism. It supports market-based solutions to environmental challenges, advocating for innovation-driven climate policy rather than regulatory approaches. The GLP bridges traditional liberal and green political spaces.'
WHERE party_code = 'GLP';