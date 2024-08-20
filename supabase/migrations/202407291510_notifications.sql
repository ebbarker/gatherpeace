CREATE OR REPLACE FUNCTION get_aggregated_notifications(p_user_id uuid, p_offset integer, p_limit integer)
RETURNS TABLE (
    id uuid,
    modified timestamp with time zone,
    type text,
    target_id uuid,
    table_name text,
    user_id_creator uuid,
    user_id_receiver uuid,
    path ltree,
    read boolean,
    unread_count integer,
    creator_username text
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_notifications AS (
        SELECT DISTINCT ON (n1.path, n1.type, n1.read)
            n1.id AS notification_id,
            n1.modified,
            n1.type,
            n1.target_id,
            n1.table_name,
            n1.user_id_creator,
            n1.user_id_receiver,
            n1.path AS notification_path,
            n1.read
        FROM notifications n1
        WHERE n1.user_id_receiver = p_user_id
        ORDER BY n1.path, n1.type, n1.read, n1.modified DESC
    ),
    unread_counts AS (
        SELECT
            n2.path AS notification_path,
            n2.type,
            n2.read,
            COUNT(*)::integer AS unread_count
        FROM notifications n2
        WHERE n2.user_id_receiver = p_user_id
        GROUP BY n2.path, n2.type, n2.read
    )
    SELECT
        rn.notification_id AS id,
        rn.modified,
        rn.type,
        rn.target_id,
        rn.table_name,
        rn.user_id_creator,
        rn.user_id_receiver,
        rn.notification_path AS path,
        rn.read,
        COALESCE(uc.unread_count, 0) AS unread_count,
        up.username AS creator_username
    FROM recent_notifications rn
    LEFT JOIN unread_counts uc ON rn.notification_path = uc.notification_path AND rn.type = uc.type AND rn.read = uc.read
    JOIN user_profiles up ON rn.user_id_creator = up.user_id
    ORDER BY rn.modified DESC
    OFFSET p_offset
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- CREATE OR REPLACE FUNCTION get_aggregated_notifications(p_user_id uuid, p_offset integer, p_limit integer)
-- RETURNS TABLE (
--     id uuid,
--     modified timestamp with time zone,
--     type text,
--     target_id uuid,
--     table_name text,
--     user_id_creator uuid,
--     user_id_receiver uuid,
--     path ltree,
--     read boolean,
--     unread_count integer,
--     creator_username text
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     WITH recent_notifications AS (
--         SELECT DISTINCT ON (n1.path, n1.type, n1.read)
--             n1.id AS notification_id,
--             n1.modified,
--             n1.type,
--             n1.target_id,
--             n1.table_name,
--             n1.user_id_creator,
--             n1.user_id_receiver,
--             n1.path AS notification_path,
--             n1.read
--         FROM notifications n1
--         WHERE n1.user_id_receiver = p_user_id
--         ORDER BY n1.path, n1.type, n1.read, n1.modified DESC
--     ),
--     unread_counts AS (
--         SELECT
--             n2.path AS notification_path,
--             n2.type,
--             n2.read,
--             COUNT(*)::integer AS unread_count
--         FROM notifications n2
--         WHERE n2.user_id_receiver = p_user_id
--         GROUP BY n2.path, n2.type, n2.read
--     )
--     SELECT
--         rn.notification_id AS id,
--         rn.modified,
--         rn.type,
--         rn.target_id,
--         rn.table_name,
--         rn.user_id_creator,
--         rn.user_id_receiver,
--         rn.notification_path AS path,
--         rn.read,
--         COALESCE(uc.unread_count, 0) AS unread_count,
--         up.username AS creator_username
--     FROM recent_notifications rn
--     LEFT JOIN unread_counts uc ON rn.notification_path = uc.notification_path AND rn.type = uc.type AND rn.read = uc.read
--     JOIN user_profiles up ON rn.user_id_creator = up.user_id
--     ORDER BY rn.modified DESC
--     OFFSET p_offset
--     LIMIT p_limit;
-- END;
-- $$ LANGUAGE plpgsql;



CREATE TABLE notifications (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    modified timestamp with time zone DEFAULT now() NOT NULL,
    type text NOT NULL,
    target_id uuid NOT NULL,
    table_name text NOT NULL,
    user_id_creator uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    user_id_receiver uuid REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    path ltree, -- Adding the path column to record the path of replies
    read boolean DEFAULT false
);

CREATE OR REPLACE FUNCTION notify_letter_author_of_comment_or_reply()
RETURNS TRIGGER AS $$
DECLARE
    target_letter_id uuid;
    target_comment_id uuid;
    comment_path ltree;
BEGIN
    -- Extract the letter ID from the path and replace underscores with hyphens
    target_letter_id := REPLACE(substring(NEW.path::text FROM 'root\.([0-9a-fA-F_]{8}_[0-9a-fA-F_]{4}_[0-9a-fA-F_]{4}_[0-9a-fA-F_]{4}_[0-9a-fA-F_]{12})'), '_', '-');

    -- Ensure the letter ID is valid
    IF target_letter_id IS NULL THEN
        RAISE EXCEPTION 'Invalid letter ID extracted from path %', NEW.path;
    END IF;

    comment_path := NEW.path;
    -- If the path length is greater than 70, it's a reply to a comment
    IF LENGTH(NEW.path::text) > 70 THEN


        -- Extract the comment ID from the comment path and replace underscores with hyphens
        target_comment_id := REPLACE(substring(comment_path::text FROM '([0-9a-fA-F_]{8}_[0-9a-fA-F_]{4}_[0-9a-fA-F_]{4}_[0-9a-fA-F_]{4}_[0-9a-fA-F_]{12})$'), '_', '-');

        -- Ensure the comment ID is valid
        IF target_comment_id IS NULL THEN
            RAISE EXCEPTION 'Invalid comment ID extracted from path %', NEW.path;
        END IF;

        -- Insert notification for the comment author
        INSERT INTO notifications (
            id,
            modified,
            type,
            target_id,
            table_name,
            user_id_creator,
            user_id_receiver,
            path
        )
        VALUES (
            uuid_generate_v4(),
            now(),
            'reply',
            NEW.id,
            'comments',
            NEW.user_id,
            (SELECT user_id FROM comments WHERE id = target_comment_id),
            comment_path  -- Cast to ltree
        );

    ELSE
        -- Insert notification for the letter author
        INSERT INTO notifications (
            id,
            modified,
            type,
            target_id,
            table_name,
            user_id_creator,
            user_id_receiver,
            path
        )
        VALUES (
            uuid_generate_v4(),
            now(),
            'comment',
            NEW.id,
            'comments',
            NEW.user_id,
            (SELECT user_id FROM letters WHERE id = target_letter_id),
            comment_path
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_author_of_comment_or_reply
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_letter_author_of_comment_or_reply();

-- Create the notify_like function
CREATE OR REPLACE FUNCTION notify_like()
RETURNS TRIGGER AS $$
DECLARE
    target_letter_id uuid;
    path_segments int;
    notification_type text;
BEGIN
    -- Ensure the target ID is valid
    target_letter_id := NEW.letter_id;

    -- Count the number of segments in the path
    path_segments := array_length(string_to_array(text2ltree(concat('root.', replace(target_letter_id::text, '-', '_'), '.', replace(NEW.letter_id::text, '-', '_')))::text, '.'), 1);

    -- Determine the notification type based on the number of UUIDs in the path
    IF path_segments = 2 THEN
        notification_type := 'comment_like';
    ELSIF path_segments = 3 THEN
        notification_type := 'reply_like';
    ELSE
        RAISE EXCEPTION 'Unexpected path length';
    END IF;

    -- Insert notification for the letter author
    INSERT INTO notifications (
        id,
        modified,
        type,
        target_id,
        table_name,
        user_id_creator,
        user_id_receiver,
        path
    )
    VALUES (
        uuid_generate_v4(),
        now(),
        notification_type,
        NEW.letter_id,
        'letter_votes',
        NEW.user_id,
        (SELECT user_id FROM letters WHERE id = target_letter_id),
        text2ltree(concat('root.', replace(target_letter_id::text, '-', '_'), '.', replace(NEW.letter_id::text, '-', '_')))
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the remove_like_notification function
CREATE OR REPLACE FUNCTION remove_like_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete the notification related to the like
    DELETE FROM notifications
    WHERE target_id = OLD.letter_id
      AND table_name = 'letter_votes'
      AND type = 'like'
      AND user_id_creator = OLD.user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to notify like
CREATE TRIGGER trigger_notify_like
AFTER INSERT ON letter_votes
FOR EACH ROW
WHEN (NEW.vote_type = 'up')
EXECUTE FUNCTION notify_like();

-- Create the trigger to remove like notification
CREATE TRIGGER trigger_remove_like_notification
AFTER DELETE ON letter_votes
FOR EACH ROW
WHEN (OLD.vote_type = 'up')
EXECUTE FUNCTION remove_like_notification();


CREATE TABLE tags (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    letter_content_id uuid REFERENCES letter_contents(id) ON DELETE CASCADE NOT NULL,
    tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE tags
ADD CONSTRAINT unique_letter_tag UNIQUE (letter_content_id, tag);



CREATE OR REPLACE FUNCTION extract_tags_from_content()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    extracted_tag text;
    tag_array text[];
BEGIN
    -- Extract all unique lowercase hashtags from the content
    tag_array := ARRAY(
        SELECT DISTINCT lower(unnest(regexp_matches(NEW.content, '#\w+', 'g')))
    );

    -- Loop through each tag and insert into the tags table
    FOREACH extracted_tag IN ARRAY tag_array
    LOOP
        BEGIN
            INSERT INTO tags (letter_content_id, tag)
            VALUES (NEW.id, extracted_tag)
            ON CONFLICT (letter_content_id, tag) DO NOTHING;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error inserting tag: %', SQLERRM;
        END;
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER extract_tags_trigger
AFTER INSERT ON letter_contents
FOR EACH ROW
EXECUTE FUNCTION extract_tags_from_content();