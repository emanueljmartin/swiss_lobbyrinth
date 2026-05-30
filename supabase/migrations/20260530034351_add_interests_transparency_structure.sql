/*
  # Add Interests/Verwaltungsrat Transparency Data Structure

  1. Purpose
    - Swiss politicians must declare board positions (Verwaltungsrat)
    - Add explicit transparency declarations table
    - Map to organizations with compensation levels
    
  2. New Tables
    - interests: Official transparency declarations
    - Links politicians to organizations with declared income ranges
    
  3. Security
    - Enable RLS, restrict to authenticated users
*/

CREATE TABLE IF NOT EXISTS interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id uuid REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name text NOT NULL,
  role text NOT NULL,
  function_type text NOT NULL, -- 'board_member', 'advisory_board', 'president', etc.
  is_paid boolean DEFAULT false,
  compensation_range text,
  compensation_exact numeric,
  compensation_chf integer,
  ownership_percentage numeric,
  is_current boolean DEFAULT true,
  start_date date,
  end_date date,
  declaration_year integer NOT NULL DEFAULT date_part('year', CURRENT_DATE)::integer,
  source_document text,
  source_url text,
  verification_status text DEFAULT 'declared' CHECK (verification_status IN ('declared', 'verified', 'disputed', 'inactive')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Interests are publicly readable"
  ON interests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert interests"
  ON interests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update interests"
  ON interests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_interests_politician ON interests(politician_id);
CREATE INDEX IF NOT EXISTS idx_interests_organization ON interests(organization_id);
CREATE INDEX IF NOT EXISTS idx_interests_year ON interests(declaration_year);

-- Add voting behavior tracking fields
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS voting_attendance numeric;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS party_loyalty_score numeric;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS cross_voting_count integer DEFAULT 0;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS influence_score numeric DEFAULT 0;

-- Add organization influence metrics
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_connections integer DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_compensation_chf integer DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS politician_count integer DEFAULT 0;