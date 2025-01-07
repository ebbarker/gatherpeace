-- CREATE EXTENSION IF NOT EXISTS http;

CREATE TABLE link_previews (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  image_location TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_or_fetch_link_metadata(p_url TEXT)
RETURNS JSON AS $$
DECLARE
  link_data JSON;
  external_service_url TEXT := 'http://127.0.0.1:54321/functions/v1/hello'; -- Replace with your Edge function URL
  response JSON;
BEGIN
  -- Step 1: Check if the URL already exists in the database
  SELECT row_to_json(link_previews) INTO link_data
  FROM link_previews
  WHERE url = p_url;

  IF link_data IS NOT NULL THEN
    -- If the metadata exists, return it
    RETURN link_data;
  ELSE
    -- Step 2: If metadata doesn't exist, call the edge function to fetch it
    -- Make an HTTP POST request to the edge function
    SELECT content INTO response FROM http(
      external_service_url,
      'POST',
      'application/json',
      json_build_object('externalLink', p_url)::text
    );

    -- Step 3: Parse and insert the fetched metadata into the `link_previews` table
    INSERT INTO link_previews (url, title, description, image_location)
    VALUES (
      response->>'url',
      response->>'title',
      response->>'description',
      response->>'image_location'
    )
    ON CONFLICT (url) DO NOTHING;

    -- Return the fetched metadata
    RETURN response;
  END IF;
END;
$$ LANGUAGE plpgsql;
