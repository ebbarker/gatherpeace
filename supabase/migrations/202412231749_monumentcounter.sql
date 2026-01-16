CREATE OR REPLACE FUNCTION public.get_signatures_and_countries()
RETURNS TABLE (
  signature_count int,
  unique_countries int
)
LANGUAGE sql
AS $$
    SELECT
      COUNT(*) AS signature_count,
      COUNT(DISTINCT country) FILTER (WHERE country IS NOT NULL AND country != '') AS unique_countries
    FROM user_profiles;
$$;