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
import { KanbanColumn } from '@/types/funil-vendas';

const columnSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
});

type ColumnFormData = z.infer<typeof columnSchema>;

interface ColumnModalProps {
  column: KanbanColumn | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (column: KanbanColumn) => void;
}

export function ColumnModal({ column, isOpen, onClose, onSave }: ColumnModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ColumnFormData>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      title: '',
    },
  });

  useEffect(() => {
    if (column) {
      reset({
        title: column.title,
      });
    } else {
      reset({
        title: '',
      });
    }
  }, [column, reset]);

  const onSubmit = (data: ColumnFormData) => {
    const updatedColumn: KanbanColumn = {
      ...(column || {
        id: crypto.randomUUID(),
        order: 0,
        leads: [],
      }),
      ...data,
    };
    onSave(updatedColumn);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{column ? 'Editar Coluna' : 'Nova Coluna'}</DialogTitle>
          <DialogDescription>
            {column ? 'Edite o nome da coluna' : 'Digite o nome da nova coluna'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
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


