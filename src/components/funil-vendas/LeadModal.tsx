'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lead } from '@/types/funil-vendas';

const leadSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  status: z.enum(['FREE', 'OCCUPIED', 'CLOSED']),
  observacoes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
}

export function LeadModal({ lead, isOpen, onClose, onSave, onDelete }: LeadModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      status: 'FREE',
      observacoes: '',
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (lead) {
      reset({
        nome: lead.nome,
        email: lead.email,
        telefone: lead.telefone || '',
        status: lead.status,
        observacoes: lead.observacoes || '',
      });
    } else {
      reset({
        nome: '',
        email: '',
        telefone: '',
        status: 'FREE',
        observacoes: '',
      });
    }
  }, [lead, reset]);

  const onSubmit = (data: LeadFormData) => {
    const updatedLead: Lead = {
      ...(lead || {
        id: crypto.randomUUID(),
        dataCadastro: new Date(),
      }),
      ...data,
    };
    onSave(updatedLead);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          <DialogDescription>
            {lead ? 'Edite as informações do lead' : 'Preencha as informações do novo lead'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" {...register('nome')} />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" {...register('telefone')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setValue('status', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FREE">FREE</SelectItem>
                  <SelectItem value="OCCUPIED">OCCUPIED</SelectItem>
                  <SelectItem value="CLOSED">CLOSED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea id="observacoes" {...register('observacoes')} rows={4} />
            </div>
          </div>

          <DialogFooter>
            {lead && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(lead.id);
                  onClose();
                }}
              >
                Excluir
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


