/*
  # Add Predictive Analytics & Models

  1. Purpose
    - Store ML model predictions
    - Track voting behavior patterns
    - Predict legislative outcomes
    - Identify influence networks
    
  2. New Tables
    - politician_voting_predictions: Predicted votes
    - party_alignment_models: Party loyalty models
    - voting_pattern_clusters: Voting behavior groups
    - legislative_outcome_predictions: Bill outcome predictions
*/

-- Politician voting predictions
CREATE TABLE IF NOT EXISTS politician_voting_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  upcoming_vote_id uuid,
  predicted_vote text CHECK (predicted_vote IN ('YES', 'NO', 'ABSTAIN')),
  confidence_score numeric CHECK (confidence_score BETWEEN 0 AND 1),
  model_version text,
  based_on_factors text[],
  created_at timestamptz DEFAULT now(),
  actual_vote text,
  was_correct boolean GENERATED ALWAYS AS (
    CASE WHEN actual_vote = predicted_vote THEN true ELSE false END
  ) STORED
);

-- Party alignment model
CREATE TABLE IF NOT EXISTS party_alignment_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party text NOT NULL UNIQUE,
  loyalty_baseline numeric DEFAULT 0.75 CHECK (loyalty_baseline BETWEEN 0 AND 1),
  average_cohesion numeric,
  deviation_threshold numeric,
  model_accuracy numeric,
  model_version text,
  trained_on_votes integer,
  last_trained timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Voting pattern clusters
CREATE TABLE IF NOT EXISTS voting_pattern_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id integer,
  cluster_name text,
  description text,
  politician_count integer,
  average_loyalty numeric,
  key_characteristics text[],
  typical_parties text[],
  created_at timestamptz DEFAULT now()
);

-- Politician cluster membership
CREATE TABLE IF NOT EXISTS politician_cluster_membership (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  cluster_id integer NOT NULL,
  confidence_score numeric,
  created_at timestamptz DEFAULT now()
);

-- Legislative outcome predictions
CREATE TABLE IF NOT EXISTS legislative_outcome_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id uuid NOT NULL,
  predicted_outcome text CHECK (predicted_outcome IN ('PASS', 'FAIL', 'CLOSE')),
  confidence_score numeric CHECK (confidence_score BETWEEN 0 AND 1),
  predicted_yes_count integer,
  predicted_no_count integer,
  key_swing_politicians uuid[],
  analysis text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE politician_voting_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_alignment_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_pattern_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE politician_cluster_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislative_outcome_predictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Predictions readable" ON politician_voting_predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Models readable" ON party_alignment_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "Clusters readable" ON voting_pattern_clusters FOR SELECT TO authenticated USING (true);
CREATE POLICY "Membership readable" ON politician_cluster_membership FOR SELECT TO authenticated USING (true);
CREATE POLICY "Outcomes readable" ON legislative_outcome_predictions FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_predictions_politician ON politician_voting_predictions(politician_id);
CREATE INDEX IF NOT EXISTS idx_predictions_accuracy ON politician_voting_predictions(was_correct);
CREATE INDEX IF NOT EXISTS idx_models_party ON party_alignment_models(party);
CREATE INDEX IF NOT EXISTS idx_membership_politician ON politician_cluster_membership(politician_id);
CREATE INDEX IF NOT EXISTS idx_membership_cluster ON politician_cluster_membership(cluster_id);