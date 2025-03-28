-- SELECT DISTINCT lc.user_id, lc.sender_country AS country_in_contents, up.country AS country_in_profiles
-- FROM letter_contents lc
-- JOIN letters l ON lc.letter_id = l.id
-- JOIN user_profiles up ON lc.user_id = up.user_id
-- WHERE l.post_type = 'name'
-- AND (lc.sender_country IS DISTINCT FROM up.country);
ALTER TABLE letter_contents DROP COLUMN sender_country cascade;
ALTER TABLE letter_contents DROP COLUMN sender_state;
ALTER TABLE letter_contents DROP COLUMN sender_city;


-- Update the TSV trigger to pull country/state/city from user_profiles

drop function letters_tsv_trigger cascade;
CREATE OR REPLACE FUNCTION letters_tsv_trigger() RETURNS trigger AS $$
DECLARE
  user_country TEXT;
  user_state TEXT;
  user_city TEXT;
BEGIN
  -- Fetch the country/state/city from user_profiles
  SELECT country, state_province, city INTO user_country, user_state, user_city
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- Update TSV indexing with user_profiles data
  NEW.tsv := to_tsvector(
      'english',
      coalesce(NEW.sender_name, '') || ' ' ||
      coalesce(user_country, '') || ' ' ||
      coalesce(user_state, '') || ' ' ||
      coalesce(user_city, '') || ' ' ||
      coalesce(NEW.sign_off, '') || ' ' ||
      coalesce(NEW.recipient, '') || ' ' ||
      coalesce(NEW.content, '')
  );

  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Drop the old trigger and replace it with the updated version
DROP TRIGGER IF EXISTS trg_update_letter_contents_tsv ON letter_contents;
CREATE TRIGGER trg_update_letter_contents_tsv
BEFORE INSERT OR UPDATE ON letter_contents
FOR EACH ROW EXECUTE FUNCTION letters_tsv_trigger();

-- Update get_letters_with_tsv function to join on user_profiles for country/state/city
drop function get_letters_with_tsv;
CREATE OR REPLACE FUNCTION get_letters_with_tsv(
    page_number INT,
    search_keyword TEXT DEFAULT NULL,
    page_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    created_at TIMESTAMP WITH TIME ZONE,
    content TEXT,
    score INT,
    likes INT,
    path ltree,
    country text, -- Now coming from user_profiles
    state_province text, -- Now coming from user_profiles
    city text, -- Now coming from user_profiles
    sign_off text,
    sender_name text,
    recipient text,
    count_comments INT,
    post_type text,
    avatar_url text,
    username text,
    image_url text
) AS $$
BEGIN
    RETURN QUERY
    WITH LimitedLetters AS (
        SELECT l.id, l.user_id, l.created_at, l.path,
               l.score, l.likes, l.count_comments, l.post_type
        FROM letters l
        JOIN letter_contents lc ON l.id = lc.letter_id
        WHERE
            (search_keyword IS NULL OR lc.tsv @@ plainto_tsquery('english', search_keyword)) AND
            (page_filter IS NULL OR l.post_type = page_filter)
        ORDER BY l.created_at DESC
        LIMIT 10 OFFSET (page_number - 1) * 10
    )
    SELECT ll.id, ll.user_id, ll.created_at, lc.content, ll.score, ll.likes,
           ll.path, up.country, up.state_province, up.city, -- Now from user_profiles
           lc.sign_off, lc.sender_name, lc.recipient,
           ll.count_comments, ll.post_type, up.avatar_url, up.username,
           lc.image_url
    FROM LimitedLetters ll
    JOIN letter_contents lc ON ll.id = lc.letter_id
    LEFT JOIN user_profiles up ON ll.user_id = up.user_id
    ORDER BY ll.created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- Drop and recreate create_new_letter function
DROP FUNCTION IF EXISTS create_new_letter CASCADE;
-- (Then run the new `create_new_letter` function definition above)

-- Drop and recreate create_new_name function
DROP FUNCTION IF EXISTS create_new_name CASCADE;
-- (Then run the new `create_new_name` function definition above)

-- Drop and recreate get_single_letter_with_comments function
DROP FUNCTION IF EXISTS get_single_letter_with_comments CASCADE;
-- (Then run the new `get_single_letter_with_comments` function definition above)





CREATE OR REPLACE FUNCTION create_new_letter(
    "userId" uuid,
    "content" text,
    sign_off text,
    sender_name text,
    recipient text,
    post_type text
)
RETURNS TABLE(new_letter_id UUID, creation_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
AS $$
BEGIN
  WITH "inserted_letter" AS (
    INSERT INTO "letters" (
        "user_id",
        "path",
        "post_type"
    )
    VALUES (
        "userId",
        'root',
        post_type
    )
    RETURNING "id", "created_at"
  )
  SELECT "id", "created_at" INTO new_letter_id, creation_time FROM "inserted_letter";

  INSERT INTO "letter_contents" (
    "letter_id",
    "content",
    "user_id",
    "sign_off",
    "sender_name",
    "recipient"
  )
  VALUES (
    new_letter_id,
    "content",
    "userId",
    sign_off,
    sender_name,
    recipient
  );

  RETURN QUERY
  SELECT new_letter_id, creation_time;
END;
$$;


CREATE OR REPLACE FUNCTION create_new_name(
    "content" TEXT,
    recipient TEXT,
    sender_name TEXT,
    sign_off TEXT,
    "userId" UUID,
    image_url TEXT DEFAULT NULL
)
RETURNS TABLE(new_letter_id UUID, creation_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
AS $$
DECLARE
    user_country TEXT;
    user_state TEXT;
    user_city TEXT;
BEGIN
    -- Get user's location details
    SELECT country, state_province, city INTO user_country, user_state, user_city
    FROM user_profiles
    WHERE user_id = "userId";

    -- Check if the user has already signed
    IF EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE user_id = "userId" AND has_signed = TRUE
    ) THEN
        RAISE EXCEPTION 'You have already added your name';
    ELSE
        WITH "inserted_letter" AS (
            INSERT INTO "letters" (
                "user_id",
                "path",
                "post_type"
            )
            VALUES (
                "userId",
                'root',
                'name'
            )
            RETURNING "id", "created_at"
        )
        SELECT "id", "created_at" INTO new_letter_id, creation_time FROM "inserted_letter";

        INSERT INTO "letter_contents" (
            "letter_id",
            "content",
            "user_id",
            "sign_off",
            "sender_name",
            "recipient",
            "image_url"
        )
        VALUES (
            new_letter_id,
            "content",
            "userId",
            sign_off,
            sender_name,
            recipient,
            image_url
        );

        -- Mark user as signed
        UPDATE user_profiles
        SET has_signed = TRUE
        WHERE user_id = "userId";

        RETURN QUERY
        SELECT new_letter_id, creation_time;
    END IF;
END;
$$;






CREATE OR REPLACE FUNCTION get_single_letter_with_comments(p_letter_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    username text,
    created_at timestamp with time zone,
    content text,
    likes int,
    score int,
    path ltree,
    count_comments int,
    country text,
    state_province text,
    city text,
    sign_off text,
    sender_name text,
    recipient text,
    post_type text,
    avatar_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    -- Select the main letter details
    SELECT
        p.id,
        p.user_id,
        up.username,
        p.created_at,
        pc.content,
        p.likes,
        p.score,
        p.path,
        p.count_comments,
        up.country,  -- Now from user_profiles
        up.state_province,  -- Now from user_profiles
        up.city,  -- Now from user_profiles
        pc.sign_off,
        pc.sender_name,
        pc.recipient,
        p.post_type,
        up.avatar_url
    FROM letters p
    JOIN letter_contents pc ON p.id = pc.letter_id
    JOIN user_profiles up ON p.user_id = up.user_id
    WHERE p.id = p_letter_id

    UNION ALL

    -- Select the comments for the letter
    SELECT
        c.id,
        c.user_id,
        up2.username,
        c.created_at,
        c.content,
        c.likes,
        c.score,
        c.path,
        c.count_comments,
        NULL as country,
        NULL as state_province,
        NULL as city,
        NULL as sign_off,
        NULL as sender_name,
        NULL as recipient,
        'comment',
        up2.avatar_url
    FROM comments c
    JOIN user_profiles up2 ON c.user_id = up2.user_id
    WHERE c.path <@ text2ltree(concat('root.', replace(p_letter_id::text, '-', '_')));
END;
$$;
