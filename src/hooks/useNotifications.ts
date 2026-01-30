import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/types/notification';

export function useNotifications() {
  const store = useNotificationStore();

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    urgentCount: store.urgentCount,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    dismissNotification: store.dismissNotification,
    removeNotification: store.removeNotification,
    clearAll: store.clearAll,
    getNotificationsByType: store.getNotificationsByType,
    getNotificationsByContext: store.getNotificationsByContext,
    hasPendingNudge: store.hasPendingNudge,
  };
}

export function usePendingNudge(contextType: string, contextId: string) {
  const hasPendingNudge = useNotificationStore(
    (state) => state.hasPendingNudge(contextType, contextId)
  );

  return hasPendingNudge;
}


