'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import payload from 'payload';
import type { Notification } from '../payload-types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await payload.find({
        collection: 'notifications',
        sort: '-createdAt',
      });
      setNotifications(response.docs);

      // Show toast for new unread notifications
      response.docs
        .filter(notification => !notification.read)
        .forEach(notification => {
          toast[notification.type as 'info' | 'success' | 'warning' | 'error'](
            notification.message
          );
        });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await payload.update({
        collection: 'notifications',
        id: notificationId,
        data: {
          read: true,
        },
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification =>
          payload.update({
            collection: 'notifications',
            id: notification.id,
            data: {
              read: true,
            },
          })
        )
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
