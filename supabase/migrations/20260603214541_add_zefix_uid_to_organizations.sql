/*
  # Add zefix_uid column to organizations

  Adds a `zefix_uid` column to the organizations table so the Zefix sync
  edge function can back-fill official Swiss commercial registry UIDs
  (format CHE-xxx.xxx.xxx) after matching by name.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'zefix_uid'
  ) THEN
    ALTER TABLE organizations ADD COLUMN zefix_uid text;
    CREATE INDEX IF NOT EXISTS idx_organizations_zefix_uid ON organizations(zefix_uid);
  END IF;
END $$;
