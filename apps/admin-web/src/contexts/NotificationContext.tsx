'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  title: string;
  body: string;
  eventId?: string;
  matchId?: string;
  roundId?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications({ limit: 20 });
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationsAsRead([id]);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, status: 'READ' as const, readAt: new Date().toISOString() } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          status: 'READ' as const,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      // Decrease unread count if it was unread
      const notification = notifications.find(n => n.id === id);
      if (notification?.status === 'UNREAD') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Initialize Socket.IO connection for real-time notifications
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    // Fetch initial data
    Promise.all([fetchNotifications(), fetchUnreadCount()]).finally(() => {
      setLoading(false);
    });

    // Connect to Socket.IO
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Notification socket connected');
      // User's personal notification room is automatically joined by the server
    });

    newSocket.on('notification', (notification: Notification) => {
      console.log('New notification received:', notification);

      // Add to notifications list
      setNotifications(prev => [notification, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);

      // Show toast notification for NORMAL and above
      const toastFn = notification.priority === 'URGENT' || notification.priority === 'HIGH'
        ? toast.error
        : notification.priority === 'NORMAL'
          ? toast.info
          : null;

      if (toastFn) {
        toastFn(notification.title, {
          description: notification.body,
          duration: 5000,
        });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [fetchNotifications, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
