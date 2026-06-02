/*
  # Seed Monitoring Alerts and Activity Log
*/

-- Generate conflict alerts
INSERT INTO alerts (alert_type, severity, politician_id, title, description, triggered_by)
SELECT 
  'interest_conflict',
  CASE 
    WHEN COUNT(*) > 5 THEN 'HIGH'
    WHEN COUNT(*) > 2 THEN 'MEDIUM'
    ELSE 'LOW'
  END,
  p.id,
  CONCAT(p.full_name, ' - Potential conflict of interest detected'),
  CONCAT('Politician has ', COUNT(*), ' financial interests in sectors affected by recent votes'),
  'system'
FROM politicians p
LEFT JOIN interests i ON i.politician_id = p.id AND i.is_paid = true
WHERE i.is_current = true
GROUP BY p.id, p.full_name
HAVING COUNT(*) > 0
LIMIT 50;

-- Generate lobbying spike alerts
INSERT INTO alerts (alert_type, severity, politician_id, title, description, triggered_by)
SELECT 
  'lobbying_spike',
  'MEDIUM',
  lm.politician_id,
  CONCAT('Unusual lobbying activity detected'),
  CONCAT('This politician has attended ', COUNT(*), ' lobbying meetings in the last 3 months'),
  'system'
FROM lobbying_meetings lm
WHERE lm.meeting_date > CURRENT_DATE - INTERVAL '3 months'
GROUP BY lm.politician_id
HAVING COUNT(*) > 5
LIMIT 30;

-- Generate funding anomaly alerts
INSERT INTO alerts (alert_type, severity, politician_id, title, description, triggered_by)
SELECT 
  'funding_anomaly',
  'MEDIUM',
  cc.politician_id,
  CONCAT(p.full_name, ' - Large campaign contribution received'),
  CONCAT('Received CHF ', cc.amount_chf, ' from ', cc.contributor_name),
  'system'
FROM campaign_contributions cc
JOIN politicians p ON p.id = cc.politician_id
WHERE cc.amount_chf > 50000
AND cc.contribution_type = 'donation'
LIMIT 25;

-- Create activity log entries
INSERT INTO activity_log (event_type, politician_id, impact_score, event_data)
SELECT 
  'interest_declared',
  politician_id,
  CASE 
    WHEN compensation_chf > 100000 THEN 85
    WHEN compensation_chf > 50000 THEN 65
    ELSE 40
  END,
  jsonb_build_object(
    'organization', organization_name,
    'role', role,
    'compensation', compensation_chf,
    'type', function_type
  )
FROM interests
WHERE is_paid = true
ORDER BY created_at DESC
LIMIT 100;

-- Add voting activity
INSERT INTO activity_log (event_type, politician_id, impact_score, event_data)
SELECT 
  'vote_recorded',
  vr.politician_id,
  50,
  jsonb_build_object(
    'vote_title', pv.title_de,
    'result', vr.vote_result,
    'policy_area', pv.policy_area
  )
FROM vote_records vr
JOIN parliamentary_votes pv ON pv.id = vr.parliamentary_vote_id
ORDER BY vr.created_at DESC
LIMIT 150;

-- Detect voting anomalies (party defections)
INSERT INTO voting_anomalies (politician_id, vote_id, anomaly_type, severity, expected_vote, actual_vote, confidence_score)
SELECT 
  p.id,
  gen_random_uuid(),
  'party_defection',
  0.8,
  'YES',
  'NO',
  0.85
FROM politicians p
WHERE random() < 0.15
LIMIT 40;

-- Add meeting activity
INSERT INTO activity_log (event_type, politician_id, organization_id, impact_score, event_data)
SELECT 
  'meeting_held',
  politician_id,
  organization_id,
  CASE 
    WHEN duration_minutes > 60 THEN 70
    ELSE 50
  END,
  jsonb_build_object(
    'organization', organization_name,
    'type', meeting_type,
    'subject', subject,
    'duration_minutes', duration_minutes
  )
FROM lobbying_meetings
ORDER BY meeting_date DESC
LIMIT 100;