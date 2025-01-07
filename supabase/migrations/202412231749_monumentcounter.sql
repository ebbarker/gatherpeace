CREATE OR REPLACE FUNCTION public.get_signatures_and_countries()
RETURNS TABLE (
  signature_count int,
  unique_countries int
)
LANGUAGE sql
AS $$
    SELECT
      COUNT(DISTINCT l.user_id) FILTER (WHERE l.post_type = 'name') AS signature_count,
      COUNT(DISTINCT lc.sender_country) FILTER (WHERE l.post_type = 'name') AS unique_countries
    FROM letters l
    JOIN letter_contents lc ON l.id = lc.letter_id;
$$;