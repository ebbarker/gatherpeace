-- ======================================
-- Enable Row-Level Security on Tables
-- ======================================

-- Enable RLS on user_profiles table
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on letters table
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;

-- Enable RLS on letter_contents table
ALTER TABLE letter_contents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on letter_votes table
ALTER TABLE letter_votes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on post_votes table
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;

-- ======================================
-- Row-Level Security Policies
-- ======================================

-- ===============================
-- RLS Policies for user_profiles
-- ===============================

-- 1. Public profiles are viewable by everyone
CREATE POLICY public_profiles_select ON user_profiles
  FOR SELECT
  USING (true);

-- 2. Users can insert their own profile
CREATE POLICY user_can_insert_own_profile ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own profile
CREATE POLICY user_can_update_own_profile ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own profile
CREATE POLICY user_can_delete_own_profile ON user_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- RLS Policies for letters
-- ===========================

-- 1. All users can view letters
CREATE POLICY letters_select ON letters
  FOR SELECT
  USING (true);

-- 2. Users can insert their own letters
CREATE POLICY letters_insert ON letters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own letters (excluding 'score' and 'likes')
CREATE POLICY letters_update ON letters
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own letters
CREATE POLICY letters_delete ON letters
  FOR DELETE
  USING (auth.uid() = user_id);

-- ================================
-- RLS Policies for letter_contents
-- ================================

-- 1. All users can view letter contents
CREATE POLICY letter_contents_select ON letter_contents
  FOR SELECT
  USING (true);

-- 2. Users can insert letter contents for their own letters
CREATE POLICY letter_contents_insert ON letter_contents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own letter contents
CREATE POLICY letter_contents_update ON letter_contents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own letter contents
CREATE POLICY letter_contents_delete ON letter_contents
  FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- RLS Policies for comments
-- ===========================

-- 1. All users can view comments
CREATE POLICY comments_select ON comments
  FOR SELECT
  USING (true);

-- 2. Users can insert their own comments
CREATE POLICY comments_insert ON comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own comments
CREATE POLICY comments_update ON comments
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own comments
CREATE POLICY comments_delete ON comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- RLS Policies for letter_votes
-- ===========================

-- 1. All users can view letter_votes
CREATE POLICY letter_votes_select ON letter_votes
  FOR SELECT
  USING (true);

-- 2. Users can insert their own votes
CREATE POLICY letter_votes_insert ON letter_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own votes
CREATE POLICY letter_votes_update ON letter_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own votes
CREATE POLICY letter_votes_delete ON letter_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- RLS Policies for post_votes
-- ===========================

-- 1. All users can view post_votes
CREATE POLICY post_votes_select ON post_votes
  FOR SELECT
  USING (true);

-- 2. Users can insert their own votes
CREATE POLICY post_votes_insert ON post_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own votes
CREATE POLICY post_votes_update ON post_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own votes
CREATE POLICY post_votes_delete ON post_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ======================================
-- Triggers to Prevent Unauthorized Changes
-- ======================================

-- ============================================
-- Trigger to Prevent Updating 'user_id' in user_profiles
-- ============================================

-- Create a trigger function to prevent changes to 'user_id'
CREATE OR REPLACE FUNCTION prevent_user_id_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_id <> OLD.user_id THEN
        RAISE EXCEPTION 'Cannot change user_id';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the 'user_profiles' table
DROP TRIGGER IF EXISTS trigger_prevent_user_id_update ON user_profiles;
CREATE TRIGGER trigger_prevent_user_id_update
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_user_id_update();

-- =======================================================
-- Trigger to Prevent Unauthorized Changes in letters table
-- =======================================================

-- Create a trigger function to prevent unauthorized updates to 'score', 'likes', and 'count_comments'
CREATE OR REPLACE FUNCTION prevent_unauthorized_letters_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow updates to 'score', 'likes', and 'count_comments' only if performed by a SECURITY DEFINER function
    IF (NEW.score <> OLD.score OR NEW.likes <> OLD.likes OR NEW.count_comments <> OLD.count_comments) AND SESSION_USER = CURRENT_USER THEN
        RAISE EXCEPTION 'Cannot change score, likes, or count_comments directly';
    END IF;

    -- Prevent changing 'user_id'
    IF NEW.user_id <> OLD.user_id THEN
        RAISE EXCEPTION 'Cannot change user_id';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the 'letters' table
DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_letters_update ON letters;
CREATE TRIGGER trigger_prevent_unauthorized_letters_update
BEFORE UPDATE ON letters
FOR EACH ROW
EXECUTE FUNCTION prevent_unauthorized_letters_update();

-- =======================================================
-- Trigger to Prevent Unauthorized Changes in comments table
-- =======================================================

-- Create a trigger function to prevent unauthorized updates to 'score', 'likes', and 'count_comments' in comments
CREATE OR REPLACE FUNCTION prevent_unauthorized_comments_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow updates to 'score', 'likes', and 'count_comments' only if performed by a SECURITY DEFINER function
    IF (NEW.score <> OLD.score OR NEW.likes <> OLD.likes OR NEW.count_comments <> OLD.count_comments) AND SESSION_USER = CURRENT_USER THEN
        RAISE EXCEPTION 'Cannot change score, likes, or count_comments directly';
    END IF;

    -- Prevent changing 'user_id'
    IF NEW.user_id <> OLD.user_id THEN
        RAISE EXCEPTION 'Cannot change user_id';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the 'comments' table
DROP TRIGGER IF EXISTS trigger_prevent_unauthorized_comments_update ON comments;
CREATE TRIGGER trigger_prevent_unauthorized_comments_update
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION prevent_unauthorized_comments_update();

-- ==============================================
-- Adjust Function Definitions to Include SECURITY DEFINER
-- ==============================================

-- For functions that need to bypass RLS and modify restricted fields, ensure they are defined with SECURITY DEFINER

-- Example: update_letter_score function
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
    -- Function body remains the same
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

    RETURN NULL;
END;
$$;

-- Example: increment_comment_count function
CREATE OR REPLACE FUNCTION increment_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    parent_letter_id uuid;
    parent_comment_id uuid;
BEGIN
    -- Function body remains the same
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

-- Example: decrement_comment_count function
CREATE OR REPLACE FUNCTION decrement_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    parent_letter_id uuid;
    parent_comment_id uuid;
BEGIN
    -- Function body remains the same
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
-- Optionally grant BYPASSRLS if needed (requires superuser)
-- ALTER ROLE trigger_role WITH BYPASSRLS;
-- ===========================
-- Indexes for user_profiles
-- ===========================

-- Index on 'has_signed'
CREATE INDEX IF NOT EXISTS idx_user_profiles_has_signed ON user_profiles (has_signed);

-- Index on 'country'
CREATE INDEX IF NOT EXISTS idx_user_profiles_country ON user_profiles (country);

-- Index on 'state_province'
CREATE INDEX IF NOT EXISTS idx_user_profiles_state_province ON user_profiles (state_province);

-- Index on 'city'
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles (city);

-- Index on 'updated_at' (for recent updates)
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON user_profiles (updated_at DESC);

-- ======================
-- Indexes for letters
-- ======================

-- Index on 'user_id' (for filtering letters by user)
CREATE INDEX IF NOT EXISTS idx_letters_user_id ON letters (user_id);

-- Index on 'created_at' (for recent letters)
CREATE INDEX IF NOT EXISTS idx_letters_created_at ON letters (created_at DESC);

-- Index on 'score' (for ordering letters by score)
CREATE INDEX IF NOT EXISTS idx_letters_score ON letters (score DESC);

-- Index on 'post_type' (for filtering letters by type)
CREATE INDEX IF NOT EXISTS idx_letters_post_type ON letters (post_type);

-- GIST Index on 'path' (for hierarchical queries using ltree)
CREATE INDEX IF NOT EXISTS idx_letters_path ON letters USING GIST (path);

-- Index on 'likes' (for ordering or filtering by likes)
CREATE INDEX IF NOT EXISTS idx_letters_likes ON letters (likes DESC);

-- ==============================
-- Indexes for letter_contents
-- ==============================

-- Index on 'letter_id' (foreign key)
CREATE INDEX IF NOT EXISTS idx_letter_contents_letter_id ON letter_contents (letter_id);

-- GIN Index on 'tsv' column (for full-text search)
CREATE INDEX IF NOT EXISTS idx_letter_contents_tsv ON letter_contents USING GIN (tsv);

-- Index on 'created_at' (if querying by creation time)
CREATE INDEX IF NOT EXISTS idx_letter_contents_created_at ON letter_contents (created_at DESC);

-- =================================
-- Indexes for comments
-- =================================

-- Index on 'user_id' in comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);

-- Index on 'created_at' in comments
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments (created_at DESC);

-- GIST Index on 'path' in comments
CREATE INDEX IF NOT EXISTS idx_comments_path ON comments USING GIST (path);

-- Index on 'score' in comments
CREATE INDEX IF NOT EXISTS idx_comments_score ON comments (score DESC);

-- Index on 'likes' in comments
CREATE INDEX IF NOT EXISTS idx_comments_likes ON comments (likes DESC);

-- =================================
-- Indexes for tags
-- =================================

-- Index on 'tag' in tags table
CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags (tag);

-- Index on 'letter_content_id' in tags
CREATE INDEX IF NOT EXISTS idx_tags_letter_content_id ON tags (letter_content_id);

-- ======================================
-- Additional Considerations
-- ======================================

-- Since we're not using a custom role, we don't need to change function ownership.
-- The functions will be owned by the default role (e.g., 'postgres').

-- Ensure that the functions that need to bypass RLS are set with SECURITY DEFINER.

-- In the trigger functions, we check whether the function is running with elevated privileges by comparing SESSION_USER and CURRENT_USER.

-- ======================================
-- End of Code
-- ======================================
ALTER TABLE user_profiles
ADD COLUMN political_party text,
