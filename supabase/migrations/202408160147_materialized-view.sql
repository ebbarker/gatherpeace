CREATE MATERIALIZED VIEW trending_tags_view AS
SELECT tag, COUNT(*) AS frequency
FROM tags
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tag
ORDER BY frequency DESC;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule('Refresh Trending Tags View', '*/5 * * * *', 'REFRESH MATERIALIZED VIEW trending_tags_view');
