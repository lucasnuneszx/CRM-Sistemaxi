'use client';

import { useState } from 'react';
import { Hand, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { NudgePayload } from '@/types/notification';

interface NudgeButtonProps {
  contextType: 'project' | 'lead' | 'proposal' | 'activity';
  contextId: string;
  contextName: string;
  toUserId: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const NUDGE_REASONS = [
  { value: 'atraso', label: 'Atraso' },
  { value: 'cliente_esperando', label: 'Cliente esperando' },
  { value: 'reuniao', label: 'Reunião agendada' },
  { value: 'prioridade', label: 'Alta prioridade' },
  { value: 'deadline', label: 'Prazo próximo' },
  { value: 'outro', label: 'Outro' },
];

export default function NudgeButton({
  contextType,
  contextId,
  contextName,
  toUserId,
  className,
  variant = 'outline',
  size = 'sm',
}: NudgeButtonProps) {
  const { user } = useAuth();
  const { sendNudge } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verificar se o usuário é gestor/admin
  const isManager = user?.role === 'admin' || user?.role === 'project_manager';

  if (!isManager) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason) {
      toast.error('Selecione um motivo para a cobrança');
      return;
    }

    if (reason === 'outro' && !customReason.trim()) {
      toast.error('Descreva o motivo da cobrança');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalReason = reason === 'outro' ? customReason : NUDGE_REASONS.find(r => r.value === reason)?.label || reason;
      
      const payload: NudgePayload = {
        toUserId,
        contextType,
        contextId,
        contextName,
        reason: finalReason,
        message: message.trim() || undefined,
      };

      sendNudge(payload, {
        id: user!.id,
        name: user!.name,
        avatar: user!.foto_perfil,
      });

      toast.success(`Cobrança enviada para ${contextName}`, {
        description: 'O usuário receberá uma notificação urgente',
      });

      // Reset form
      setReason('');
      setCustomReason('');
      setMessage('');
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao enviar cobrança', {
        description: error instanceof Error ? error.message : 'Tente novamente',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          title="Cobrar Status"
        >
          <Hand className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da cobrança</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {NUDGE_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'outro' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Descreva o motivo</Label>
              <Input
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ex: Cliente precisa de resposta urgente"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Preciso de um update sobre isso..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !reason}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Hand className="h-4 w-4 mr-2" />
                  Enviar Alerta
                </>
              )}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}


