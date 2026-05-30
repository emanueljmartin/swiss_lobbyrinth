/*
  # Add Conflict-of-Interest Detection System
*/

-- Create conflict detection view (renamed ID to avoid conflict)
CREATE OR REPLACE VIEW conflict_flags AS
SELECT DISTINCT
  p.id as politician_id,
  p.full_name,
  p.party,
  i.organization_name,
  i.role,
  i.compensation_chf,
  pv.title_de as related_vote_title,
  pv.policy_area,
  pv.vote_date,
  vr.vote_result,
  CASE 
    WHEN i.compensation_chf > 100000 THEN 'HIGH'
    WHEN i.compensation_chf > 50000 THEN 'MEDIUM'
    WHEN i.compensation_chf > 0 THEN 'LOW'
    ELSE 'MINIMAL'
  END as conflict_severity,
  'Financial interest in organization potentially affected by vote' as conflict_reason
FROM politicians p
JOIN interests i ON i.politician_id = p.id AND i.is_current = true
JOIN vote_records vr ON vr.politician_id = p.id
JOIN parliamentary_votes pv ON pv.id = vr.parliamentary_vote_id
WHERE i.is_paid = true
AND i.organization_name IS NOT NULL
ORDER BY conflict_severity, p.full_name, pv.vote_date DESC;

-- Create politician risk score view (simpler aggregation)
CREATE OR REPLACE VIEW politician_risk_scores AS
SELECT 
  p.id,
  p.full_name,
  p.party,
  p.canton,
  (SELECT COUNT(*) FROM conflict_flags cf WHERE cf.politician_id = p.id) as total_conflict_flags,
  (SELECT COUNT(*) FROM conflict_flags cf WHERE cf.politician_id = p.id AND cf.conflict_severity = 'HIGH') as high_severity_flags,
  (SELECT COUNT(*) FROM conflict_flags cf WHERE cf.politician_id = p.id AND cf.conflict_severity = 'MEDIUM') as medium_severity_flags,
  (SELECT COUNT(*) FROM interests i WHERE i.politician_id = p.id AND i.is_paid = true) as paid_interests_count,
  (SELECT COALESCE(SUM(i.compensation_chf), 0) FROM interests i WHERE i.politician_id = p.id AND i.is_paid = true) as total_compensation,
  (SELECT COUNT(*) FROM lobbying_meetings lm WHERE lm.politician_id = p.id) as lobbying_meetings_count
FROM politicians p
ORDER BY total_conflict_flags DESC, total_compensation DESC;

-- Create lobbying influence view
CREATE OR REPLACE VIEW lobbying_influence AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  o.industry_sector,
  COUNT(DISTINCT lm.id) as total_meetings,
  COUNT(DISTINCT lm.politician_id) as unique_politicians_contacted,
  SUM(lm.duration_minutes) as total_minutes,
  ARRAY_AGG(DISTINCT lm.subject) as subjects_discussed
FROM organizations o
LEFT JOIN lobbying_meetings lm ON lm.organization_id = o.id
GROUP BY o.id, o.name, o.industry_sector
HAVING COUNT(lm.id) > 0
ORDER BY total_meetings DESC;

-- Create campaign finance summary
CREATE OR REPLACE VIEW campaign_finance_summary AS
SELECT 
  p.id as politician_id,
  p.full_name,
  p.party,
  cc.election_year,
  COUNT(cc.id) as total_contributions,
  SUM(cc.amount_chf) as total_received_chf,
  SUM(CASE WHEN cc.contributor_type = 'company' THEN cc.amount_chf ELSE 0 END) as from_companies,
  SUM(CASE WHEN cc.contributor_type = 'individual' THEN cc.amount_chf ELSE 0 END) as from_individuals,
  SUM(CASE WHEN cc.contributor_type = 'party' THEN cc.amount_chf ELSE 0 END) as from_party,
  SUM(CASE WHEN cc.contributor_type = 'union' THEN cc.amount_chf ELSE 0 END) as from_unions,
  SUM(CASE WHEN cc.is_anonymous THEN cc.amount_chf ELSE 0 END) as anonymous_donations,
  ROUND(AVG(cc.amount_chf), 0) as avg_donation
FROM politicians p
JOIN campaign_contributions cc ON cc.politician_id = p.id
GROUP BY p.id, p.full_name, p.party, cc.election_year
ORDER BY total_received_chf DESC;