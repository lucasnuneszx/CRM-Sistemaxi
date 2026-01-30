import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NudgePayload, NotificationStatus } from '@/types/notification';
import { v4 as uuidv4 } from 'uuid';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  urgentCount: number;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'status'>) => void;
  sendNudge: (payload: NudgePayload, fromUser: { id: string; name: string; avatar?: string }) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;
  
  // Getters
  getNotificationsByType: (type: Notification['type']) => Notification[];
  getNotificationsByContext: (contextType: string, contextId: string) => Notification[];
  hasPendingNudge: (contextType: string, contextId: string) => boolean;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      urgentCount: 0,

      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: uuidv4(),
          createdAt: new Date(),
          status: 'unread',
        };

        set((state) => {
          const newNotifications = [notification, ...state.notifications];
          const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
          const urgentCount = newNotifications.filter(
            n => n.status === 'unread' && (n.type === 'nudge' || n.type === 'urgent')
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
            urgentCount,
          };
        });
      },

      sendNudge: (payload, fromUser) => {
        const notification: Notification = {
          id: uuidv4(),
          type: 'nudge',
          status: 'unread',
          title: 'Cobrança de Status',
          message: payload.message || `Preciso de um update sobre ${payload.contextName}.`,
          fromUserId: fromUser.id,
          fromUserName: fromUser.name,
          fromUserAvatar: fromUser.avatar,
          contextType: payload.contextType,
          contextId: payload.contextId,
          contextName: payload.contextName,
          reason: payload.reason,
          createdAt: new Date(),
          actionUrl: getActionUrl(payload.contextType, payload.contextId),
        };

        set((state) => {
          const newNotifications = [notification, ...state.notifications];
          const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
          const urgentCount = newNotifications.filter(
            n => n.status === 'unread' && (n.type === 'nudge' || n.type === 'urgent')
          ).length;

          return {
            notifications: newNotifications,
            unreadCount,
            urgentCount,
          };
        });
      },

      markAsRead: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.id === notificationId && n.status === 'unread'
              ? { ...n, status: 'read' as NotificationStatus, readAt: new Date() }
              : n
          );

          const unreadCount = updatedNotifications.filter(n => n.status === 'unread').length;
          const urgentCount = updatedNotifications.filter(
            n => n.status === 'unread' && (n.type === 'nudge' || n.type === 'urgent')
          ).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
            urgentCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.status === 'unread'
              ? { ...n, status: 'read' as NotificationStatus, readAt: new Date() }
              : n
          );

          return {
            notifications: updatedNotifications,
            unreadCount: 0,
            urgentCount: 0,
          };
        });
      },

      dismissNotification: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((n) =>
            n.id === notificationId
              ? { ...n, status: 'dismissed' as NotificationStatus }
              : n
          );

          const unreadCount = updatedNotifications.filter(n => n.status === 'unread').length;
          const urgentCount = updatedNotifications.filter(
            n => n.status === 'unread' && (n.type === 'nudge' || n.type === 'urgent')
          ).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
            urgentCount,
          };
        });
      },

      removeNotification: (notificationId) => {
        set((state) => {
          const filtered = state.notifications.filter(n => n.id !== notificationId);
          const unreadCount = filtered.filter(n => n.status === 'unread').length;
          const urgentCount = filtered.filter(
            n => n.status === 'unread' && (n.type === 'nudge' || n.type === 'urgent')
          ).length;

          return {
            notifications: filtered,
            unreadCount,
            urgentCount,
          };
        });
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
          urgentCount: 0,
        });
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter(n => n.type === type && n.status !== 'dismissed');
      },

      getNotificationsByContext: (contextType, contextId) => {
        return get().notifications.filter(
          n => n.contextType === contextType && n.contextId === contextId && n.status !== 'dismissed'
        );
      },

      hasPendingNudge: (contextType, contextId) => {
        return get().notifications.some(
          n => n.contextType === contextType &&
               n.contextId === contextId &&
               n.type === 'nudge' &&
               n.status === 'unread'
        );
      },
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);

// Helper function to generate action URLs
function getActionUrl(contextType: string, contextId: string): string {
  switch (contextType) {
    case 'project':
      return `/projects/${contextId}`;
    case 'lead':
      return `/funil-vendas?lead=${contextId}`;
    case 'proposal':
      return `/propostas/${contextId}`;
    case 'activity':
      return `/atividades/${contextId}/edit`;
    default:
      return '/dashboard';
  }
}


