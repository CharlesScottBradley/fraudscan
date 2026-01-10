-- Function to get contribution stats for multiple politicians at once
-- Returns a table with politician_id, contribution_count, and total_amount

CREATE OR REPLACE FUNCTION get_politicians_contribution_stats(politician_ids uuid[])
RETURNS TABLE (
  politician_id uuid,
  contribution_count bigint,
  total_amount numeric
) AS $$
  SELECT 
    linked_politician_id as politician_id,
    COUNT(*) as contribution_count,
    COALESCE(SUM(transaction_amt), 0) as total_amount
  FROM fec_contributions
  WHERE linked_politician_id = ANY(politician_ids)
  GROUP BY linked_politician_id;
$$ LANGUAGE sql STABLE;

-- Also create a function for the leaderboard - top politicians by contributions
CREATE OR REPLACE FUNCTION get_top_politicians_by_contributions(limit_count int DEFAULT 10)
RETURNS TABLE (
  politician_id uuid,
  full_name text,
  party text,
  state text,
  office_title text,
  office_type text,
  contribution_count bigint,
  total_amount numeric
) AS $$
  SELECT 
    p.id as politician_id,
    p.full_name,
    p.party,
    p.state,
    p.office_title,
    p.office_type,
    COUNT(c.id) as contribution_count,
    COALESCE(SUM(c.transaction_amt), 0) as total_amount
  FROM politicians p
  INNER JOIN fec_contributions c ON c.linked_politician_id = p.id
  WHERE p.full_name IS NOT NULL AND p.full_name != ''
  GROUP BY p.id, p.full_name, p.party, p.state, p.office_title, p.office_type
  ORDER BY total_amount DESC
  LIMIT limit_count;
$$ LANGUAGE sql STABLE;

-- Grant access to these functions
GRANT EXECUTE ON FUNCTION get_politicians_contribution_stats(uuid[]) TO anon;
GRANT EXECUTE ON FUNCTION get_politicians_contribution_stats(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_politicians_by_contributions(int) TO anon;
GRANT EXECUTE ON FUNCTION get_top_politicians_by_contributions(int) TO authenticated;

-- Ensure we have an index on linked_politician_id for performance
CREATE INDEX IF NOT EXISTS idx_fec_contributions_linked_politician_id 
ON fec_contributions(linked_politician_id) 
WHERE linked_politician_id IS NOT NULL;
