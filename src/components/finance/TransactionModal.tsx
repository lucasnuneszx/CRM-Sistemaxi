'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Transaction, TransactionType } from '@/types/finance';
import { format } from 'date-fns';

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  amount: z.string().refine(
    (val) => {
      const num = parseFloat(val.replace(/[^\d,.-]/g, '').replace(',', '.'));
      return !isNaN(num) && num > 0;
    },
    'Valor deve ser maior que zero'
  ),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  entityName: z.string().min(2, 'Nome do cliente/fornecedor é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  status: z.enum(['pending', 'paid', 'overdue']),
  notes: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
  type: TransactionType;
  transaction?: Transaction | null;
  categories?: string[];
}

const defaultCategories = [
  'Serviços',
  'Impostos',
  'Fornecedores',
  'Salários',
  'Aluguel',
  'Marketing',
  'Vendas',
  'Consultoria',
  'Licenças',
  'Assinaturas',
  'Projetos',
];

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  type,
  transaction,
  categories = defaultCategories,
}: TransactionModalProps) {
  const isEdit = !!transaction;
  const isPayable = type === 'payable';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      entityName: '',
      category: '',
      status: 'pending',
      notes: '',
    },
  });

  // Preencher formulário quando editar
  useEffect(() => {
    if (transaction) {
      reset({
        description: transaction.description,
        amount: transaction.amount.toFixed(2).replace('.', ','),
        dueDate: format(transaction.dueDate, 'yyyy-MM-dd'),
        entityName: transaction.entityName,
        category: transaction.category,
        status: transaction.status,
        notes: transaction.notes || '',
      });
    } else {
      reset({
        description: '',
        amount: '',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        entityName: '',
        category: '',
        status: 'pending',
        notes: '',
      });
    }
  }, [transaction, reset]);

  const onFormSubmit = (data: TransactionFormData) => {
    onSubmit(data);
    if (!isEdit) {
      reset();
    }
  };

  const status = watch('status');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Editar ${isPayable ? 'Conta a Pagar' : 'Conta a Receber'}`
              : `Nova ${isPayable ? 'Conta a Pagar' : 'Conta a Receber'}`}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize as informações da transação'
              : `Preencha os dados para criar uma nova ${isPayable ? 'conta a pagar' : 'conta a receber'}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Descrição */}
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">
                Descrição <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Ex: Pagamento de serviços de marketing"
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Valor (R$) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                {...register('amount')}
                placeholder="0,00"
                type="text"
              />
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            {/* Data de Vencimento */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Data de Vencimento <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                {...register('dueDate')}
                type="date"
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate.message}</p>
              )}
            </div>

            {/* Cliente/Fornecedor */}
            <div className="space-y-2">
              <Label htmlFor="entityName">
                {isPayable ? 'Fornecedor' : 'Cliente'} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="entityName"
                {...register('entityName')}
                placeholder={isPayable ? 'Nome do fornecedor' : 'Nome do cliente'}
              />
              {errors.entityName && (
                <p className="text-sm text-red-500">{errors.entityName.message}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Categoria <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">{isPayable ? 'Pago' : 'Recebido'}</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Adicione observações relevantes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


