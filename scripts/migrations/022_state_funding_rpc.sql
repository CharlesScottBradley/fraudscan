-- RPC function to get state funding totals efficiently
-- This runs server-side aggregation instead of fetching all rows

CREATE OR REPLACE FUNCTION get_state_funding_totals(state_code TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'ppp_total', COALESCE((SELECT SUM(current_approval_amount) FROM ppp_loans WHERE borrower_state = state_code), 0),
    'ppp_count', COALESCE((SELECT COUNT(*) FROM ppp_loans WHERE borrower_state = state_code), 0),
    'org_funding_total', COALESCE((SELECT SUM(total_government_funding) FROM organizations WHERE state = state_code), 0),
    'org_count', COALESCE((SELECT COUNT(*) FROM organizations WHERE state = state_code), 0),
    'grant_total', COALESCE((SELECT SUM(payment_amount) FROM state_grants WHERE source_state = state_code), 0),
    'grant_count', COALESCE((SELECT COUNT(*) FROM state_grants WHERE source_state = state_code), 0),
    'provider_funding', COALESCE((
      SELECT SUM(pay.total_amount)
      FROM payments pay
      JOIN providers prov ON pay.provider_id = prov.id
      WHERE prov.state = state_code
    ), 0),
    'provider_count', COALESCE((SELECT COUNT(*) FROM providers WHERE state = state_code), 0)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_state_funding_totals(TEXT) TO anon, authenticated, service_role;
