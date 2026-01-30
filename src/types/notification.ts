export type NotificationType = 'nudge' | 'info' | 'urgent';

export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface Notification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  contextType: 'project' | 'lead' | 'proposal' | 'activity' | 'general';
  contextId?: string;
  contextName?: string;
  reason?: string; // Motivo da cobrança (ex: "Atraso", "Cliente esperando")
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string; // URL para ação rápida
}

export interface NudgePayload {
  toUserId: string;
  contextType: 'project' | 'lead' | 'proposal' | 'activity';
  contextId: string;
  contextName: string;
  reason: string;
  message?: string;
}


