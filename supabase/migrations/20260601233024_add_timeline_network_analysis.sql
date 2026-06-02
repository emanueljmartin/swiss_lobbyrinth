/*
  # Add Policy Timeline & Social Network Analysis

  1. Purpose
    - Track legislation timeline
    - Analyze politician networks
    - Detect coalitions and influence patterns
*/

-- Create policy timeline view
CREATE OR REPLACE VIEW policy_timeline AS
SELECT 
  pv.vote_date,
  pv.title_de as bill_title,
  pv.policy_area,
  pv.result as outcome,
  COUNT(DISTINCT vr.politician_id) as votes_cast,
  SUM(CASE WHEN vr.vote_result = 'YES' THEN 1 ELSE 0 END) as yes_votes,
  SUM(CASE WHEN vr.vote_result = 'NO' THEN 1 ELSE 0 END) as no_votes,
  ARRAY_AGG(DISTINCT p.party) as parties_involved,
  ROUND(AVG(CASE WHEN vr.vote_result = 'YES' THEN 1 ELSE 0 END)::numeric * 100, 1) as support_percentage
FROM parliamentary_votes pv
LEFT JOIN vote_records vr ON vr.parliamentary_vote_id = pv.id
LEFT JOIN politicians p ON p.id = vr.politician_id
GROUP BY pv.id, pv.vote_date, pv.title_de, pv.policy_area, pv.result
ORDER BY pv.vote_date DESC;

-- Create politician network view (co-voting patterns)
CREATE OR REPLACE VIEW politician_network_links AS
SELECT 
  LEAST(vr1.politician_id, vr2.politician_id) as politician_1,
  GREATEST(vr1.politician_id, vr2.politician_id) as politician_2,
  COUNT(*) as votes_together,
  COUNT(CASE WHEN vr1.vote_result = vr2.vote_result THEN 1 END) as aligned_votes,
  ROUND(
    COUNT(CASE WHEN vr1.vote_result = vr2.vote_result THEN 1 END)::numeric / 
    NULLIF(COUNT(*), 0) * 100,
    1
  ) as alignment_percentage,
  ARRAY_AGG(DISTINCT p1.party) as politician_1_party,
  ARRAY_AGG(DISTINCT p2.party) as politician_2_party
FROM vote_records vr1
JOIN vote_records vr2 ON vr1.parliamentary_vote_id = vr2.parliamentary_vote_id 
  AND vr1.politician_id < vr2.politician_id
JOIN politicians p1 ON p1.id = vr1.politician_id
JOIN politicians p2 ON p2.id = vr2.politician_id
WHERE vr1.vote_result IN ('YES', 'NO') 
  AND vr2.vote_result IN ('YES', 'NO')
GROUP BY vr1.politician_id, vr2.politician_id, p1.party, p2.party
HAVING COUNT(*) >= 5
ORDER BY aligned_votes DESC;

-- Create coalition detection view
CREATE OR REPLACE VIEW political_coalitions AS
SELECT 
  p.party as coalition_name,
  COUNT(DISTINCT p.id) as member_count,
  ROUND(AVG(pi.influence_score), 1) as avg_influence,
  STRING_AGG(DISTINCT cm.role, ', ') as leadership_positions,
  COUNT(DISTINCT c.id) as committee_positions,
  ROUND(AVG(CASE WHEN i.is_paid THEN i.compensation_chf ELSE 0 END), 0) as avg_compensation
FROM politicians p
LEFT JOIN politician_influence pi ON pi.id = p.id
LEFT JOIN committee_memberships cm ON cm.politician_id = p.id
LEFT JOIN committees c ON c.id = cm.committee_id
LEFT JOIN interests i ON i.politician_id = p.id
GROUP BY p.party
ORDER BY member_count DESC;

-- Network influence hub analysis
CREATE OR REPLACE VIEW network_influence_hubs AS
SELECT 
  p.id,
  p.full_name,
  p.party,
  COUNT(DISTINCT pnl.politician_2) as network_connections,
  AVG(pnl.alignment_percentage) as avg_alignment,
  COUNT(DISTINCT lm.id) as lobbying_contacts,
  COUNT(DISTINCT cm.committee_id) as committee_membership_count,
  ROUND(AVG(pi.influence_score), 1) as influence_score,
  CASE 
    WHEN COUNT(DISTINCT pnl.politician_2) > 50 THEN 'MAJOR_HUB'
    WHEN COUNT(DISTINCT pnl.politician_2) > 30 THEN 'REGIONAL_HUB'
    WHEN COUNT(DISTINCT pnl.politician_2) > 15 THEN 'SECTOR_HUB'
    ELSE 'CONNECTED'
  END as hub_type
FROM politicians p
LEFT JOIN politician_network_links pnl ON p.id = pnl.politician_1 OR p.id = pnl.politician_2
LEFT JOIN lobbying_meetings lm ON lm.politician_id = p.id
LEFT JOIN committee_memberships cm ON cm.politician_id = p.id
LEFT JOIN politician_influence pi ON pi.id = p.id
GROUP BY p.id, p.full_name, p.party
ORDER BY network_connections DESC;