/*
  # Add Career Timeline and Relationship Tracking

  1. Purpose
    - Track professional/political career progression
    - Monitor lobbying consultations and meetings
    - Enable conflict-of-interest detection
    
  2. New Tables
    - career_milestones: Professional/political career events
    - lobbying_meetings: Consultations with interest groups
    - campaign_contributions: Election funding sources
*/

-- Career milestones table
CREATE TABLE IF NOT EXISTS career_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  milestone_type text NOT NULL CHECK (milestone_type IN (
    'election_nationalrat', 'election_staenderat', 'election_federal_council',
    'party_join', 'party_leave', 'party_leadership',
    'committee_join', 'committee_leave', 'committee_chair',
    'government_canton', 'government_commune',
    'board_position', 'executive_position', 'academic_appointment',
    'award', 'publication', 'other'
  )),
  title text NOT NULL,
  organization text,
  description text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  importance_weight integer DEFAULT 1 CHECK (importance_weight BETWEEN 1 AND 5),
  source text,
  created_at timestamptz DEFAULT now()
);

-- Lobbying meetings table
CREATE TABLE IF NOT EXISTS lobbying_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  meeting_type text NOT NULL CHECK (meeting_type IN ('consultation', 'hearing', 'working_group', 'informal', 'official_visit')),
  subject text NOT NULL,
  meeting_date date NOT NULL,
  location text,
  duration_minutes integer,
  attendees_count integer,
  outcome text,
  related_bill_id text,
  notes text,
  source text,
  created_at timestamptz DEFAULT now()
);

-- Campaign contributions table
CREATE TABLE IF NOT EXISTS campaign_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_year integer NOT NULL,
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE,
  contributor_name text NOT NULL,
  contributor_type text CHECK (contributor_type IN ('individual', 'company', 'party', 'association', 'union', 'other')),
  contributor_organization_id uuid REFERENCES organizations(id),
  amount_chf integer NOT NULL,
  contribution_type text CHECK (contribution_type IN ('donation', 'loan', 'in_kind', 'party_funding')),
  is_anonymous boolean DEFAULT false,
  declared_date date,
  source text,
  verification_status text DEFAULT 'declared' CHECK (verification_status IN ('declared', 'verified', 'under_review')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE career_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE lobbying_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contributions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Career milestones readable" ON career_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Career milestones insertable" ON career_milestones FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Lobbying meetings readable" ON lobbying_meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lobbying meetings insertable" ON lobbying_meetings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Campaign contributions readable" ON campaign_contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Campaign contributions insertable" ON campaign_contributions FOR INSERT TO authenticated WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_milestones_politician ON career_milestones(politician_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON career_milestones(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_lobbying_politician ON lobbying_meetings(politician_id);
CREATE INDEX IF NOT EXISTS idx_lobbying_org ON lobbying_meetings(organization_id);
CREATE INDEX IF NOT EXISTS idx_lobbying_date ON lobbying_meetings(meeting_date DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_politician ON campaign_contributions(politician_id);
CREATE INDEX IF NOT EXISTS idx_campaign_year ON campaign_contributions(election_year);