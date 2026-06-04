/*
  # Re-link vote_records from synthetic to real politicians

  ## Summary
  The 930 vote_records reference old synthetic politician UUIDs (is_active=false).
  This migration re-links them to the real, active politician records by matching
  on full_name. 290 of 930 records can be matched this way.

  After re-linking, the voting_similarity computation will work with active politicians.
*/

-- Create a mapping table from old synthetic politician IDs to new real politician IDs
CREATE TEMP TABLE _pid_map AS
SELECT old_p.id as old_id, new_p.id as new_id
FROM politicians old_p
JOIN politicians new_p ON new_p.full_name = old_p.full_name AND new_p.is_active = true
WHERE old_p.is_active = false;

-- Update vote_records to point to real politicians
UPDATE vote_records vr
SET politician_id = pm.new_id
FROM _pid_map pm
WHERE vr.politician_id = pm.old_id;

-- Now recompute voting_similarity with the corrected data
INSERT INTO voting_similarity (politician_a_id, politician_b_id, party_a, party_b, votes_compared, votes_aligned, similarity_score)
SELECT
  a.politician_id,
  b.politician_id,
  pa.party,
  pb.party,
  count(*) as votes_compared,
  count(*) FILTER (WHERE a.vote_result = b.vote_result) as votes_aligned,
  CASE WHEN count(*) > 0
    THEN count(*) FILTER (WHERE a.vote_result = b.vote_result)::float / count(*)
    ELSE 0
  END as similarity_score
FROM vote_records a
JOIN vote_records b ON a.parliamentary_vote_id = b.parliamentary_vote_id AND a.politician_id < b.politician_id
JOIN politicians pa ON pa.id = a.politician_id
JOIN politicians pb ON pb.id = b.politician_id
WHERE pa.is_active = true AND pb.is_active = true
GROUP BY a.politician_id, b.politician_id, pa.party, pb.party
HAVING count(*) >= 2
ON CONFLICT (politician_a_id, politician_b_id) DO UPDATE SET
  votes_compared  = EXCLUDED.votes_compared,
  votes_aligned   = EXCLUDED.votes_aligned,
  similarity_score = EXCLUDED.similarity_score,
  party_a         = EXCLUDED.party_a,
  party_b         = EXCLUDED.party_b;
