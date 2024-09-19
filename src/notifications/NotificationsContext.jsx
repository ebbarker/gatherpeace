import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { session } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  function formatPath(path) {
    return path.split('.').map(segment => segment.replace(/_/g, '-')).join('.');
  }

  async function fetchNotifications() {
    const offset = (page - 1) * 10;
    try {
      const { data, error } = await supaClient
        .rpc('get_aggregated_notifications', {
          p_user_id: session?.user?.id,
          p_offset: offset,
          p_limit: 10
        });

      if (error) throw error;

      if (data.length < 10) {
        setHasMore(false);
      }

      let fullNotifications = [...notifications, ...data];

      // Separate the notifications into read and unread
      let newUnreadNotifications = fullNotifications.filter(notification => !notification.read);
      let newReadNotifications = fullNotifications.filter(notification => notification.read);

      // Sort the notifications by modified time
      newUnreadNotifications.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      newReadNotifications.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      // Update the state
      console.log('notification list: ' + JSON.stringify(newUnreadNotifications));
      setNotifications(newUnreadNotifications);
      setOldNotifications(newReadNotifications);

    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  const fetchCountUnreadNotifications = async () => {
    try {
      const { count, error } = await supaClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("read", false)
        .eq("user_id_receiver", session.user.id);

      if (error) {
        console.error("Error fetching unread count:", error);
      } else {
        setUnreadCount(count ?? 0);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (session?.user?.id) {
      const notificationSubscription = supaClient
        .channel(`notifications`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id_receiver=eq.${session.user.id}`,
        }, payload => {
          console.log('new notification: ' + JSON.stringify(payload));
          setNotifications((prevNotifications) => [payload.new, ...prevNotifications]);
          setUnreadCount((prevCount) => prevCount + 1);
        })
        .subscribe();

      return () => {
        notificationSubscription.unsubscribe();
      };
    }


  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) {
      // Reset notifications when session changes
      setNotifications([]);
      setOldNotifications([]);
      setPage(1);
      setHasMore(true);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
      fetchCountUnreadNotifications();
    }
  }, [page, session?.user?.id]);

  const loadMoreNotifications = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, oldNotifications, hasMore, loadMoreNotifications, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
};

//letter like
// {"schema":"public","table":"notifications","commit_timestamp":"2024-08-29T21:38:48.594Z","eventType":"INSERT","new":
// {"creator_avatar":"0.27244231307398037.jpg","creator_username":"ethanbaobarker","id":"5d32eb1a-7068-4d18-8877-2aa5c53c6290","modified":"2024-08-29T21:38:48.589244+00:00","path":"root.8e6da859_9248_4a59_abc2_3ad745217963","read":false,"table_name":"letter_votes","target_id":"8e6da859-9248-4a59-abc2-3ad745217963","type":"post_like","user_id_creator":
// "f3ff1fc2-338b-4869-b39a-d12423df696e","user_id_receiver":"ac3f0e2f-bcd0-4b32-bbc6-c26aef2dc6fd"},"old":{},"errors":null}

//comment like:

// {"schema":"public","table":"notifications","commit_timestamp":"2024-08-29T21:41:23.579Z","eventType":"INSERT","new":
// {"creator_avatar":"0.27244231307398037.jpg","creator_username":"ethanbaobarker",
// "id":"6eccae71-ffa1-442b-b349-8fcba1426ac8","modified":"2024-08-29T21:41:23.573602+00:00","path":"root.8e6da859_9248_4a59_abc2_3ad745217963",
// "read":false,"table_name":"post_votes","target_id":"e4b42f81-5999-4695-b9ae-3ffb9fcc0770",
// "type":"comment_like","user_id_creator":"f3ff1fc2-338b-4869-b39a-d12423df696e","user_id_receiver":"ac3f0e2f-bcd0-4b32-bbc6-c26aef2dc6fd"},"old":{},"errors":null}

//from aggregation
// {"id":"df7c27d9-bce2-4f87-b8bb-6f42342798f1","modified":"2024-08-26T21:25:40.724184+00:00","type":"like",
// "target_id":"0bbcea98-5f56-48e0-b574-29f25cd3aed1","table_name":"letter_votes",
// "user_id_creator":"ac3f0e2f-bcd0-4b32-bbc6-c26aef2dc6fd","user_id_receiver":"ac3f0e2f-bcd0-4b32-bbc6-c26aef2dc6fd",
// "path":"root.0bbcea98_5f56_48e0_b574_29f25cd3aed1","read":false,"unread_count":1,"creator_username":"ethanbaobarke"},
