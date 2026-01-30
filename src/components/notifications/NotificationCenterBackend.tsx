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
import { useAuth } from '@/context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import type { Notification } from '@/types/notification';

interface NotificationBackend {
  id: string;
  tipo: 'nudge' | 'info' | 'urgent';
  titulo: string;
  mensagem: string;
  status: 'unread' | 'read' | 'dismissed';
  from_user_id?: string;
  from_user_name?: string;
  from_user_avatar?: string;
  contexto_tipo?: string;
  contexto_id?: string;
  contexto_nome?: string;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

export default function NotificationCenterBackend() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'nudges' | 'info'>('all');
  const [notifications, setNotifications] = useState<NotificationBackend[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Carregar notificações
  const fetchNotifications = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const [notificationsResponse, countResponse] = await Promise.all([
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICACOES), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        }),
        fetch(buildApiUrl(API_CONFIG.ENDPOINTS.NOTIFICACOES_COUNT), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        }),
      ]);

      if (notificationsResponse.ok) {
        const data = await notificationsResponse.json();
        setNotifications(data);
      }

      if (countResponse.ok) {
        const countData = await countResponse.json();
        setUnreadCount(countData.unread || 0);
        setUrgentCount(countData.urgent || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Recarregar quando abrir o sheet
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, token]);

  // Filtrar notificações por aba
  const getFilteredNotifications = () => {
    const filtered = notifications.filter(n => n.status !== 'dismissed');
    
    switch (activeTab) {
      case 'nudges':
        return filtered.filter(n => n.tipo === 'nudge' || n.tipo === 'urgent');
      case 'info':
        return filtered.filter(n => n.tipo === 'info');
      default:
        return filtered;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const hasUrgent = urgentCount > 0;

  const handleNotificationClick = async (notification: NotificationBackend) => {
    if (notification.status === 'unread' && token) {
      try {
        await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICACOES}/${notification.id}/read`), {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });
        
        // Atualizar estado local
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, status: 'read' as const } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
      }
    }
    
    if (notification.action_url) {
      router.push(notification.action_url);
      setIsOpen(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;

    try {
      await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICACOES}/read-all`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' as const })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getNotificationIcon = (type: NotificationBackend['tipo']) => {
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className={`h-5 w-5 transition-all ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse ${
                hasUrgent ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
              }`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Caixa de Entrada</SheetTitle>
          <SheetDescription>
            Suas notificações e avisos
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Todas ({notifications.filter(n => n.status !== 'dismissed').length})
              </TabsTrigger>
              <TabsTrigger value="nudges">
                Cobranças ({notifications.filter(n => (n.tipo === 'nudge' || n.tipo === 'urgent') && n.status !== 'dismissed').length})
              </TabsTrigger>
              <TabsTrigger value="info">
                Informativos ({notifications.filter(n => n.tipo === 'info' && n.status !== 'dismissed').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando notificações...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma notificação encontrada
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-250px)]">
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`
                          p-4 rounded-lg border cursor-pointer transition-colors
                          ${notification.status === 'unread' ? 'bg-muted/30 border-primary/20' : 'bg-card'}
                          hover:bg-accent
                        `}
                      >
                        <div className="flex items-start gap-3">
                          {notification.from_user_avatar ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={notification.from_user_avatar} />
                              <AvatarFallback>
                                {notification.from_user_name ? getUserInitials(notification.from_user_name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {getNotificationIcon(notification.tipo)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {getNotificationIcon(notification.tipo)}
                              <span className="font-semibold text-sm">
                                {notification.from_user_name || 'Sistema'}
                              </span>
                              {notification.status === 'unread' && (
                                <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                                  Nova
                                </Badge>
                              )}
                            </div>

                            {notification.contexto_nome && (
                              <div className="text-xs text-muted-foreground mb-1">
                                {notification.contexto_tipo === 'project' && '📁 '}
                                {notification.contexto_tipo === 'lead' && '🎯 '}
                                {notification.contexto_tipo === 'proposal' && '📄 '}
                                {notification.contexto_tipo === 'activity' && '✅ '}
                                {notification.contexto_nome}
                              </div>
                            )}

                            <h4 className="font-medium text-sm mb-1">{notification.titulo}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{notification.mensagem}</p>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </span>
                              {notification.action_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(notification.action_url!);
                                    setIsOpen(false);
                                  }}
                                >
                                  Ver <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {notification.status === 'unread' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(notification);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>

          {unreadCount > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

