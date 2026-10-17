import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Notification } from "../../contexts/AppContext";

interface RealTimeNotificationProps {
  notification: Notification;
  onClose?: () => void;
  showAsToast?: boolean;
}

const RealTimeNotification: React.FC<RealTimeNotificationProps> = ({
  notification,
  onClose,
  showAsToast = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (showAsToast) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [onClose, showAsToast]);

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="icon success" />;
      case "error":
        return <AlertCircle className="icon error" />;
      case "warning":
        return <AlertTriangle className="icon warning" />;
      default:
        return <Info className="icon info" />;
    }
  };

  if (!isVisible) return null;

  if (showAsToast) {
    return (
      <div className={`notification-toast ${notification.type} slide-in`}>
        <div className="toast-content">
          {getIcon()}
          <div className="toast-message">
            <p>{notification.message}</p>
            <span className="toast-time">
              {notification.timestamp.toLocaleTimeString()}
            </span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="toast-close">
            <X className="icon" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`notification-item ${notification.read ? "read" : "unread"}`}
    >
      <div className="notification-content">
        {getIcon()}
        <div className="notification-text">
          <p>{notification.message}</p>
          <span className="notification-time">
            {notification.timestamp.toLocaleTimeString()}
          </span>
        </div>
      </div>
      {!notification.read && <div className="unread-indicator"></div>}
    </div>
  );
};

export default RealTimeNotification;
