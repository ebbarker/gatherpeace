import React from 'react';
import { Link } from 'react-router-dom';
import { FaRegCommentDots, FaThumbsUp } from "react-icons/fa";

// Utility function to format the path
const formatPath = (path) => path.replace(/_/g, '-');

export function NotificationCard ({ notification }) {
  const notificationLink = `/peace-wall/letter/${formatPath(notification.path.split('.')[1])}#${notification.target_id}`;

  let unreadCount;
  if (notification.unread_count === 1) unreadCount = '';
  if (notification.unread_count === 2) unreadCount = 'and one other person';
  if (notification.unread_count > 2) unreadCount = `and ${notification.unread_count - 1} other people`

  const renderMessage = () => {

    switch (notification.type) {
      case 'comment':
        return (
          <div>
            <span className="notification-card-creator-username">{notification.creator_username}</span>
            {` ${unreadCount} commented on your post.`}
          </div>
        );
      case 'reply':
        return (
          <div>
            <span className="notification-card-creator-username">{notification.creator_username}</span>
            {` ${unreadCount} replied to your comment.`}
          </div>
        );
      case 'like':
        return (
          <div>
            <span className="notification-card-creator-username">{notification.creator_username}</span>
            {` ${unreadCount} liked your post.`}
          </div>
        );
      case 'comment_like':
        return (
          <div>
            <span className="notification-card-creator-username">{notification.creator_username}</span>
            {` ${unreadCount} liked your comment.`}
          </div>
        );
      case 'reply_like':
        return (
          <div>
            <span className="notification-card-creator-username">{notification.creator_username}</span>
            {` ${unreadCount} liked your reply.`}
          </div>
        );
      default:
        return 'You have a new notification.';
    }
  };

  const icon = () => {
    switch (notification.type) {
      case 'comment':
      case 'reply':
        return <FaRegCommentDots />;
      case 'like':
      case 'comment_like':
        return <FaThumbsUp />;
      default:
        return null;
    }
  };

  return (
    <div className={`notification-card ${notification.read ? 'read' : 'unread'}`}>
      <Link to={notificationLink}>
        <div className="notification-content">
          <p className="message">
            <span className="notification-icon">
              {icon()}
            </span>
            {renderMessage()}
          </p>
          <p className="timestamp">{new Date(notification.modified).toLocaleString()}</p>
        </div>
      </Link>
    </div>
  );
};

