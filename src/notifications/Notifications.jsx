import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../layout/App";
import { supaClient } from "../layout/supa-client";
import { Link } from "react-router-dom";
import { NotificationCard } from "./NotificationCard";
import './Notifications.css';
import { NotificationsContext } from './NotificationsContext';


export function Notifications() {
  const { notifications, oldNotifications, hasMore, loadMoreNotifications } = useContext(NotificationsContext);

  return (
    <div className="notifications-container">
      {/* <h1>Notifications</h1> */}
      {notifications.length === 0 && <p>No notifications found.</p>}
      <h3>New Notifications</h3>
      <ul className="notifications-list">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <NotificationCard notification={notification} />
          </li>
        ))}
      </ul>
      <h3>Previous Notifications</h3>
      <ul className="notifications-list">
        {oldNotifications.map((notification) => (
          <li key={notification.id}>
            <NotificationCard notification={notification} />
          </li>
        ))}
      </ul>
      {hasMore ? (
        <button onClick={loadMoreNotifications}>Show More</button>
      ) : (
        <p>No more notifications.</p>
      )}
    </div>
  );
}

