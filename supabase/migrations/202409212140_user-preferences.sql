CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  allow_sharing BOOLEAN DEFAULT FALSE,
  credit_text TEXT,
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  allow_art_sharing BOOLEAN DEFAULT FALSE,
  social_urls TEXT[], -- Array of social profile URLs
  feature_on_homepage BOOLEAN DEFAULT FALSE,
  homepage_credit_text TEXT,
  user_comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();



CREATE OR REPLACE FUNCTION create_wall_post(
    "userId" uuid,
    "content" text,
    "image_url" text DEFAULT NULL
)
RETURNS TABLE(new_post_id UUID, creation_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into 'letters' table with 'post_type' set to 'wall_post'
    WITH "inserted_post" AS (
        INSERT INTO "letters" (
            "user_id",
            "path",
            "post_type"
        )
        VALUES (
            "userId",
            'root',
            'wall_post'
        )
        RETURNING "id", "created_at"
    )
    SELECT "id", "created_at" INTO new_post_id, creation_time FROM "inserted_post";

    -- Insert into 'letter_contents' table with optional image_url
    INSERT INTO "letter_contents" (
        "letter_id",
        "user_id",
        "content",
        "image_url"
    )
    VALUES (
        new_post_id,
        "userId",
        "content",
        "image_url"
    );

    -- Return the new post ID and creation timestamp
    RETURN QUERY
    SELECT new_post_id, creation_time;
END;
$$;
