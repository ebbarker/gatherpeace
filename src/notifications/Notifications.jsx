// Notifications.jsx
import React, { useContext, useEffect, useRef } from "react";
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import { NotificationsContext } from './NotificationsContext';
import './Notifications.css';
import { NotificationCard } from './NotificationCard';

export function Notifications() {
  const { session } = useContext(UserContext);
  const {
    notifications,
    setNotifications,
    hasMore,
    loadMoreNotifications,
    unreadCount,
    fetchUnreadCount,
  } = useContext(NotificationsContext);

  const displayedNotificationIds = useRef(new Set());

  // Mark displayed notifications as read in the db when notifications change
  useEffect(() => {
    if (!session?.user?.id) return;
    if (notifications.length === 0) return;

    const newNotificationsToMarkAsRead = notifications.filter(notification => {
      return !notification.read && !displayedNotificationIds.current.has(notification.id);
    });

    if (newNotificationsToMarkAsRead.length > 0) {
      markDisplayedNotificationsAsReadInDB(newNotificationsToMarkAsRead);
      // Add the new notification ids to the set
      newNotificationsToMarkAsRead.forEach(notification => {
        displayedNotificationIds.current.add(notification.id);
      });
    }
  }, [notifications, session?.user?.id]);

  // Function to mark displayed notifications as read in db
  const markDisplayedNotificationsAsReadInDB = async (notificationsToMark) => {
    if (notificationsToMark.length === 0) return;

    const unreadNotificationIds = notificationsToMark.map(notification => notification.id);

    try {
      await supaClient.rpc('mark_notifications_as_read', {
        p_notification_ids: unreadNotificationIds,
      });

      // Update the unread count
      fetchUnreadCount();

    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Handle "Show More" click
  const handleLoadMore = () => {
    loadMoreNotifications();
  };

  // Mark notifications as read in local state when component unmounts
  useEffect(() => {
    return () => {
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    };
  }, [setNotifications]);

  return (
    <div className="notifications-container">
      {notifications.length === 0 && <p>No notifications found.</p>}
      <h3>New Notifications</h3>
      <ul className="notifications-list">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationCard notification={notification} />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button className="action-button" onClick={handleLoadMore}>Show More</button>
      ) : (
        <p>No more notifications.</p>
      )}
    </div>
  );
}
