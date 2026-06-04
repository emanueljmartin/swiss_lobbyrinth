/*
  # Enable RLS on organizations and political_parties tables

  ## Summary
  Two tables had RLS disabled, meaning no access control was enforced.
  This migration enables RLS and adds public read policies matching
  the existing pattern used by other tables in the schema.
*/

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE political_parties ENABLE ROW LEVEL SECURITY;

-- Public read-only access for organizations (same pattern as other tables)
CREATE POLICY "Public read access on organizations"
  ON organizations FOR SELECT
  TO authenticated, anon
  USING (true);

-- Public read-only access for political_parties
CREATE POLICY "Public read access on political_parties"
  ON political_parties FOR SELECT
  TO authenticated, anon
  USING (true);
