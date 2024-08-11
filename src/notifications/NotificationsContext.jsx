import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import { Link } from "react-router-dom";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { session } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [oldNotifications, setOldNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

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
      setNotifications(newUnreadNotifications);
      setOldNotifications(newReadNotifications);

      //setNotifications(prevNotifications => [...prevNotifications, ...data]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }

  useEffect(() => {
    if (!session) {
      // Reset notifications when session changes
      setNotifications([]);
      setOldNotifications([]);
      setPage(1);
      setHasMore(true);

      //fetchNotifications();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [page, session?.user?.id]);

  const loadMoreNotifications = () => {
    setPage(prevPage => prevPage + 1);
  };

  return (
    <NotificationsContext.Provider value={{ notifications, oldNotifications, hasMore, loadMoreNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
};