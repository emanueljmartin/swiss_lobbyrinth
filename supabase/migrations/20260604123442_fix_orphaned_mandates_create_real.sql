/*
  # Fix orphaned mandates: deactivate synthetic, create real from Parliament data

  ## Summary
  - Marks all 357 synthetic mandates (referencing deactivated politicians) as is_current=false
  - Creates real mandate records from parliament_members_raw.mandates_text
    by parsing the semi-structured text and linking to real politicians via parliamentary_id

  ## Details
  - Synthetic mandates linked to is_active=false politicians are set is_current=false
  - New mandates are created from the OData mandates_text field
  - Each parsed mandate entry is linked to the real politician record
*/

-- Step 1: Mark synthetic mandates as non-current
UPDATE mandates
SET is_current = false
WHERE politician_id IN (
  SELECT id FROM politicians WHERE is_active = false
);

-- Step 2: Get organizations table IDs for linking
-- First ensure org records exist for common mandate organizations
-- Parse mandates_text from parliament_members_raw and insert as real mandates
-- Using a PL/pgSQL block to parse the semicolon-separated mandate entries

DO $$
DECLARE
  r RECORD;
  p_id uuid;
  entries text[];
  entry text;
  org_name text;
  role text;
BEGIN
  FOR r IN
    SELECT m.person_number, m.mandates_text, p.id as politician_uuid
    FROM parliament_members_raw m
    JOIN politicians p ON p.parliamentary_id = m.person_number::text
    WHERE m.mandates_text IS NOT NULL
      AND m.mandates_text != ''
      AND p.is_active = true
  LOOP
    p_id := r.politician_uuid;
    -- Split by semicolons (Swiss format for mandate lists)
    entries := string_to_array(r.mandates_text, ';');

    FOR i IN 1..array_length(entries, 1) LOOP
      entry := trim(entries[i]);
      IF length(entry) < 3 THEN CONTINUE; END IF;

      -- Try to extract role prefix (e.g. "Präs." "Mitglied" "Vizepräs.")
      -- and organization name after
      IF entry ~* '^(Präs\.?|Präsident|Mitglied|Vizepräs\.?|Vizepräsident|Delegierter|Kassier|Sekretär|Co-Präs\.?)\s+' THEN
        role := regexp_replace(
          regexp_replace(entry, '^((?:(?:Präs|Vizepräs|Co-Präs)\.?\s*|Präsident(?:in)?\s*|Mitglied\s*|Delegierte(?:r|n)?\s*|Kassier(?:in)?\s*|Sekretär(?:in)?\s*|Vizepräsident(?:in)?\s*)).*', '\1'),
          '\s+$', ''
        );
        org_name := trim(regexp_replace(entry, '^(?:(?:Präs|Vizepräs|Co-Präs)\.?\s*|Präsident(?:in)?\s*|Mitglied\s*|Delegierte(?:r|n)?\s*|Kassier(?:in)?\s*|Sekretär(?:in)?\s*|Vizepräsident(?:in)?\s*)', ''));
      ELSE
        role := 'Mitglied';
        org_name := entry;
      END IF;

      -- Only insert if org_name looks meaningful (>5 chars, not just a date)
      IF length(org_name) > 5 AND org_name !~ '^\d{4}' THEN
        INSERT INTO mandates (
          politician_id, organization_name, role_title,
          mandate_type, industry_sector, is_paid, is_current,
          confidence_score, notes
        ) VALUES (
          p_id,
          org_name,
          role,
          'HAS_MANDATE_IN',
          NULL,
          NULL,
          true,
          0.7,
          'Source: Swiss Parliament OData MemberCouncil.mandates'
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;
