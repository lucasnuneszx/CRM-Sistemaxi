'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, Info, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/types/notification';

export default function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'nudges' | 'info'>('all');
  
  const {
    notifications,
    unreadCount,
    urgentCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    removeNotification,
  } = useNotificationStore();

  // Filtrar notificações por aba
  const getFilteredNotifications = () => {
    const filtered = notifications.filter((n: Notification) => n.status !== 'dismissed');
    
    switch (activeTab) {
      case 'nudges':
        return filtered.filter((n: Notification) => n.type === 'nudge' || n.type === 'urgent');
      case 'info':
        return filtered.filter((n: Notification) => n.type === 'info');
      default:
        return filtered;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const hasUrgent = urgentCount > 0;

  const handleNotificationClick = (notification: Notification) => {
    if (notification.status === 'unread') {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'nudge':
      case 'urgent':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${
                hasUrgent ? 'animate-pulse' : ''
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px] p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Notificações</SheetTitle>
              <SheetDescription>
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
              </SheetDescription>
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="w-full rounded-none border-b px-6">
            <TabsTrigger value="all" className="flex-1">
              Todas ({notifications.filter((n: Notification) => n.status !== 'dismissed').length})
            </TabsTrigger>
            <TabsTrigger value="nudges" className="flex-1">
              Cobranças ({notifications.filter((n: Notification) => (n.type === 'nudge' || n.type === 'urgent') && n.status !== 'dismissed').length})
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-1">
              Informativos ({notifications.filter((n: Notification) => n.type === 'info' && n.status !== 'dismissed').length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <TabsContent value={activeTab} className="mt-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'all' && 'Nenhuma notificação'}
                    {activeTab === 'nudges' && 'Nenhuma cobrança pendente'}
                    {activeTab === 'info' && 'Nenhum informativo'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification: Notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${
                        notification.status === 'unread' ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Avatar do remetente */}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.fromUserAvatar} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                            {getUserInitials(notification.fromUserName)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getNotificationIcon(notification.type)}
                              <p className="text-sm font-semibold truncate">
                                {notification.fromUserName}
                              </p>
                              {notification.status === 'unread' && (
                                <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                                  Nova
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Contexto */}
                          {notification.contextName && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {notification.contextType === 'project' && '📁 '}
                              {notification.contextType === 'lead' && '🎯 '}
                              {notification.contextType === 'proposal' && '📄 '}
                              {notification.contextType === 'activity' && '✅ '}
                              {notification.contextName}
                            </p>
                          )}

                          {/* Mensagem */}
                          <p className="text-sm text-foreground mb-2">
                            {notification.message}
                          </p>

                          {/* Motivo da cobrança */}
                          {notification.reason && (
                            <Badge variant="outline" className="text-xs mb-2">
                              {notification.reason}
                            </Badge>
                          )}

                          {/* Timestamp */}
                          <p className="text-xs text-muted-foreground mb-2">
                            {formatDistanceToNow(notification.createdAt, {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>

                          {/* Ações */}
                          <div className="flex gap-2 mt-2">
                            {notification.actionUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                            )}
                            {notification.status === 'unread' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Marcar como lida
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}


