/*
  # Seed Predictive Models and Voting Clusters
*/

-- Create party loyalty models
INSERT INTO party_alignment_models (party, loyalty_baseline, average_cohesion, model_accuracy, model_version, trained_on_votes)
VALUES 
  ('SVP', 0.82, 0.78, 0.84, 'v1.0', 145),
  ('FDP', 0.79, 0.75, 0.81, 'v1.0', 145),
  ('SP', 0.85, 0.81, 0.86, 'v1.0', 145),
  ('Mitte', 0.77, 0.72, 0.78, 'v1.0', 145),
  ('GPS', 0.88, 0.85, 0.89, 'v1.0', 145),
  ('GLP', 0.74, 0.68, 0.75, 'v1.0', 145);

-- Define voting pattern clusters
INSERT INTO voting_pattern_clusters (cluster_id, cluster_name, description, average_loyalty, key_characteristics, typical_parties)
VALUES 
  (1, 'Party Loyalists', 'Strictly follow party line, rarely deviate', 0.92, ARRAY['consistent', 'predictable', 'high_discipline'], ARRAY['SP', 'GPS']),
  (2, 'Pragmatists', 'Vote based on policy content, occasional defections', 0.75, ARRAY['issue_based', 'moderate_cohesion', 'tactical'], ARRAY['FDP', 'Mitte']),
  (3, 'Independents', 'Vote freely, low party correlation', 0.55, ARRAY['unpredictable', 'principle_driven', 'rare_voting'], ARRAY['Independent']),
  (4, 'Regional Advocates', 'Balance party loyalty with cantonal interests', 0.68, ARRAY['regional_focus', 'selective_defection', 'compromise'], ARRAY['SVP', 'Mitte']),
  (5, 'Specialists', 'High expertise in specific policy areas', 0.73, ARRAY['expert_voting', 'committee_focused', 'technical'], ARRAY['FDP', 'SP']);

-- Assign politicians to clusters
INSERT INTO politician_cluster_membership (politician_id, cluster_id, confidence_score)
SELECT 
  p.id,
  CASE p.party
    WHEN 'SP' THEN 1
    WHEN 'GPS' THEN 1
    WHEN 'FDP' THEN 2
    WHEN 'Mitte' THEN 2
    WHEN 'SVP' THEN 4
    WHEN 'Independent' THEN 3
    ELSE FLOOR(RANDOM() * 5 + 1)::int
  END,
  0.7 + RANDOM() * 0.25
FROM politicians p
ORDER BY RANDOM()
LIMIT 200;

-- Create voting predictions
INSERT INTO politician_voting_predictions (politician_id, predicted_vote, confidence_score, model_version, based_on_factors)
SELECT 
  p.id,
  CASE 
    WHEN random() < 0.6 THEN 'YES'
    WHEN random() < 0.85 THEN 'NO'
    ELSE 'ABSTAIN'
  END,
  0.65 + RANDOM() * 0.3,
  'v1.0',
  ARRAY['party_platform', 'historical_votes', 'committee_assignment', 'regional_interest']
FROM politicians p
WHERE random() < 0.4
LIMIT 80;

-- Create outcome predictions
INSERT INTO legislative_outcome_predictions (vote_id, predicted_outcome, confidence_score, predicted_yes_count, predicted_no_count, analysis)
SELECT 
  gen_random_uuid(),
  CASE 
    WHEN random() < 0.45 THEN 'PASS'
    WHEN random() < 0.8 THEN 'FAIL'
    ELSE 'CLOSE'
  END,
  0.70 + RANDOM() * 0.2,
  FLOOR(100 + RANDOM() * 46)::int,
  FLOOR(80 + RANDOM() * 46)::int,
  'Prediction based on current party composition and historical voting patterns'
FROM generate_series(1, 30);