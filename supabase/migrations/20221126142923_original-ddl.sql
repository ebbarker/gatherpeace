-- create extension ltree;

create table user_profiles (
  user_id uuid primary key references auth.users (id) ON DELETE CASCADE NOT NULL,
  username text unique not null,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text,
  country text,
  state_province text,
  city text,
  bio text,
  birthday date,
  has_signed BOOLEAN DEFAULT FALSE
);

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

-- Set up Storage!
-- insert into storage.buckets (id, name)
--   values ('avatars', 'avatars');
--   on conflict (id) do nothing;

-- -- -- Set up access controls for storage.
-- -- -- See https://supabase.com/docs/guides/storage/security/access-control#policy-examples for more details.
-- -- create policy "Avatar images are publicly accessible." on storage.objects
-- --   for select using (bucket_id = 'avatars');

-- create policy "Anyone can upload an avatar." on storage.objects
--   for insert with check (bucket_id = 'avatars');

-- create policy "Anyone can update their own avatar." on storage.objects
--   for update using (auth.uid() = owner) with check (bucket_id = 'avatars');

-- create policy "User can delete own avatar" on storage.objects
--   for delete using (auth.uid() = owner);

--   ----
--   insert into storage.buckets (id, name)
--   values ('default_avatars', 'default_avatars');
--   on conflict (id) do nothing;

-- create policy "Avatar images are publicly accessible." on storage.objects
--   for select using (bucket_id = 'default_avatars');

-- -- Create the 'gallery' bucket
-- select storage.create_bucket(
--   bucket_name := 'gallery',
--   public := true -- Set to true if you want public access
-- );

-- Enable Row-Level Security on storage.objects
alter table storage.objects enable row level security;

-- Policy to allow authenticated users to upload images to 'gallery'
create policy "Allow authenticated users to upload images to gallery" on storage.objects
  for insert
  with check (
    bucket_id = 'gallery' and auth.role() = 'authenticated'
  );

-- Policy to allow users to update their own images in 'gallery'
create policy "Allow users to update their own images in gallery" on storage.objects
  for update
  using (
    bucket_id = 'gallery' and auth.uid() = owner
  )
  with check (
    bucket_id = 'gallery'
  );

-- Policy to allow authenticated users to read images from 'gallery'
create policy "Allow authenticated users to read images from gallery" on storage.objects
  for select
  using (
    bucket_id = 'gallery' and (
      owner = auth.uid() or metadata ->> 'is_public' = 'true'
    )
  );


-- create table posts (
--     id uuid primary key default uuid_generate_v4() not null,
--     user_id uuid references auth.users (id) not null,
--     created_at timestamp with time zone default now() not null,
--     path ltree not null,
--     score int default 0 not null,
--     count_comments INT DEFAULT 0 NOT NULL
-- );

-- create table post_contents (
--     id uuid primary key default uuid_generate_v4() not null,
--     user_id uuid references auth.users (id) not null,
--     post_id uuid references posts (id) not null,
--     title text,
--     content text,
--     created_at timestamp with time zone default now() not null
-- );

CREATE TABLE comments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    path ltree NOT NULL,
    score int DEFAULT 0 NOT NULL,
    count_comments INT DEFAULT 0 NOT NULL,
    likes int DEFAULT 0 NOT NULL,
    content text NOT NULL
);

CREATE TABLE comment_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,         -- Unique identifier for the report
    report_reason text NOT NULL,                                      -- Reason for reporting (e.g., "Hate Speech", "Spam")
    additional_info text,                                             -- Optional additional information provided by the user
    reported_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE, -- ID of the reported comment
    reported_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- ID of the user who created the report
    created_at timestamp with time zone DEFAULT now() NOT NULL,       -- Timestamp when the report was created
    resolved_at timestamp with time zone,                             -- Timestamp when the report was resolved
    status text DEFAULT 'Pending' NOT NULL,                           -- Status of the report (e.g., "Pending", "Resolved", "Dismissed")
    admin_notes text
);

CREATE OR REPLACE FUNCTION handle_comment_report_downvote()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert a downvote into the comment_votes table, or update the vote_type if a vote already exists
    INSERT INTO post_votes (comment_id, user_id, vote_type)
    VALUES (NEW.reported_comment_id, NEW.reported_by_user_id, 'down')
    ON CONFLICT (comment_id, user_id)
    DO UPDATE SET vote_type = EXCLUDED.vote_type;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_comment_report_downvote
AFTER INSERT ON comment_reports
FOR EACH ROW
EXECUTE FUNCTION handle_comment_report_downvote();



CREATE OR REPLACE FUNCTION delete_comment_and_replies(p_comment_id uuid)
RETURNS VOID AS $$
DECLARE
    comment_path ltree;
BEGIN
    -- Get the path of the comment to be deleted
    SELECT path INTO comment_path FROM comments WHERE id = p_comment_id;

    -- Delete all comments associated with the comment, including the comment itself
    DELETE FROM comments WHERE path <@ text2ltree(concat(comment_path::text, '.', REPLACE(p_comment_id::text, '-', '_')));

    -- Delete the comment itself
    DELETE FROM comments WHERE id = p_comment_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION delete_letter_and_comments(letter_id uuid)
RETURNS VOID AS $$
BEGIN
    -- Delete all comments associated with the letter
    DELETE FROM comments WHERE path <@ text2ltree(concat('root.', replace(letter_id::text, '-', '_')));

    -- Delete the letter itself
    DELETE FROM letters WHERE id = letter_id;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE post_votes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
    comment_path ltree,
    user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
    UNIQUE (comment_id, user_id)
);





CREATE OR REPLACE FUNCTION update_comment_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_comment_id uuid;
    old_vote_type text;
    new_vote_type text;
BEGIN
    target_comment_id := COALESCE(OLD.comment_id, NEW.comment_id);
    old_vote_type := OLD.vote_type;
    new_vote_type := NEW.vote_type;

    -- Handle the DELETE case
    IF TG_OP = 'DELETE' THEN
        -- Remove the effects of the deleted vote
        IF old_vote_type = 'up' THEN
            UPDATE comments
            SET likes = likes - 1,
                score = score - 1
            WHERE id = target_comment_id;
        ELSIF old_vote_type = 'down' THEN
            UPDATE comments
            SET score = score + 5
            WHERE id = target_comment_id;
        END IF;

    -- Handle the INSERT case
    ELSIF TG_OP = 'INSERT' THEN
        IF new_vote_type = 'up' THEN
            UPDATE comments
            SET likes = likes + 1,
                score = score + 1
            WHERE id = target_comment_id;
        ELSIF new_vote_type = 'down' THEN
            UPDATE comments
            SET score = score - 5
            WHERE id = target_comment_id;
        END IF;

    -- Handle the UPDATE case (only adjust score if vote_type changed)
    ELSIF TG_OP = 'UPDATE' THEN
        IF old_vote_type <> new_vote_type THEN
            -- Revert the old vote
            IF old_vote_type = 'up' THEN
                UPDATE comments
                SET likes = likes - 1,
                    score = score - 1
                WHERE id = target_comment_id;
            ELSIF old_vote_type = 'down' THEN
                UPDATE comments
                SET score = score + 5
                WHERE id = target_comment_id;
            END IF;

            -- Apply the new vote
            IF new_vote_type = 'up' THEN
                UPDATE comments
                SET likes = likes + 1,
                    score = score + 1
                WHERE id = target_comment_id;
            ELSIF new_vote_type = 'down' THEN
                UPDATE comments
                SET score = score - 5
                WHERE id = target_comment_id;
            END IF;
        END IF;
    END IF;

    RETURN null;
END;
$$;

CREATE TRIGGER update_post_score_trigger
AFTER INSERT OR UPDATE OR DELETE ON post_votes
FOR EACH ROW EXECUTE FUNCTION update_comment_score();


CREATE OR REPLACE FUNCTION delete_post_vote(p_user_id uuid, p_comment_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    rows_deleted INT;
BEGIN
    DELETE FROM post_votes
    WHERE user_id = p_user_id AND comment_id = p_comment_id
    RETURNING 1 INTO rows_deleted;
    RETURN rows_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION insert_post_vote(
    p_comment_id uuid,
    p_user_id uuid,
    p_vote_type text
)
RETURNS json AS $$
DECLARE
    v_xmax bigint;
BEGIN
    INSERT INTO post_votes (comment_id, user_id, vote_type)
    VALUES (p_comment_id, p_user_id, p_vote_type)
    ON CONFLICT (comment_id, user_id)
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


CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
DECLARE
    parent_letter_id uuid;
    parent_comment_id uuid;
BEGIN
    -- Determine parent letter and parent comment (if any)
    parent_letter_id := NULL;
    parent_comment_id := NULL;

    -- Extract parent letter ID (characters 6 to 41)
    parent_letter_id := (SELECT REPLACE(SUBSTRING(NEW.path::TEXT, 6, 36), '_', '-')::UUID);

    -- Extract parent comment ID (characters 43 to the end) if it exists
    IF LENGTH(NEW.path::TEXT) > 42 THEN
        parent_comment_id := (SELECT REPLACE(SUBSTRING(NEW.path::TEXT, 43), '_', '-')::UUID);
    END IF;

    -- Update the parent letter
    IF parent_letter_id IS NOT NULL THEN
        UPDATE letters
        SET count_comments = count_comments + 1,
            score = score + 2
        WHERE id = parent_letter_id;
    END IF;

    -- Update the parent comment
    IF parent_comment_id IS NOT NULL THEN
        UPDATE comments
        SET count_comments = count_comments + 1,
            score = score + 2
        WHERE id = parent_comment_id;
    END IF;

    RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
DECLARE
    parent_letter_id uuid;
    parent_comment_id uuid;
BEGIN
    -- Determine parent letter and parent comment (if any)
    parent_letter_id := NULL;
    parent_comment_id := NULL;

    -- Extract parent letter ID (characters 6 to 41)
    parent_letter_id := (SELECT REPLACE(SUBSTRING(OLD.path::TEXT, 6, 36), '_', '-')::UUID);

    -- Extract parent comment ID (characters 43 to the end) if it exists
    IF LENGTH(OLD.path::TEXT) > 42 THEN
        parent_comment_id := (SELECT REPLACE(SUBSTRING(OLD.path::TEXT, 43), '_', '-')::UUID);
    END IF;

    -- Update the parent letter
    IF parent_letter_id IS NOT NULL THEN
        UPDATE letters
        SET count_comments = count_comments - 1,
            score = score - 2
        WHERE id = parent_letter_id;
    END IF;

    -- Update the parent comment
    IF parent_comment_id IS NOT NULL THEN
        UPDATE comments
        SET count_comments = count_comments - 1,
            score = score - 2
        WHERE id = parent_comment_id;
    END IF;

    RETURN OLD;
END;
$$;


CREATE TRIGGER trigger_increment_comment_count
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION increment_comment_count();

CREATE TRIGGER trigger_decrement_comment_count
AFTER DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION decrement_comment_count();


-- CREATE OR REPLACE FUNCTION get_posts(page_number INT)
-- RETURNS TABLE (
--     id UUID,
--     user_id UUID,
--     created_at TIMESTAMP WITH TIME ZONE,
--     content TEXT,
--     score INT,
--     username TEXT,
--     count_comments INT
-- ) LANGUAGE plpgsql AS $$
-- BEGIN
--     RETURN QUERY
--     WITH LimitedPosts AS (
--         SELECT p.id, p.user_id, p.created_at, p.score, p.count_comments FROM posts p
--         WHERE p.path ~ 'root'
--         ORDER BY p.score DESC, p.created_at DESC
--         LIMIT 10 OFFSET (page_number - 1) * 10
--     )
--     SELECT p.id, p.user_id, p.created_at, pc.content, p.score, up.username, p.count_comments
--     FROM LimitedPosts p
--     JOIN post_contents pc ON p.id = pc.post_id
--     JOIN user_profiles up ON p.user_id = up.user_id
--     ORDER BY p.score DESC, p.created_at DESC;
-- END;
-- $$;

-- -- query below written with Shiva
-- -- BEGIN
-- --     RETURN QUERY
-- --     WITH LimitedPosts AS (
-- --         SELECT id, score, created_at, user_id FROM posts
-- --         ORDER BY score DESC, created_at DESC
-- --         LIMIT 10 OFFSET (page_number - 1) * 10
-- --     )
-- --     SELECT p.id, p.user_id, p.created_at, pc.content, p.score, up.username
-- --     FROM LimitedPosts p
-- --     JOIN post_contents pc ON p.id = pc.post_id
-- --     JOIN user_profiles up ON p.user_id = up.user_id;
-- -- END;

-- -- CREATE OR REPLACE FUNCTION get_limited_posts_with_shiva(page_number INT)
-- -- RETURNS TABLE (post_id uuid, user_id uuid, post_created_at TIMESTAMPTZ, content TEXT, post_score INT, username TEXT) AS $$
-- -- BEGIN
-- --     RETURN QUERY
-- --     WITH LimitedPosts AS (
-- --         SELECT p.id, p.score, p.created_at, p.user_id FROM posts p
-- --         ORDER BY p.score DESC, p.created_at DESC
-- --         LIMIT 10 OFFSET (page_number - 1) * 10
-- --     )
-- --     SELECT lp.id AS post_id, lp.user_id, lp.created_at AS post_created_at,
-- --            pc.content, lp.score AS post_score, up.username
-- --     FROM LimitedPosts lp
-- --     JOIN post_contents pc ON lp.id = pc.post_id
-- --     JOIN user_profiles up ON lp.user_id = up.user_id;
-- -- END;
-- -- $$ LANGUAGE plpgsql;



-- CREATE OR REPLACE FUNCTION create_new_post("userId" uuid, "title" text, "content" text)
-- RETURNS TABLE(new_post_id UUID, creation_time TIMESTAMP WITH TIME ZONE)
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   WITH "inserted_post" AS (
--     INSERT INTO "posts" ("user_id", "path")
--     VALUES ("userId", 'root')
--     RETURNING "id", "created_at"
--   )
--   SELECT "id", "created_at" INTO new_post_id, creation_time FROM "inserted_post";

--   INSERT INTO "post_contents" ("post_id", "title", "content", "user_id")
--   VALUES (new_post_id, "title", "content", "userId");

--   RETURN NEXT; -- returns the row of new_post_id and creation_time
-- END; $$;



-- -- create or replace function get_single_post_with_comments_old(post_id uuid)
-- -- returns table (
-- --     id uuid,
-- --     username text,
-- --     created_at timestamp with time zone,
-- --     title text,
-- --     content text,
-- --     score int,
-- --     path ltree
-- -- )
-- -- language plpgsql
-- -- as $$
-- -- begin
-- --     return query
-- --     select
-- --       posts.id,
-- --       user_profiles.username,
-- --       posts.created_at,
-- --       post_contents.title,
-- --       post_contents.content,
-- --       posts.score,
-- --       posts.path
-- --     from posts
-- --     join post_contents on posts.id = post_contents.post_id
-- --     join user_profiles on posts.user_id = user_profiles.user_id
-- --     where
-- --       posts.path <@ text2ltree(concat('root.', replace(concat($1, ''), '-', '_')))
-- --     or
-- --       posts.id = $1;
-- -- end;$$;

-- CREATE OR REPLACE FUNCTION get_single_post_with_comments(post_id uuid)
-- RETURNS TABLE (
--     id uuid,
--     username text,
--     created_at timestamp with time zone,
--     content text,
--     score int,
--     path ltree,
--     count_comments int
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT
--       p.id,
--       up.username as username,
--       p.created_at,
--       pc.content,
--       p.score,
--       p.path,
--       p.count_comments
--     FROM posts p
--     JOIN post_contents pc ON p.id = pc.post_id
--     JOIN user_profiles up ON p.user_id = up.user_id
--     WHERE
--       p.id = get_single_post_with_comments.post_id
--     UNION ALL
--     SELECT
--       c.id,
--       up.username as username,
--       c.created_at,
--       c.content,
--       c.score,
--       c.path,
--       NULL AS count_comments
--     FROM comments c
--     JOIN user_profiles up ON c.user_id = up.user_id
--     WHERE
--       c.path <@ text2ltree(concat('root.', replace(concat(get_single_post_with_comments.post_id::text, ''), '-', '_')));
-- END;
-- $$;


CREATE OR REPLACE FUNCTION create_new_comment("user_id" UUID, content TEXT, comment_path LTREE)
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

-- CREATE OR REPLACE FUNCTION get_comments_by_post_id(post_id uuid)
-- RETURNS TABLE (
--     id uuid,
--     username text,
--     created_at timestamp with time zone,
--     content text,
--     score int,
--     path ltree
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT
--         c.id,
--         up.username AS username,
--         c.created_at,
--         c.content,
--         c.score,
--         c.path
--     FROM comments c
--     JOIN user_profiles up ON c.user_id = up.user_id
--     WHERE c.path <@ text2ltree(concat('root.', replace(post_id::text, '-', '_')));
-- END;
-- $$;

-- -- Trigger function to increment count_comments on a new comment
-- CREATE OR REPLACE FUNCTION increment_comment_count()
-- RETURNS TRIGGER LANGUAGE plpgsql
-- AS $$
-- BEGIN
--     UPDATE posts
--     SET count_comments = count_comments + 1
--     WHERE id = (
--         SELECT REPLACE((REGEXP_MATCHES(NEW.path::TEXT, 'root\.([0-9a-fA-F_]+)\.?'))[1], '_', '-')::UUID
--     );

--     RETURN NEW;
-- END;
-- $$;

-- CREATE OR REPLACE FUNCTION decrement_comment_count()
-- RETURNS TRIGGER LANGUAGE plpgsql
-- AS $$
-- BEGIN
--     UPDATE posts
--     SET count_comments = count_comments - 1
--     WHERE id = (
--         SELECT REPLACE((REGEXP_MATCHES(OLD.path::TEXT, 'root\.([0-9a-fA-F_]+)\.?'))[1], '_', '-')::UUID
--     );

--     RETURN OLD;
-- END;
-- $$;



-- -- Attach the trigger functions to the comments table
-- CREATE TRIGGER trigger_increment_comment_count
-- AFTER INSERT ON comments
-- FOR EACH ROW
-- EXECUTE FUNCTION increment_comment_count();

-- CREATE TRIGGER trigger_decrement_comment_count
-- AFTER DELETE ON comments
-- FOR EACH ROW
-- EXECUTE FUNCTION decrement_comment_count();


-- CREATE POLICY "can see all" ON "public"."user_profiles"
-- AS PERMISSIVE FOR SELECT
-- TO public
-- USING (true);

-- CREATE POLICY "can only insert your own" ON "public"."user_profiles"
-- AS PERMISSIVE FOR INSERT
-- TO public

-- WITH CHECK ((auth.uid()=user_id));

-- CREATE POLICY "can only insert your own" ON "public"."user_profiles"
-- AS PERMISSIVE FOR INSERT
-- TO public

-- WITH CHECK ((auth.uid() = user_id));

-- CREATE POLICY "can only update your own" ON "public"."user_profiles"
-- AS PERMISSIVE FOR UPDATE
-- TO public
-- USING ((auth.uid() = user_id))
-- WITH CHECK ((auth.uid() = user_id));

-- alter table user_profiles enable row level security;
-- alter table posts enable row level security;
-- alter table post_contents enable row level security;
-- alter table post_score enable row level security;
-- alter table post_votes enable row level security;

-- CREATE POLICY "all can see" ON "public"."post_contents"
-- AS PERMISSIVE FOR SELECT
-- TO public
-- USING (true);

-- CREATE POLICY "authors can create" ON "public"."post_contents"
-- AS PERMISSIVE FOR INSERT
-- TO public
-- WITH CHECK (auth.uid()=user_id);

-- CREATE POLICY "all can see" ON "public"."post_score"
-- AS PERMISSIVE FOR SELECT
-- TO public
-- USING (true);

-- CREATE POLICY "all can see" ON "public"."post_votes"
-- AS PERMISSIVE FOR SELECT
-- TO public
-- USING (true);

-- CREATE POLICY "owners can insert" ON "public"."post_votes"
-- AS PERMISSIVE FOR INSERT
-- TO public
-- WITH CHECK (auth.uid()=user_id);

-- CREATE POLICY "owners can update" ON "public"."post_votes"
-- AS PERMISSIVE FOR UPDATE
-- TO public
-- USING (auth.uid()=user_id)
-- WITH CHECK (auth.uid()=user_id);

-- CREATE POLICY "all can see" ON "public"."posts"
-- AS PERMISSIVE FOR SELECT
-- TO public
-- USING (true);

-- CREATE POLICY "owners can insert" ON "public"."posts"
-- AS PERMISSIVE FOR INSERT
-- TO public
-- WITH CHECK (auth.uid()=user_id);

-- CREATE POLICY "all can see" ON "public"."user_profiles"
-- AS PERMISSIVE FOR SELECT
-- TO public
-- USING (true);

-- CREATE POLICY "users can insert" ON "public"."user_profiles"
-- AS PERMISSIVE FOR INSERT
-- TO public
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "owners can update" ON "public"."user_profiles"
-- AS PERMISSIVE FOR UPDATE
-- TO public
-- USING (auth.uid()=user_id)
-- WITH CHECK (auth.uid()=user_id);

-- CREATE POLICY "owners can see their own" ON "public"."email_list"
-- AS PERMISSIVE FOR SELECT
-- TO public
-- USING (auth.uid()=user_id);

-- CREATE POLICY "owners can insert for themselves" ON "public"."email_list"
-- AS PERMISSIVE FOR INSERT
-- TO public
-- WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "owners can update their data" ON "public"."email_list"
-- AS PERMISSIVE FOR UPDATE
-- TO public
-- USING (auth.uid()=user_id)
-- WITH CHECK (auth.uid()=user_id);


