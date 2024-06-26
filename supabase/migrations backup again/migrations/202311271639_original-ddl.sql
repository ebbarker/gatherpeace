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
    tsv TSVECTOR
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


CREATE OR REPLACE FUNCTION letters_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector(
      'english',
      coalesce(NEW.sender_name, '') || ' ' ||
      coalesce(NEW.sender_country, '') || ' ' ||
      coalesce(NEW.sender_state, '') || ' ' ||
      coalesce(NEW.sender_city, '') || ' ' ||
      coalesce(NEW.sign_off, '') || ' ' ||
      coalesce(NEW.recipient, '')
  );
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_letters_tsv BEFORE INSERT OR UPDATE ON letters
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


create extension http with schema extensions;

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
