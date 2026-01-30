'use client';

import React, { useState, useEffect } from 'react';
import { FinanceTransactionBoard } from '@/components/finance/FinanceTransactionBoard';
import { TransactionModal } from '@/components/finance/TransactionModal';
import { Transaction, TransactionType } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';
import { parseISO } from 'date-fns';

// Mock data para Contas a Receber
const generateMockReceivables = (): Transaction[] => {
  const now = new Date();
  const categories = ['Vendas', 'Serviços', 'Consultoria', 'Licenças', 'Assinaturas', 'Projetos'];
  const clients = [
    'Cliente Premium',
    'Empresa XYZ',
    'Startup Tech',
    'Corporação ABC',
    'Negócios Digitais',
    'Inovação Ltda',
  ];

  const transactions: Transaction[] = [];
  
  // Transações vencidas
  for (let i = 0; i < 2; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() - (i + 1) * 7);
    transactions.push({
      id: `receivable-overdue-${i}`,
      type: 'receivable',
      description: `Recebimento ${categories[i % categories.length]}`,
      amount: Math.random() * 10000 + 1000,
      dueDate,
      entityName: clients[i % clients.length],
      category: categories[i % categories.length],
      status: 'overdue',
      createdAt: new Date(dueDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  // Transações pendentes
  for (let i = 0; i < 10; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + i * 5);
    transactions.push({
      id: `receivable-pending-${i}`,
      type: 'receivable',
      description: `Recebimento ${categories[i % categories.length]}`,
      amount: Math.random() * 10000 + 1000,
      dueDate,
      entityName: clients[i % clients.length],
      category: categories[i % categories.length],
      status: 'pending',
      createdAt: new Date(dueDate.getTime() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  // Transações recebidas este mês
  for (let i = 0; i < 6; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() - i * 3);
    const paidDate = new Date(dueDate);
    paidDate.setDate(paidDate.getDate() - 2);
    transactions.push({
      id: `receivable-paid-${i}`,
      type: 'receivable',
      description: `Recebimento ${categories[i % categories.length]}`,
      amount: Math.random() * 10000 + 1000,
      dueDate,
      paidDate,
      entityName: clients[i % clients.length],
      category: categories[i % categories.length],
      status: 'paid',
      createdAt: new Date(dueDate.getTime() - 25 * 24 * 60 * 60 * 1000),
      updatedAt: paidDate,
    });
  }

  return transactions;
};

const STORAGE_KEY_RECEIVABLE = 'finance_receivable_transactions';

// Carregar transações do localStorage ou usar mock
const loadReceivableTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return generateMockReceivables();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_RECEIVABLE);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Converter datas de string para Date
      return parsed.map((t: any) => ({
        ...t,
        dueDate: new Date(t.dueDate),
        paidDate: t.paidDate ? new Date(t.paidDate) : undefined,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      }));
    }
  } catch (error) {
    console.error('Erro ao carregar transações do localStorage:', error);
  }
  
  // Se não houver dados salvos, usar mock e salvar
  const mockData = generateMockReceivables();
  saveReceivableTransactions(mockData);
  return mockData;
};

// Salvar transações no localStorage
const saveReceivableTransactions = (transactions: Transaction[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY_RECEIVABLE, JSON.stringify(transactions));
  } catch (error) {
    console.error('Erro ao salvar transações no localStorage:', error);
  }
};

export default function ContasAReceberPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; transactionId: string | null }>({
    open: false,
    transactionId: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Carregar transações apenas uma vez ao montar
  useEffect(() => {
    if (!isLoaded) {
      const loaded = loadReceivableTransactions();
      setTransactions(loaded);
      setIsLoaded(true);
    }
  }, [isLoaded]);

  // Salvar sempre que transactions mudar
  useEffect(() => {
    if (isLoaded) {
      saveReceivableTransactions(transactions);
    }
  }, [transactions, isLoaded]);

  const handleMarkAsPaid = (id: string) => {
    setConfirmDialog({ open: true, transactionId: id });
  };

  const confirmMarkAsPaid = () => {
    if (confirmDialog.transactionId) {
      // Força recálculo dos KPIs ao marcar como recebido
      setTransactions((prev) => {
        const updated = prev.map((t) =>
          t.id === confirmDialog.transactionId
            ? {
                ...t,
                status: 'paid' as const,
                paidDate: new Date(),
                updatedAt: new Date(),
              }
            : t
        );
        return updated;
      });
      setConfirmDialog({ open: false, transactionId: null });
    }
  };

  const handleEdit = (id: string) => {
    const transaction = transactions.find((t) => t.id === id);
    if (transaction) {
      setEditingTransaction(transaction);
      setIsModalOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conta a receber?')) {
      // Força recálculo dos KPIs removendo a transação
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        return updated;
      });
    }
  };

  const handleCreateTransaction = (formData: any) => {
    const amount = parseFloat(formData.amount.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    const dueDate = parseISO(formData.dueDate);
    const now = new Date();
    
    // Determinar status baseado na data e no status selecionado
    let status: 'pending' | 'paid' | 'overdue' = 'pending';
    if (formData.status === 'paid') {
      status = 'paid';
    } else if (dueDate < now && formData.status !== 'paid') {
      status = 'overdue';
    } else {
      status = 'pending';
    }

    const newTransaction: Transaction = {
      id: editingTransaction?.id || `receivable-${Date.now()}`,
      type: 'receivable',
      description: formData.description,
      amount,
      dueDate,
      paidDate: formData.status === 'paid' ? new Date() : undefined,
      entityName: formData.entityName,
      category: formData.category,
      status,
      notes: formData.notes || undefined,
      createdAt: editingTransaction?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    if (editingTransaction) {
      // Atualizar transação existente - força recálculo dos KPIs
      setTransactions((prev) => {
        const updated = prev.map((t) => (t.id === editingTransaction.id ? newTransaction : t));
        return updated;
      });
    } else {
      // Adicionar nova transação - força recálculo dos KPIs
      setTransactions((prev) => {
        const updated = [...prev, newTransaction];
        return updated;
      });
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleOpenModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const transactionToMark = transactions.find((t) => t.id === confirmDialog.transactionId);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={handleOpenModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Conta a Receber
        </Button>
      </div>

      <FinanceTransactionBoard
        type="receivable"
        transactions={transactions}
        onMarkAsPaid={handleMarkAsPaid}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateTransaction}
        type="receivable"
        transaction={editingTransaction}
      />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, transactionId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
            <DialogDescription>
              Deseja marcar esta conta como recebida?
            </DialogDescription>
          </DialogHeader>
          {transactionToMark && (
            <div className="py-4">
              <p className="font-semibold">{transactionToMark.description}</p>
              <p className="text-sm text-muted-foreground">
                Cliente: {transactionToMark.entityName}
              </p>
              <p className="text-lg font-bold text-green-600 mt-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(transactionToMark.amount)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, transactionId: null })}>
              Cancelar
            </Button>
            <Button onClick={confirmMarkAsPaid} className="bg-blue-600 hover:bg-blue-700">
              <Check className="mr-2 h-4 w-4" />
              Confirmar Recebimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

