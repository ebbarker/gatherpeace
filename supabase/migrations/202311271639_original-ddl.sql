CREATE TABLE letters (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid REFERENCES auth.users (id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    path ltree NOT NULL,
    sender_country text,
    sender_state text,
    sender_city text,
    sign_off text,
    sender_name text,
    recipient text,
    score int DEFAULT 0 NOT NULL,
    count_comments INT DEFAULT 0 NOT NULL,
    likes int DEFAULT 0 NOT NULL,
    post_type text,
);


CREATE TABLE letter_contents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid REFERENCES auth.users (id) NOT NULL,
    letter_id uuid REFERENCES letters (id) NOT NULL,
    content text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE letter_votes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    letter_id uuid REFERENCES letters (id) NOT NULL,
    user_id uuid REFERENCES auth.users (id) NOT NULL,
    vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
    UNIQUE (letter_id, user_id)
);

CREATE TABLE letter_comments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid REFERENCES auth.users (id) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    path ltree NOT NULL,
    score int DEFAULT 0 NOT NULL,
    content text NOT NULL
);


CREATE OR REPLACE FUNCTION update_letter_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_letter_id uuid;
    new_likes INT;
    comment_count INT;
BEGIN
    -- Determine which record (OLD or NEW) to refer to based on the operation.
    IF TG_OP = 'DELETE' THEN
        target_letter_id := OLD.letter_id;
    ELSE
        target_letter_id := NEW.letter_id;
    END IF;

    -- Calculate new likes
    SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
    INTO new_likes
    FROM letter_votes
    WHERE letter_id = target_letter_id;

    -- Calculate comment count for the letter
    SELECT COUNT(*)
    INTO comment_count
    FROM comments
    WHERE path <@ text2ltree(concat('root.', replace(target_letter_id::text, '-', '_')));

    -- Update likes and score in the letters table
    UPDATE letters
    SET likes = new_likes,
        score = (comment_count * 2) + new_likes
    WHERE id = target_letter_id;

    RETURN null;
END;
$$;



create trigger update_letter_score
    after insert or update or delete
    on letter_votes
    for each row execute procedure update_letter_score();


CREATE OR REPLACE FUNCTION insert_letter_vote(
    p_letter_id uuid,
    p_user_id uuid,
    p_vote_type text
)
RETURNS json AS $$
DECLARE
    v_xmax bigint;
BEGIN
    INSERT INTO letter_votes (letter_id, user_id, vote_type)
    VALUES (p_letter_id, p_user_id, p_vote_type)
    ON CONFLICT (letter_id, user_id)
    DO UPDATE SET
        vote_type = EXCLUDED.vote_type
    RETURNING xmax INTO v_xmax;

    IF v_xmax = 0 THEN
        RETURN json_build_object('status', 'success', 'message', 'New vote created');
    ELSE
        RETURN json_build_object('status', 'success', 'message', 'Vote updated');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION delete_letter_vote(p_user_id uuid, p_letter_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    rows_deleted INT;
BEGIN
    DELETE FROM letter_votes
    WHERE user_id = p_user_id AND letter_id = p_letter_id
    RETURNING 1 INTO rows_deleted;
    RETURN rows_deleted;
END;
$$;


CREATE OR REPLACE FUNCTION get_letters(page_number INT)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    created_at TIMESTAMP WITH TIME ZONE,
    content TEXT,
    score INT,
    likes INT,
    username TEXT,
    path ltree,
    sender text,
    sender_country text,
    sender_state text,
    sender_city text,
    sign_off text,
    sender_name text,
    recipient text,
    recipient_country text,
    recipient_state text,
    recipient_city text,
    count_comments INT
) AS $$
BEGIN
    RETURN QUERY
    WITH LimitedLetters AS (
        SELECT l.id, l.user_id, l.created_at, l.path, l.sender,
               l.sender_country, l.sender_state, l.sender_city,
               l.sender_name, l.sign_off, l.recipient, l.recipient_country,
               l.recipient_state, l.recipient_city, l.score, l.likes, l.count_comments
        FROM letters l
        ORDER BY l.score DESC, l.created_at DESC
        LIMIT 10 OFFSET (page_number - 1) * 10
    )
    SELECT ll.id, ll.user_id, ll.created_at, lc.content, ll.score, ll.likes, up.username,
           ll.path, ll.sender, ll.sender_country, ll.sender_state,
           ll.sender_city, ll.sign_off, ll.sender_name, ll.recipient, ll.recipient_country,
           ll.recipient_state, ll.recipient_city, ll.count_comments
    FROM LimitedLetters ll
    JOIN letter_contents lc ON ll.id = lc.letter_id
    JOIN user_profiles up ON ll.user_id = up.user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_letters_with_keyword_join_on_content(
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
    WITH
    FilteredLetters AS (
        SELECT l.id, l.user_id, l.created_at, l.path,
               l.sender_country, l.sender_state, l.sender_city,
               l.sender_name, l.sign_off, l.recipient, l.score, l.likes, l.count_comments
        FROM letters l
        WHERE
            (search_keyword IS NULL OR (
                l.recipient ILIKE '%' || search_keyword || '%' OR
                l.sender_country ILIKE '%' || search_keyword || '%' OR
                l.sender_state ILIKE '%' || search_keyword || '%' OR
                l.sender_city ILIKE '%' || search_keyword || '%'
            ))
    ),
    FilteredContents AS (
        SELECT lc.letter_id, lc.content
        FROM letter_contents lc
        WHERE lc.content ILIKE '%' || search_keyword || '%'
    )
    SELECT fl.id, fl.user_id, fl.created_at, fc.content, fl.score, fl.likes,
           fl.path, fl.sender_country, fl.sender_state,
           fl.sender_city, fl.sign_off, fl.sender_name, fl.recipient, fl.count_comments
    FROM FilteredLetters fl
    LEFT JOIN FilteredContents fc ON fl.id = fc.letter_id
    ORDER BY fl.score DESC, fl.created_at DESC
    LIMIT 10 OFFSET (page_number - 1) * 10;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_new_letter(
    "userId" uuid,
    "content" text,
    sender_country text,
    sender_state text,
    sender_city text,
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
        "sender_country",
        "sender_state",
        "sender_city",
        "sign_off",
        "sender_name",
        "recipient",
        "post_type"
    )
    VALUES (
        "userId",
        'root',
        sender_country,
        sender_state,
        sender_city,
        sign_off,
        sender_name,
        recipient,
        post_type
    )
    RETURNING "id", "created_at"
  )
  SELECT "id", "created_at" INTO new_letter_id, creation_time FROM "inserted_letter";

  INSERT INTO "letter_contents" (
    "letter_id",
    "content",
    "user_id"
  )
  VALUES (
    new_letter_id,
    "content",
    "userId"
  );

  RETURN NEXT;
END; $$;



CREATE OR REPLACE FUNCTION get_single_letter_with_comments(letter_id uuid)
RETURNS TABLE (
    id uuid,
    username text,
    created_at timestamp with time zone,
    content text,
    likes int,
    score int,
    path ltree,
    count_comments int,
    sender text,
    sender_country text,
    sender_state text,
    sender_city text,
    sign_off text,
    sender_name text,
    recipient text,
    recipient_country text,
    recipient_state text,
    recipient_city text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        up.username,
        p.created_at,
        pc.content,
        p.likes,
        p.score,
        p.path,
        p.count_comments,
        p.sender,
        p.sender_country,
        p.sender_state,
        p.sender_city,
        p.sign_off,
        p.sender_name,
        p.recipient,
        p.recipient_country,
        p.recipient_state,
        p.recipient_city
    FROM letters p
    JOIN letter_contents pc ON p.id = pc.letter_id
    JOIN user_profiles up ON p.user_id = up.user_id
    WHERE
      p.id = get_single_letter_with_comments.letter_id
    UNION ALL
    SELECT
      c.id,
      up.username as username,
      c.created_at,
      c.content,
      c.score,
      null,
      c.path,
      NULL as count_comments,  -- Comments do not have count_comments
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL  -- NULL for additional fields
    FROM comments c
    JOIN user_profiles up ON c.user_id = up.user_id
    WHERE
      c.path <@ text2ltree(concat('root.', replace(concat(get_single_letter_with_comments.letter_id::text, ''), '-', '_')));
END;
$$;


CREATE OR REPLACE FUNCTION create_new_letter_comment("user_id" UUID, content TEXT, comment_path LTREE)
RETURNS TABLE(comment_id UUID, creation_time TIMESTAMP WITH TIME ZONE, returned_path LTREE)
LANGUAGE plpgsql
AS $$
BEGIN
  WITH "inserted_comment" AS (
    INSERT INTO "comments" ("user_id", "path", "content")
    VALUES ($1, $3, $2)
    RETURNING "id", "created_at", "path"
  )
  SELECT "id", "created_at", "path" INTO comment_id, creation_time, returned_path FROM "inserted_comment";

  RETURN NEXT; -- returns the row of comment_id and creation_time
END;
$$;

CREATE OR REPLACE FUNCTION get_comments_by_letter_id(letter_id uuid)
RETURNS TABLE (
    id uuid,
    username text,
    created_at timestamp with time zone,
    content text,
    score int,
    path ltree
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        up.username AS username,
        c.created_at,
        c.content,
        c.score,
        c.path
    FROM comments c
    JOIN user_profiles up ON c.user_id = up.user_id
    WHERE c.path <@ text2ltree(concat('root.', replace(letter_id::text, '-', '_')));
END;
$$;

-- Trigger function to increment count_comments on a new comment
CREATE OR REPLACE FUNCTION increment_letter_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE letters
    SET count_comments = count_comments + 1,
        score = score + 2
    WHERE id = (
        SELECT REPLACE((REGEXP_MATCHES(NEW.path::TEXT, 'root\.([0-9a-fA-F_]+)\.?'))[1], '_', '-')::UUID
    );

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_letter_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE letters
    SET count_comments = count_comments - 1,
        score = score - 2
    WHERE id = (
        SELECT REPLACE((REGEXP_MATCHES(OLD.path::TEXT, 'root\.([0-9a-fA-F_]+)\.?'))[1], '_', '-')::UUID
    );

    RETURN OLD;
END;
$$;



-- Attach the trigger functions to the comments table
CREATE TRIGGER trigger_increment_letter_comment_count
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION increment_letter_comment_count();

CREATE TRIGGER trigger_decrement_letter_comment_count
AFTER DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION decrement_letter_comment_count();

