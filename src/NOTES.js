//QUERY TO GRAB LETTERS FROM TSV (Page, keyword):
explain analyze select * from get_letters_with_tsv(1, 'usa')

//execution time: 4ms

//ACTUAL QUERY:

CREATE OR REPLACE FUNCTION get_letters_with_tsv(
    page_number INT,
    search_keyword TEXT DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    created_at TIMESTAMP WITH TIME ZONE,
    content TEXT,
    score INT,
    likes INT,
    path ltree,
    sender_country text,
    sender_state text,
    sender_city text,
    sign_off text,
    sender_name text,
    recipient text,
    count_comments INT
) AS $$
BEGIN
    RETURN QUERY
    WITH LimitedLetters AS (
        SELECT l.id, l.user_id, l.created_at, l.path,
               l.sender_country, l.sender_state, l.sender_city,
               l.sender_name, l.sign_off, l.recipient, l.score, l.likes, l.count_comments
        FROM letters l
        WHERE
            (search_keyword IS NULL OR l.tsv @@ plainto_tsquery('english', search_keyword))
        ORDER BY l.score DESC, l.created_at DESC
        LIMIT 10 OFFSET (page_number - 1) * 10
    )
    SELECT ll.id, ll.user_id, ll.created_at, lc.content, ll.score, ll.likes,
           ll.path, ll.sender_country, ll.sender_state,
           ll.sender_city, ll.sign_off, ll.sender_name, ll.recipient, ll.count_comments
    FROM LimitedLetters ll
    JOIN letter_contents lc ON ll.id = lc.letter_id;
END;
$$ LANGUAGE plpgsql;