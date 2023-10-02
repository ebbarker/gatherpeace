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
    score int default 0 not null
);

create table post_score (
    post_id uuid primary key references posts (id) not null,
    score int not null
);

create table post_contents (
    id uuid primary key default uuid_generate_v4() not null,
    user_id uuid references auth.users (id) not null,
    post_id uuid references posts (id) not null,
    title text,
    content text,
    created_at timestamp with time zone default now() not null
);

create table post_votes (
    id uuid primary key default uuid_generate_v4() not null,
    post_id uuid references posts (id) not null,
    user_id uuid references auth.users (id) not null,
    vote_type text not null,
    unique (post_id, user_id)
);

create table email_list (
    id uuid primary key default uuid_generate_v4() not null,
    user_id uuid references auth.users (id),
    email text not null,
    approved boolean not null default false,
    stop_asking boolean not null default false
    CONSTRAINT proper_email CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- create function update_post_score()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = publicupd
-- as $update_post_score$
-- begin
-- update post_score
--         set score = (
--             select sum(case when vote_type = 'up' then 1 else -1 end)
--             from post_votes
--             where post_id = new.post_id
--         )
--         where post_id = new.post_id;
--         return new;
-- end;$update_post_score$;

CREATE OR REPLACE FUNCTION update_post_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE posts
        SET score = COALESCE((
            SELECT SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END)
            FROM post_votes
            WHERE post_id = OLD.post_id
        ), 0)
        WHERE post_id = OLD.post_id;
    ELSE
        UPDATE posts
        SET score = COALESCE((
            SELECT SUM(CASE WHEN vote_type = 'up' THEN 1 ELSE -1 END)
            FROM post_votes
            WHERE post_id = NEW.post_id
        ), 0)
        WHERE post_id = NEW.post_id;
    END IF;

    RETURN NULL;
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

-- create function get_posts(page_number int)
-- returns table (
--     id uuid,
--     user_id uuid,
--     created_at timestamp with time zone,
--     content text,
--     score int,
--     username text
-- )
-- language plpgsql
-- as $$
-- begin
--     return query
--     select posts.id, posts.user_id, posts.created_at, post_contents.content, post_score.score, user_profiles.username
--     from posts
--     join post_contents on posts.id = post_contents.post_id
--     join post_score on posts.id = post_score.post_id
--     join user_profiles on posts.user_id = user_profiles.user_id
--     where posts.path ~ 'root'
--     order by post_score.score desc, posts.created_at desc
--     limit 10
--     offset (page_number - 1) * 10;
-- end;$$;

CREATE OR REPLACE FUNCTION get_posts(page_number INT)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    content TEXT,
    score INT,
    username TEXT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH LimitedPosts AS (
        SELECT p.id, p.user_id, p.created_at, p.score FROM posts p
        WHERE p.path ~ 'root'
        ORDER BY p.score DESC, p.created_at DESC
        LIMIT 10 OFFSET (page_number - 1) * 10
    )
    SELECT p.id, p.user_id, p.created_at, pc.content, p.score, up.username
    FROM LimitedPosts p
    JOIN post_contents pc ON p.id = pc.post_id
    JOIN user_profiles up ON p.user_id = up.user_id
    ORDER BY p.score DESC, p.created_at DESC;
END;
$$;

-- create function create_new_post("userId" uuid, "title" text, "content" text)
-- returns boolean
-- language plpgsql
-- as $$
-- begin
--   with
--     "inserted_post" as (
--       insert into "posts" ("user_id", "path")
--       values ($1, 'root')
--       returning "id"
--     )
--   insert into "post_contents" ("post_id", "title", "content", "user_id")
--   values ((select "id" from "inserted_post"), $2, $3, $1);
--   return true;
-- end; $$;

CREATE OR REPLACE FUNCTION create_new_post("userId" uuid, "title" text, "content" text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    new_post_id UUID;
BEGIN
  WITH "inserted_post" AS (
    INSERT INTO "posts" ("user_id", "path")
    VALUES ("userId", 'root')
    RETURNING "id"
  )
  SELECT "id" INTO new_post_id FROM "inserted_post";

  INSERT INTO "post_contents" ("post_id", "title", "content", "user_id")
  VALUES (new_post_id, "title", "content", "userId");

  RETURN new_post_id;
END; $$;

-- create function initialize_post_score()
-- returns trigger
-- language plpgsql
-- security definer
-- set search_path = public
-- as $initialize_post_score$
-- begin
--     insert into post_score (post_id, score)
--     values (new.id, 0);
--     return new;
-- end;$initialize_post_score$;

-- create trigger initialize_post_score
--     after insert
--     on posts
--     for each row execute procedure initialize_post_score();

-- create function get_single_post_with_comments(post_id uuid)
-- returns table (
--     id uuid,
--     username text,
--     created_at timestamp with time zone,
--     title text,
--     content text,
--     score int,
--     path ltree
-- )
-- language plpgsql
-- as $$
-- begin
--     return query
--     select
--       posts.id,
--       user_profiles.username,
--       posts.created_at,
--       post_contents.title,
--       post_contents.content,
--       post_score.score,
--       posts.path
--     from posts
--     join post_contents on posts.id = post_contents.post_id
--     join post_score on posts.id = post_score.post_id
--     join user_profiles on posts.user_id = user_profiles.user_id
--     where
--       posts.path <@ text2ltree(concat('root.', replace(concat($1, ''), '-', '_')))
--     or
--       posts.id = $1;
-- end;$$;

create or replace function get_single_post_with_comments(post_id uuid)
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

create function create_new_comment(user_id uuid, content text, path ltree)
returns boolean
language plpgsql
as $$
begin
  with
    inserted_post as (
      insert into posts (user_id, path)
      values ($1, $3)
      returning id
    )
  insert into post_contents (post_id, title, content, user_id)
  values ((select id from inserted_post), '', $2, $1);
  return true;
end; $$;



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


