CREATE TABLE letters (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    path ltree NOT NULL,
    score int DEFAULT 0 NOT NULL,
    count_comments INT DEFAULT 0 NOT NULL,
    likes int DEFAULT 0 NOT NULL,
    post_type text

);

CREATE TABLE letter_contents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    letter_id uuid REFERENCES letters (id) ON DELETE CASCADE NOT NULL,
    content text,
    sender_country text,
    sender_state text,
    sender_city text,
    sign_off text,
    sender_name text,
    recipient text,
    tsv TSVECTOR,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url TEXT
);

CREATE TABLE letter_votes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    letter_id uuid REFERENCES letters (id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
    UNIQUE (letter_id, user_id)
);

CREATE TABLE letter_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,         -- Unique identifier for the report
    report_reason text NOT NULL,                                      -- Reason for reporting (e.g., "Hate Speech", "Spam")
    additional_info text,                                             -- Optional additional information provided by the user
    reported_letter_id uuid REFERENCES letters(id) ON DELETE CASCADE, -- ID of the reported letter
    reported_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- ID of the user who created the report
    created_at timestamp with time zone DEFAULT now() NOT NULL,       -- Timestamp when the report was created
    resolved_at timestamp with time zone,                             -- Timestamp when the report was resolved
    status text DEFAULT 'Pending' NOT NULL,                           -- Status of the report (e.g., "Pending", "Resolved", "Dismissed")
    admin_notes text                                                 -- Notes added by admin during the resolution process
);

CREATE OR REPLACE FUNCTION handle_letter_report_downvote()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert a downvote into the letter_votes table, or update the vote_type if a vote already exists
    INSERT INTO letter_votes (letter_id, user_id, vote_type)
    VALUES (NEW.reported_letter_id, NEW.reported_by_user_id, 'down')
    ON CONFLICT (letter_id, user_id)
    DO UPDATE SET vote_type = EXCLUDED.vote_type;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_letter_report_downvote
AFTER INSERT ON letter_reports
FOR EACH ROW
EXECUTE FUNCTION handle_letter_report_downvote();

-- CREATE TABLE letter_comments (
--     id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
--     user_id uuid REFERENCES auth.users (id) NOT NULL,
--     created_at timestamp with time zone DEFAULT now() NOT NULL,
--     path ltree NOT NULL,
--     score int DEFAULT 0 NOT NULL,
--     likes int DEFAU
--     content text NOT NULL
-- );

--LAST WORKING 8/9/24
-- CREATE OR REPLACE FUNCTION update_letter_score()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- DECLARE
--     target_letter_id uuid;
--     new_likes INT;
--     comment_count INT;
-- BEGIN
--     -- Determine which record (OLD or NEW) to refer to based on the operation.
--     IF TG_OP = 'DELETE' THEN
--         target_letter_id := OLD.letter_id;
--     ELSE
--         target_letter_id := NEW.letter_id;
--     END IF;

--     -- Calculate new likes
--     SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END), 0)
--     INTO new_likes
--     FROM letter_votes
--     WHERE letter_id = target_letter_id;

--     -- Calculate comment count for the letter
--     SELECT COUNT(*)
--     INTO comment_count
--     FROM comments
--     WHERE path <@ text2ltree(concat('root.', replace(target_letter_id::text, '-', '_')));

--     -- Update likes and score in the letters table
--     UPDATE letters
--     SET likes = new_likes,
--         score = (comment_count * 2) + new_likes
--     WHERE id = target_letter_id;

--     RETURN null;
-- END;
-- $$;
CREATE OR REPLACE FUNCTION update_letter_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_letter_id uuid;
    vote_increment INT;
    like_increment INT;
    comment_increment INT := 0;
BEGIN
    -- Determine which record (OLD or NEW) to refer to based on the operation.
    IF TG_OP = 'DELETE' THEN
        target_letter_id := OLD.letter_id;
        -- Determine the vote and like increments for DELETE
        vote_increment := CASE
                            WHEN OLD.vote_type = 'up' THEN -1
                            WHEN OLD.vote_type = 'down' THEN 5
                            ELSE 0
                          END;
        like_increment := CASE
                            WHEN OLD.vote_type = 'up' THEN -1
                            ELSE 0
                          END;
    ELSE
        target_letter_id := NEW.letter_id;

        -- Only proceed if the vote type has changed
        IF TG_OP = 'UPDATE' AND OLD.vote_type = NEW.vote_type THEN
            RETURN NULL; -- Exit early if the vote type didn't change
        END IF;

        -- Determine the vote and like increments for INSERT or UPDATE
        vote_increment := CASE
                            WHEN NEW.vote_type = 'up' THEN 1
                            WHEN NEW.vote_type = 'down' THEN -5
                            ELSE 0
                          END;
        like_increment := CASE
                            WHEN NEW.vote_type = 'up' THEN 1
                            ELSE 0
                          END;
    END IF;

    -- Increment the score based on the type of operation and vote
    UPDATE letters
    SET likes = likes + like_increment,
        score = score + vote_increment + (comment_increment * 2)
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
    v_current_vote text;
    v_xmax bigint;
BEGIN
    -- Fetch the current vote type for this user and letter
    SELECT vote_type INTO v_current_vote
    FROM letter_votes
    WHERE letter_id = p_letter_id AND user_id = p_user_id;

    -- Only perform the update if the vote_type is different
    IF v_current_vote IS DISTINCT FROM p_vote_type THEN
        INSERT INTO letter_votes (letter_id, user_id, vote_type)
        VALUES (p_letter_id, p_user_id, p_vote_type)
        ON CONFLICT (letter_id, user_id)
        DO UPDATE SET
            vote_type = EXCLUDED.vote_type
        RETURNING xmax INTO v_xmax;

        -- Check if it's a new vote or an update
        IF v_xmax = 0 THEN
            RETURN json_build_object('status', 'success', 'message', 'New vote created');
        ELSE
            RETURN json_build_object('status', 'success', 'message', 'Vote updated');
        END IF;
    ELSE
        -- If the vote is the same, return a message without triggering an update
        RETURN json_build_object('status', 'success', 'message', 'No change in vote');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('status', 'error', 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql;


-- CREATE OR REPLACE FUNCTION get_letters(page_number INT)
-- RETURNS TABLE (
--     id uuid,
--     user_id uuid,
--     created_at TIMESTAMP WITH TIME ZONE,
--     content TEXT,
--     score INT,
--     likes INT,
--     username TEXT,
--     path ltree,
--     sender_country text,
--     sender_state text,
--     sender_city text,
--     sign_off text,
--     sender_name text,
--     recipient text,
--     count_comments INT
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     WITH LimitedLetters AS (
--         SELECT l.id, l.user_id, l.created_at, l.path,
--                l.score, l.likes, l.count_comments
--         FROM letters l
--         ORDER BY l.score DESC, l.created_at DESC
--         LIMIT 10 OFFSET (page_number - 1) * 10
--     )
--     SELECT ll.id, ll.user_id, ll.created_at, lc.content, ll.score, ll.likes, up.username,
--            ll.path, lc.sender_country, lc.sender_state, lc.sender_city,
--            lc.sign_off, lc.sender_name, lc.recipient, ll.count_comments
--     FROM LimitedLetters ll
--     JOIN letter_contents lc ON ll.id = lc.letter_id
--     JOIN user_profiles up ON ll.user_id = up.user_id;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE OR REPLACE FUNCTION get_letters_with_tsv(
--     page_number INT,
--     search_keyword TEXT DEFAULT NULL,
--     page_filter TEXT DEFAULT NULL
-- )
-- RETURNS TABLE (
--     id uuid,
--     user_id uuid,
--     created_at TIMESTAMP WITH TIME ZONE,
--     content TEXT,
--     score INT,
--     likes INT,
--     path ltree,
--     sender_country text,
--     sender_state text,
--     sender_city text,
--     sign_off text,
--     sender_name text,
--     recipient text,
--     count_comments INT,
--     post_type text,
--     avatar_url text,
--     username text,
--     image_url text  -- Added image_url to the RETURNS TABLE
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     WITH LimitedLetters AS (
--         SELECT l.id, l.user_id, l.created_at, l.path,
--                l.score, l.likes, l.count_comments, l.post_type
--         FROM letters l
--         JOIN letter_contents lc ON l.id = lc.letter_id
--         WHERE
--             (search_keyword IS NULL OR lc.tsv @@ plainto_tsquery('english', search_keyword)) AND
--             (page_filter IS NULL OR l.post_type = page_filter)
--         ORDER BY l.score DESC, l.created_at DESC
--         LIMIT 10 OFFSET (page_number - 1) * 10
--     )
--     SELECT ll.id, ll.user_id, ll.created_at, lc.content, ll.score, ll.likes,
--            ll.path, lc.sender_country, lc.sender_state,
--            lc.sender_city, lc.sign_off, lc.sender_name, lc.recipient,
--            ll.count_comments, ll.post_type, up.avatar_url, up.username,
--            lc.image_url  -- Added lc.image_url to the SELECT clause
--     FROM LimitedLetters ll
--     JOIN letter_contents lc ON ll.id = lc.letter_id
--     LEFT JOIN user_profiles up ON ll.user_id = up.user_id
--     ORDER BY ll.score DESC, ll.created_at DESC;
-- END;
-- $$ LANGUAGE plpgsql;
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
    sender_country text,
    sender_state text,
    sender_city text,
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
        ORDER BY l.created_at DESC  -- Changed sorting to use created_at
        LIMIT 10 OFFSET (page_number - 1) * 10
    )
    SELECT ll.id, ll.user_id, ll.created_at, lc.content, ll.score, ll.likes,
           ll.path, lc.sender_country, lc.sender_state,
           lc.sender_city, lc.sign_off, lc.sender_name, lc.recipient,
           ll.count_comments, ll.post_type, up.avatar_url, up.username,
           lc.image_url
    FROM LimitedLetters ll
    JOIN letter_contents lc ON ll.id = lc.letter_id
    LEFT JOIN user_profiles up ON ll.user_id = up.user_id
    ORDER BY ll.created_at DESC;  -- Final sorting by created_at
END;
$$ LANGUAGE plpgsql;




CREATE OR REPLACE FUNCTION letters_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector(
      'english',
      coalesce(NEW.sender_name, '') || ' ' ||
      coalesce(NEW.sender_country, '') || ' ' ||
      coalesce(NEW.sender_state, '') || ' ' ||
      coalesce(NEW.sender_city, '') || ' ' ||
      coalesce(NEW.sign_off, '') || ' ' ||
      coalesce(NEW.recipient, '') || ' ' ||
      coalesce(NEW.content, '')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_letter_contents_tsv
BEFORE INSERT OR UPDATE ON letter_contents
FOR EACH ROW EXECUTE FUNCTION letters_tsv_trigger();


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
    "sender_country",
    "sender_state",
    "sender_city",
    "sign_off",
    "sender_name",
    "recipient"
  )
  VALUES (
    new_letter_id,
    "content",
    "userId",
    sender_country,
    sender_state,
    sender_city,
    sign_off,
    sender_name,
    recipient
  );

  RETURN NEXT;
END; $$;

CREATE OR REPLACE FUNCTION create_new_name(
    "content" TEXT,
    recipient TEXT,
    sender_city TEXT,
    sender_country TEXT,
    sender_name TEXT,
    sender_state TEXT,
    sign_off TEXT,
    "userId" UUID,
    image_url TEXT DEFAULT NULL -- Include image_url with a default value
)
RETURNS TABLE(new_letter_id UUID, creation_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the user has already signed
    IF EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE user_id = "userId" AND has_signed = TRUE
    ) THEN
        -- If the user has already signed, raise an exception
        RAISE EXCEPTION 'You have already added your name';
    ELSE
        -- If the user has not signed, proceed with the insertion
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
            "sender_country",
            "sender_state",
            "sender_city",
            "sign_off",
            "sender_name",
            "recipient",
            "image_url" -- Include image_url column
        )
        VALUES (
            new_letter_id,
            "content",
            "userId",
            sender_country,
            sender_state,
            sender_city,
            sign_off,
            sender_name,
            recipient,
            image_url -- Include image_url value
        );

        -- Update the has_signed field to true
        UPDATE user_profiles
        SET has_signed = TRUE
        WHERE user_id = "userId";

        RETURN QUERY
        SELECT new_letter_id, creation_time;
    END IF;
END;
$$;



CREATE OR REPLACE FUNCTION delete_name(
    "userId" uuid,
    "letterId" uuid
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete the letter contents first
    DELETE FROM "letter_contents"
    WHERE "letter_id" = "letterId" AND "user_id" = "userId";

    -- Delete the letter
    DELETE FROM "letters"
    WHERE id = "letterId" AND "user_id" = "userId";

    -- Update the has_signed field to false
    UPDATE user_profiles
    SET has_signed = FALSE
    WHERE user_id = "userId";

END; $$;



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
    sender_country text,
    sender_state text,
    sender_city text,
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
        pc.sender_country,
        pc.sender_state,
        pc.sender_city,
        pc.sign_off,
        pc.sender_name,
        pc.recipient,
        p.post_type,  -- Get the actual post_type from the letters table
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
        c.count_comments,  -- Comments now have count_comments
        NULL as sender_country,
        NULL as sender_state,
        NULL as sender_city,
        NULL as sign_off,
        NULL as sender_name,
        NULL as recipient,
        'comment',  -- Comments have post_type as 'comment'
        up2.avatar_url
    FROM comments c
    JOIN user_profiles up2 ON c.user_id = up2.user_id
    WHERE c.path <@ text2ltree(concat('root.', replace(p_letter_id::text, '-', '_')));
END;
$$;




CREATE OR REPLACE FUNCTION get_comments_by_letter_id(letter_id uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    username text,
    created_at timestamp with time zone,
    content text,
    score int,
    likes int,
    path ltree,
    avatar_url text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.user_id,
        up.username AS username,
        c.created_at,
        c.content,
        c.score,
        c.likes,
        c.path,
        up.avatar_url
    FROM comments c
    JOIN user_profiles up ON c.user_id = up.user_id
    WHERE c.path <@ text2ltree(concat('root.', replace(letter_id::text, '-', '_')));
END;
$$;







-- create extension http with schema extensions;

CREATE OR REPLACE FUNCTION get_user_profile_and_email(profile_name text)
RETURNS TABLE(username text, website text, avatar_url text, email text) AS $$
BEGIN
  RETURN QUERY
  SELECT up.username, up.website, up.avatar_url, u.email
  FROM public.user_profiles up
  JOIN auth.users u ON up.user_id = u.id
  WHERE up.username = profile_name;
END;
$$ LANGUAGE plpgsql STABLE;


--avatars

-- alter table user_profiles
--   enable row level security;

-- create policy "Public profiles are viewable by everyone." on user_profiles
--   for select using (true);

-- create policy "Users can insert their own profile." on user_profiles
--   for insert with check (auth.uid() = user_id);

-- create policy "Users can update own profile." on user_profiles
--   for update using (auth.uid() = user_id);

-- -- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- -- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
-- create function public.handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.user_profiles (id, full_name, avatar_url)
--   values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
--   return new;
-- end;
-- $$ language plpgsql security definer;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- -- Set up Storage!
-- insert into storage.buckets (id, name)
--   values ('avatars', 'avatars');

-- -- Set up access controls for storage.
-- -- See https://supabase.com/docs/guides/storage/security/access-control#policy-examples for more details.
-- create policy "Avatar images are publicly accessible." on storage.objects
--   for select using (bucket_id = 'avatars');

-- create policy "Anyone can upload an avatar." on storage.objects
--   for insert with check (bucket_id = 'avatars');

-- create policy "Anyone can update their own avatar." on storage.objects
--   for update using (auth.uid() = owner) with check (bucket_id = 'avatars');



--delete old profile photos

create or replace function delete_storage_object(bucket text, object text, out status int, out content text)
returns record
language 'plpgsql'
security definer
as $$
declare
  project_url text := 'http://localhost:54323';
  service_role_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'; --  full access needed
  url text := project_url||'/storage/v1/object/'||bucket||'/'||object;
begin
  select
      into status, content
           result.status::int, result.content::text
      FROM extensions.http((
    'DELETE',
    url,
    ARRAY[extensions.http_header('authorization','Bearer '||service_role_key)],
    NULL,
    NULL)::extensions.http_request) as result;
end;
$$;

-- create or replace function delete_avatar(target_user_id uuid, out status int, out content text)
-- returns record
-- language 'plpgsql'
-- security definer
-- as $$
-- declare
--   user_avatar_url text;
-- begin
--   -- Retrieve the avatar_url for the given target_user_id from the user_profiles table
--   SELECT avatar_url INTO user_avatar_url
--   FROM user_profiles
--   WHERE user_id = target_user_id; -- Resolves ambiguity by using a different variable name

--   -- Proceed only if an avatar_url exists
--   IF user_avatar_url IS NOT NULL THEN
--     -- Call the existing function to delete the avatar from storage
--     SELECT INTO status, content result.status, result.content
--     FROM public.delete_storage_object('avatars', user_avatar_url) AS result;

--     -- If the avatar is successfully deleted from storage (status = 200),
--     -- proceed to remove the avatar_url from the user_profiles table
--     IF status = 200 THEN
--       UPDATE user_profiles
--       SET avatar_url = NULL
--       WHERE user_id = target_user_id; -- Explicitly specifies column with table name

--       -- Adjust the status and content output as necessary
--       status := 200; -- Confirm success
--       content := 'Avatar deleted successfully from storage and user_profiles';
--     END IF;
--   ELSE
--     -- Handle the case where no avatar_url exists for the given user_id
--     status := 404; -- Not found
--     content := 'No avatar found for the given user_id.';
--   END IF;
-- END;
-- $$;

create or replace function delete_avatar(avatar_url text, out status int, out content text)
returns record
language 'plpgsql'
security definer
as $$
begin
  select
      into status, content
           result.status, result.content
      from public.delete_storage_object('avatars', avatar_url) as result;
end;
$$;


create or replace function delete_old_avatar()
returns trigger
language 'plpgsql'
security definer
as $$
declare
  status int;
  content text;
  avatar_name text;
begin
  if coalesce(old.avatar_url, '') <> ''
      and (tg_op = 'DELETE' or (old.avatar_url <> coalesce(new.avatar_url, ''))) then
    -- extract avatar name
    avatar_name := old.avatar_url;
    select
      into status, content
      result.status, result.content
      from public.delete_avatar(avatar_name) as result;
    if status <> 200 then
      raise warning 'Could not delete avatar: % %', status, content;
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger before_profile_changes
  before delete on public.user_profiles
  for each row execute function public.delete_old_avatar();



create or replace function delete_old_profile()
returns trigger
language 'plpgsql'
security definer
as $$
begin
  delete from public.user_profiles where id = old.id;
  return old;
end;
$$;

create trigger before_delete_user
  before delete on auth.users
  for each row execute function public.delete_old_profile();
