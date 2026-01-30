'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FinanceCard } from './FinanceCard';
import { Transaction, TransactionType, FinanceKPIs, FinanceFilters, TransactionStatus } from '@/types/finance';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FinanceTransactionBoardProps {
  type: TransactionType;
  transactions: Transaction[];
  onMarkAsPaid: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function FinanceTransactionBoard({
  type,
  transactions,
  onMarkAsPaid,
  onEdit,
  onDelete,
}: FinanceTransactionBoardProps) {
  const [filters, setFilters] = useState<FinanceFilters>({
    search: '',
    status: 'all',
    month: format(new Date(), 'yyyy-MM'),
  });

  // Calcular KPIs - sempre recalcula quando transactions muda
  const kpis: FinanceKPIs = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);

    // Recalcular status das transações pendentes baseado na data de vencimento
    const transactionsWithUpdatedStatus = transactions.map((t) => {
      if (t.status === 'paid') {
        return t; // Não alterar status de transações pagas
      }
      
      // Se a data de vencimento passou e ainda está pendente, marcar como vencida
      if (t.dueDate < now && t.status === 'pending') {
        return { ...t, status: 'overdue' as const };
      }
      
      return t;
    });

    const totalPending = transactionsWithUpdatedStatus
      .filter((t) => t.status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);

    const overdue = transactionsWithUpdatedStatus
      .filter((t) => t.status === 'overdue')
      .reduce((sum, t) => sum + t.amount, 0);

    const paidThisMonth = transactionsWithUpdatedStatus
      .filter(
        (t) =>
          t.status === 'paid' &&
          t.paidDate &&
          t.paidDate >= startOfCurrentMonth &&
          t.paidDate <= endOfCurrentMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalPending,
      overdue,
      paidThisMonth,
    };
  }, [transactions]);

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(searchLower) ||
          t.entityName.toLowerCase().includes(searchLower) ||
          t.category.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de status
    if (filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    // Filtro de mês
    if (filters.month) {
      const [year, month] = filters.month.split('-').map(Number);
      filtered = filtered.filter((t) => {
        const dueDate = t.dueDate;
        return dueDate.getFullYear() === year && dueDate.getMonth() + 1 === month;
      });
    }

    // Ordenar: vencidos primeiro, depois por data de vencimento
    return filtered.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (a.status !== 'overdue' && b.status === 'overdue') return 1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }, [transactions, filters]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isPayable = type === 'payable';
  const title = isPayable ? 'Contas a Pagar' : 'Contas a Receber';
  const colorTheme = isPayable
    ? {
        primary: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: TrendingDown,
      }
    : {
        primary: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: TrendingUp,
      };

  const Icon = colorTheme.icon;

  // Gerar opções de meses (últimos 12 meses)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      options.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return options;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            Gerencie suas {isPayable ? 'despesas' : 'receitas'} de forma eficiente
          </p>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={cn('border-l-4', isPayable ? 'border-l-orange-500' : 'border-l-green-500')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', colorTheme.primary)}>
              {formatCurrency(kpis.totalPending)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(kpis.overdue)}</p>
          </CardContent>
        </Card>

        <Card className={cn('border-l-4', isPayable ? 'border-l-green-500' : 'border-l-blue-500')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {isPayable ? 'Pago' : 'Recebido'} no Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', isPayable ? 'text-green-600' : 'text-blue-600')}>
              {formatCurrency(kpis.paidThisMonth)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, cliente/fornecedor ou categoria..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value as TransactionStatus | 'all' })
              }
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.month}
              onValueChange={(value) => setFilters({ ...filters, month: value })}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Transações */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Nenhuma transação encontrada</p>
            <p className="text-muted-foreground">
              {filters.search || filters.status !== 'all'
                ? 'Tente ajustar os filtros para encontrar mais resultados.'
                : `Comece adicionando uma nova ${isPayable ? 'conta a pagar' : 'conta a receber'}.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTransactions.map((transaction) => (
            <FinanceCard
              key={transaction.id}
              transaction={transaction}
              type={type}
              onMarkAsPaid={onMarkAsPaid}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

