import React, { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useApp } from "../../contexts/AppContext";
import RealTimeNotification from "../Common/RealTimeNotification";

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markNotificationAsRead } = useApp();
  const [filter, setFilter] = useState<string>("all");

  const userNotifications = notifications.filter((n) => n.userId === user?.id);

  const filteredNotifications = userNotifications.filter((notification) => {
    if (filter === "unread") return !notification.read;
    if (filter === "read") return notification.read;
    return true;
  });

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = userNotifications.filter((n) => !n.read);
    for (const notification of unreadNotifications) {
      await markNotificationAsRead(notification.id);
    }
  };

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header">
          <div className="header-content">
            <Link to="/dashboard" className="back-link">
              <ArrowLeft className="icon" />
              Back to Dashboard
            </Link>
            <h1 className="page-title">
              <Bell className="icon" />
              Notifications
            </h1>
            <p className="page-subtitle">
              Stay updated with your application status and important
              announcements
            </p>
          </div>

          <div className="header-actions">
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="btn btn-outline">
                Mark All as Read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        <div className="notifications-content">
          <div className="notifications-filters">
            <button
              onClick={() => setFilter("all")}
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
            >
              All ({userNotifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`filter-btn ${filter === "read" ? "active" : ""}`}
            >
              Read ({userNotifications.length - unreadCount})
            </button>
          </div>

          <div className="notifications-list">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${
                    notification.read ? "read" : "unread"
                  }`}
                  onClick={() =>
                    !notification.read && handleMarkAsRead(notification.id)
                  }
                >
                  <RealTimeNotification
                    notification={notification}
                    showAsToast={false}
                  />
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Bell className="empty-icon" />
                <h3>No Notifications</h3>
                <p>
                  {filter === "all"
                    ? "You don't have any notifications yet."
                    : filter === "unread"
                    ? "All notifications have been read."
                    : "No read notifications found."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
