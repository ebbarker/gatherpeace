create extension ltree;

create table user_profiles (
  user_id uuid primary key references auth.users (id) not null,
  username text unique not null
);

create table posts (
    id uuid primary key default uuid_generate_v4() not null,
    user_id uuid references auth.users (id) not null,
    created_at timestamp with time zone default now() not null,
    path ltree not null,
    score int default 0 not null,
    count_comments INT DEFAULT 0 NOT NULL
);

create table post_contents (
    id uuid primary key default uuid_generate_v4() not null,
    user_id uuid references auth.users (id) not null,
    post_id uuid references posts (id) not null,
    title text,
    content text,
    created_at timestamp with time zone default now() not null
);

CREATE TABLE post_votes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    post_id uuid NOT NULL,  -- This will refer to either a post or a comment.
    user_id uuid REFERENCES auth.users (id) NOT NULL,
    vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
    UNIQUE (post_id, user_id)
);

create table comments (
    id uuid primary key default uuid_generate_v4() not null,
    user_id uuid references auth.users (id) not null,
    created_at timestamp with time zone default now() not null,
    path ltree not null,
    score int default 0 not null,
    content text not null
);

create table email_list (
    id uuid primary key default uuid_generate_v4() not null,
    user_id uuid references auth.users (id),
    email text not null,
    approved boolean not null default false,
    stop_asking boolean not null default false
    CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

CREATE OR REPLACE FUNCTION update_post_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_post_id uuid;
BEGIN
    -- Determine which record (OLD or NEW) to refer to based on the operation.
    IF TG_OP = 'DELETE' THEN
        target_post_id := OLD.post_id;
    ELSE
        target_post_id := NEW.post_id;
    END IF;

    -- Update score for posts table
    IF EXISTS(SELECT 1 FROM posts WHERE id = target_post_id) THEN
        UPDATE posts
        SET score = COALESCE((
            SELECT SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END)
            FROM post_votes
            WHERE post_id = target_post_id
        ), 0)
        WHERE id = target_post_id;

    -- Update score for comments table
    ELSIF EXISTS(SELECT 1 FROM comments WHERE id = target_post_id) THEN
        UPDATE comments
        SET score = COALESCE((
            SELECT SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END)
            FROM post_votes
            WHERE post_id = target_post_id
        ), 0)
        WHERE id = target_post_id;
    END IF;

    RETURN null;
END;
$$;



create trigger update_post_score
    after insert or update or delete
    on post_votes
    for each row execute procedure update_post_score();


CREATE OR REPLACE FUNCTION delete_post_vote(p_user_id uuid, p_post_id uuid)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
    rows_deleted INT;
BEGIN
    DELETE FROM post_votes
    WHERE user_id = p_user_id AND post_id = p_post_id
    RETURNING 1 INTO rows_deleted;
    RETURN rows_deleted;
END;
$$;



CREATE OR REPLACE FUNCTION get_posts(page_number INT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    content TEXT,
    score INT,
    username TEXT,
    count_comments INT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH LimitedPosts AS (
        SELECT p.id, p.user_id, p.created_at, p.score, p.count_comments FROM posts p
        WHERE p.path ~ 'root'
        ORDER BY p.score DESC, p.created_at DESC
        LIMIT 10 OFFSET (page_number - 1) * 10
    )
    SELECT p.id, p.user_id, p.created_at, pc.content, p.score, up.username, p.count_comments
    FROM LimitedPosts p
    JOIN post_contents pc ON p.id = pc.post_id
    JOIN user_profiles up ON p.user_id = up.user_id
    ORDER BY p.score DESC, p.created_at DESC;
END;
$$;



CREATE OR REPLACE FUNCTION create_new_post("userId" uuid, "title" text, "content" text)
RETURNS TABLE(new_post_id UUID, creation_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
AS $$
BEGIN
  WITH "inserted_post" AS (
    INSERT INTO "posts" ("user_id", "path")
    VALUES ("userId", 'root')
    RETURNING "id", "created_at"
  )
  SELECT "id", "created_at" INTO new_post_id, creation_time FROM "inserted_post";

  INSERT INTO "post_contents" ("post_id", "title", "content", "user_id")
  VALUES (new_post_id, "title", "content", "userId");

  RETURN NEXT; -- returns the row of new_post_id and creation_time
END; $$;



create or replace function get_single_post_with_comments_old(post_id uuid)
returns table (
    id uuid,
    author_name text,
    created_at timestamp with time zone,
    title text,
    content text,
    score int,
    path ltree
)
language plpgsql
as $$
begin
    return query
    select
      posts.id,
      user_profiles.username,
      posts.created_at,
      post_contents.title,
      post_contents.content,
      posts.score,
      posts.path
    from posts
    join post_contents on posts.id = post_contents.post_id
    join user_profiles on posts.user_id = user_profiles.user_id
    where
      posts.path <@ text2ltree(concat('root.', replace(concat($1, ''), '-', '_')))
    or
      posts.id = $1;
end;$$;

CREATE OR REPLACE FUNCTION get_single_post_with_comments(post_id uuid)
RETURNS TABLE (
    id uuid,
    author_name text,
    created_at timestamp with time zone,
    content text,
    score int,
    path ltree,
    count_comments int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
      p.id,
      up.username as author_name,
      p.created_at,
      pc.content,
      p.score,
      p.path,
      p.count_comments
    FROM posts p
    JOIN post_contents pc ON p.id = pc.post_id
    JOIN user_profiles up ON p.user_id = up.user_id
    WHERE
      p.id = get_single_post_with_comments.post_id
    UNION ALL
    SELECT
      c.id,
      up.username as author_name,
      c.created_at,
      c.content,
      c.score,
      c.path,
      NULL AS count_comments
    FROM comments c
    JOIN user_profiles up ON c.user_id = up.user_id
    WHERE
      c.path <@ text2ltree(concat('root.', replace(concat(get_single_post_with_comments.post_id::text, ''), '-', '_')));
END;
$$;


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

CREATE OR REPLACE FUNCTION get_comments_by_post_id(post_id uuid)
RETURNS TABLE (
    id uuid,
    author_name text,
    created_at timestamp with time zone,
    content text,
    score int,
    path ltree,
    count_comments int
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        up.username AS author_name,
        c.created_at,
        c.content,
        c.score,
        c.path,
        c.count_comments
    FROM comments c
    JOIN user_profiles up ON c.user_id = up.user_id
    WHERE c.path <@ text2ltree(concat('root.', replace(post_id::text, '-', '_')));
END;
$$;

-- Trigger function to increment count_comments on a new comment
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE posts
    SET count_comments = count_comments + 1
    WHERE id = (
        SELECT REPLACE((REGEXP_MATCHES(NEW.path::TEXT, 'root\.([0-9a-fA-F_]+)\.?'))[1], '_', '-')::UUID
    );

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE posts
    SET count_comments = count_comments - 1
    WHERE id = (
        SELECT REPLACE((REGEXP_MATCHES(OLD.path::TEXT, 'root\.([0-9a-fA-F_]+)\.?'))[1], '_', '-')::UUID
    );

    RETURN OLD;
END;
$$;



-- Attach the trigger functions to the comments table
CREATE TRIGGER trigger_increment_comment_count
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION increment_comment_count();

CREATE TRIGGER trigger_decrement_comment_count
AFTER DELETE ON comments
FOR EACH ROW
EXECUTE FUNCTION decrement_comment_count();


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


