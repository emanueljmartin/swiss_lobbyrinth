/*
  # Deactivate synthetic politicians without real parliamentary IDs

  ## Summary
  Sets is_active = false for the 246 synthetic politicians that have no
  parliamentary_id (i.e., they were not matched to real Swiss Parliament OData
  records). The 254 real politicians (with parliamentary_id from the official
  API) remain active.

  This ensures only real, verified Federal Assembly members appear as active
  in the application.
*/

UPDATE politicians
SET is_active = false,
    updated_at = now()
WHERE parliamentary_id IS NULL
  AND is_active = true;
