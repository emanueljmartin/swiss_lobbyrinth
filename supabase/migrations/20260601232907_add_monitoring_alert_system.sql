/*
  # Add Real-Time Monitoring & Alert System

  1. Purpose
    - Track new conflicts as they occur
    - Monitor voting pattern changes
    - Alert on transparency violations
    - Generate activity summaries
    
  2. New Tables
    - alerts: Generated alerts from system
    - alert_subscriptions: User alert preferences
    - activity_log: Track all significant events
*/

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL CHECK (alert_type IN (
    'new_conflict', 'voting_anomaly', 'interest_conflict',
    'lobbying_spike', 'funding_anomaly', 'party_defection',
    'position_change', 'transparency_breach', 'network_anomaly'
  )),
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  data_snapshot jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  triggered_by text -- 'system', 'manual', 'scheduled_check'
);

-- Alert subscriptions
CREATE TABLE IF NOT EXISTS alert_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  party text,
  canton text,
  alert_types text[] DEFAULT ARRAY['new_conflict', 'voting_anomaly', 'interest_conflict'],
  min_severity text DEFAULT 'MEDIUM' CHECK (min_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  email text,
  notify_email boolean DEFAULT true,
  notify_in_app boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Activity log for tracking significant events
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'vote_recorded', 'interest_declared', 'meeting_held', 'contribution_received',
    'milestone_created', 'conflict_detected', 'alert_triggered', 'pattern_anomaly'
  )),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  event_data jsonb,
  impact_score numeric, -- 0-100
  created_at timestamptz DEFAULT now()
);

-- Voting anomaly detection view
CREATE TABLE IF NOT EXISTS voting_anomalies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  vote_id uuid NOT NULL,
  anomaly_type text NOT NULL CHECK (anomaly_type IN (
    'party_defection', 'rare_abstention', 'position_shift',
    'block_voting', 'unusual_pattern'
  )),
  severity numeric DEFAULT 0.5 CHECK (severity BETWEEN 0 AND 1),
  expected_vote text,
  actual_vote text,
  confidence_score numeric,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_anomalies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Alerts readable" ON alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Alerts insertable" ON alerts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Subscriptions readable by owner" ON alert_subscriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Subscriptions insertable" ON alert_subscriptions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Activity log readable" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Activity log insertable" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anomalies readable" ON voting_anomalies FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_politician ON alerts(politician_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON alert_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON activity_log(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_politician ON voting_anomalies(politician_id);