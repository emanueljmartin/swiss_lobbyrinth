/*
  # Populate voting_similarity from vote_records

  ## Summary
  Computes MP-to-MP voting similarity pairs from existing vote_records.
  Each pair gets similarity_score (fraction of aligned votes) and vote counts.
  Only pairs with >= 3 shared votes are included for statistical significance.
  is_cross_party is auto-generated from party_a <> party_b.
*/

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
WHERE a.politician_id IN (SELECT id FROM politicians WHERE is_active = true)
  AND b.politician_id IN (SELECT id FROM politicians WHERE is_active = true)
GROUP BY a.politician_id, b.politician_id, pa.party, pb.party
HAVING count(*) >= 3
ON CONFLICT (politician_a_id, politician_b_id) DO UPDATE SET
  votes_compared  = EXCLUDED.votes_compared,
  votes_aligned   = EXCLUDED.votes_aligned,
  similarity_score = EXCLUDED.similarity_score,
  party_a         = EXCLUDED.party_a,
  party_b         = EXCLUDED.party_b;
