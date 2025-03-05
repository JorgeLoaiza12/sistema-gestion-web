"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextProps {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
      {/* Mostrar notificaciones */}
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-md shadow-md max-w-md ${getNotificationStyle(
                notification.type
              )}`}
            >
              <div className="flex justify-between items-center">
                <p className="font-medium">{notification.message}</p>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

function getNotificationStyle(type: NotificationType): string {
  switch (type) {
    case "success":
      return "bg-green-100 border-l-4 border-green-500 text-green-700";
    case "error":
      return "bg-red-100 border-l-4 border-red-500 text-red-700";
    case "warning":
      return "bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700";
    case "info":
      return "bg-blue-100 border-l-4 border-blue-500 text-blue-700";
    default:
      return "bg-gray-100 border-l-4 border-gray-500 text-gray-700";
  }
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
