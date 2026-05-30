/*
  # Add Missing Council Column and Analysis Views
*/

ALTER TABLE politicians ADD COLUMN IF NOT EXISTS council text DEFAULT 'Nationalrat';

-- Update council based on existing data (assuming distribution)
UPDATE politicians SET council = 'Ständerat' WHERE id IN (
  SELECT id FROM politicians WHERE party = 'Mitte' LIMIT 10
);
UPDATE politicians SET council = 'Nationalrat' WHERE council IS NULL;

-- Create voting analysis view
CREATE OR REPLACE VIEW voting_analysis AS
SELECT 
  p.id as politician_id,
  p.full_name,
  p.party,
  p.canton,
  COUNT(DISTINCT vr.parliamentary_vote_id) as total_votes_cast,
  COUNT(CASE WHEN vr.vote_result = 'YES' THEN 1 END) as yes_votes,
  COUNT(CASE WHEN vr.vote_result = 'NO' THEN 1 END) as no_votes
FROM politicians p
LEFT JOIN vote_records vr ON vr.politician_id = p.id
GROUP BY p.id, p.full_name, p.party, p.canton;

-- Create politician influence view
CREATE OR REPLACE VIEW politician_influence AS
SELECT 
  p.id,
  p.full_name,
  p.party,
  p.canton,
  p.council,
  COALESCE(p.influence_score, 0) as influence_score,
  (SELECT COUNT(*) FROM interests i WHERE i.politician_id = p.id) as declared_interests,
  (SELECT COUNT(*) FROM interests i WHERE i.politician_id = p.id AND i.is_paid) as paid_positions,
  (SELECT COALESCE(SUM(i.compensation_chf), 0) FROM interests i WHERE i.politician_id = p.id) as total_compensation_chf,
  (SELECT COUNT(*) FROM mandates m WHERE m.politician_id = p.id) as total_mandates,
  (SELECT COUNT(*) FROM committee_memberships cm WHERE cm.politician_id = p.id) as committee_positions,
  CASE 
    WHEN p.council = 'Ständerat' THEN 2
    ELSE 1
  END as council_weight
FROM politicians p
ORDER BY influence_score DESC, total_compensation_chf DESC;

-- Create organization influence view
CREATE OR REPLACE VIEW organization_influence AS
SELECT 
  o.id,
  o.name,
  o.organization_type,
  o.industry_sector,
  COALESCE(o.politician_count, 0) as politician_count,
  COALESCE(o.total_connections, 0) as total_connections,
  COALESCE(o.total_compensation_chf, 0) as total_compensation_chf
FROM organizations o
ORDER BY total_compensation_chf DESC, politician_count DESC;