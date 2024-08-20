CREATE MATERIALIZED VIEW trending_tags_view AS
SELECT tag, COUNT(*) AS frequency
FROM tags
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tag
ORDER BY frequency DESC;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('Refresh Trending Tags View', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW trending_tags_view');

CREATE OR REPLACE FUNCTION get_letter_likes(letter_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    country TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id,
        up.username,
        up.full_name,
        up.avatar_url,
        up.country
    FROM
        letter_votes lv
    JOIN
        user_profiles up
    ON
        lv.user_id = up.user_id
    WHERE
        lv.letter_id = letter_uuid
    AND
        lv.vote_type = 'up';
END;
$$ LANGUAGE plpgsql;



CREATE MATERIALIZED VIEW top_100_letters AS
SELECT l.id, l.user_id, l.created_at, lc.content, l.score, l.likes, l.path,
       lc.sender_country, lc.sender_state, lc.sender_city, lc.sign_off,
       lc.sender_name, lc.recipient, l.count_comments, l.post_type,
       up.avatar_url, up.username
FROM letters l
JOIN letter_contents lc ON l.id = lc.letter_id
LEFT JOIN user_profiles up ON l.user_id = up.user_id
ORDER BY l.score DESC, l.created_at DESC
LIMIT 100;

SELECT cron.schedule('refresh_top_100_letters', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW top_100_letters');