'use client';

import React from 'react';
import { Calendar, Check, MoreVertical, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Transaction, TransactionType } from '@/types/finance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FinanceCardProps {
  transaction: Transaction;
  type: TransactionType;
  onMarkAsPaid: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function FinanceCard({
  transaction,
  type,
  onMarkAsPaid,
  onEdit,
  onDelete,
}: FinanceCardProps) {
  const isOverdue = transaction.status === 'overdue';
  const isDueToday =
    transaction.status === 'pending' &&
    format(transaction.dueDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isFuture =
    transaction.status === 'pending' &&
    transaction.dueDate > new Date() &&
    !isDueToday;

  // Cores baseadas no status da data
  const getDateColor = () => {
    if (isOverdue) return 'text-red-600 bg-red-50 border-red-200';
    if (isDueToday) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (isFuture) return 'text-gray-600 bg-gray-50 border-gray-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Cores do badge de status
  const getStatusBadgeVariant = () => {
    if (transaction.status === 'paid') return 'default';
    if (transaction.status === 'overdue') return 'destructive';
    return 'secondary';
  };

  const getStatusLabel = () => {
    if (transaction.status === 'paid') return 'Pago';
    if (transaction.status === 'overdue') return 'Atrasado';
    return 'Pendente';
  };

  // Formatação de valor
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-all duration-200 cursor-pointer',
        type === 'payable' && 'border-l-4 border-l-orange-500',
        type === 'receivable' && 'border-l-4 border-l-green-500'
      )}
    >
      <CardContent className="p-4">
        {/* Topo: Data de Vencimento */}
        <div
          className={cn(
            'flex items-center justify-between mb-3 p-2 rounded-md border',
            getDateColor()
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {format(transaction.dueDate, "dd 'de' MMMM", { locale: ptBR })}
            </span>
          </div>
          {isOverdue && <AlertCircle className="h-4 w-4 text-red-600" />}
        </div>

        {/* Centro: Valor */}
        <div className="mb-3">
          <p
            className={cn(
              'text-2xl font-bold',
              type === 'payable' ? 'text-red-600' : 'text-green-600'
            )}
          >
            {type === 'payable' ? '-' : '+'}
            {formatCurrency(transaction.amount)}
          </p>
        </div>

        {/* Corpo: Descrição e Entidade */}
        <div className="mb-3 space-y-1">
          <p className="font-semibold text-sm text-gray-900">{transaction.description}</p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {type === 'payable' ? 'Fornecedor' : 'Cliente'}: {transaction.entityName}
            </p>
            <Badge variant="outline" className="text-xs">
              {transaction.category}
            </Badge>
          </div>
        </div>

        {/* Rodapé: Status e Ações */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Badge variant={getStatusBadgeVariant()} className="text-xs">
            {getStatusLabel()}
          </Badge>
          <div className="flex items-center gap-2">
            {transaction.status !== 'paid' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsPaid(transaction.id);
                }}
                title={type === 'payable' ? 'Marcar como Pago' : 'Marcar como Recebido'}
              >
                <Check
                  className={cn(
                    'h-4 w-4',
                    type === 'payable' ? 'text-green-600' : 'text-blue-600'
                  )}
                />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(transaction.id)}>
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600"
                  >
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

