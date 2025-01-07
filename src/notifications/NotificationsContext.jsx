// NotificationsContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";

export const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { session } = useContext(UserContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Function to fetch notifications
  const fetchNotifications = async (append = false) => {
    if (!session?.user?.id) return;
    const offset = (page - 1) * 10;
    try {
      const { data, error } = await supaClient
        .rpc('get_aggregated_notifications', {
          p_user_id: session.user.id,
          p_offset: offset,
          p_limit: 10,
        });

      if (error) throw error;

      if (data.length < 10) {
        setHasMore(false);
      }

      if (append) {
        setNotifications(prevNotifications => {
          // Avoid duplicates
          const existingIds = new Set(prevNotifications.map(n => n.id));
          const newNotifications = data.filter(n => !existingIds.has(n.id));
          return [...prevNotifications, ...newNotifications];
        });
      } else {
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Function to fetch unread count
  const fetchUnreadCount = async () => {
    if (!session?.user?.id) return;
    try {
      const { count, error } = await supaClient
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id_receiver', session.user.id)
        .eq('read', false);

      if (error) throw error;

      setUnreadCount(count ?? 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Function to load more notifications
  const loadMoreNotifications = () => {
    setPage(prevPage => prevPage + 1);
  };

  // When page changes, fetch notifications
  useEffect(() => {
    if (page === 1) return; // Initial fetch handled elsewhere
    fetchNotifications(true);
  }, [page]);

  // Fetch notifications when component mounts or session changes
  useEffect(() => {
    setPage(1);
    fetchNotifications(false);
    fetchUnreadCount();
  }, [session?.user?.id]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      setNotifications,
      hasMore,
      loadMoreNotifications,
      unreadCount,
      fetchUnreadCount,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};
