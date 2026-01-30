'use client';

import React, { useState, useEffect } from 'react';
import { FinanceTransactionBoard } from '@/components/finance/FinanceTransactionBoard';
import { TransactionModal } from '@/components/finance/TransactionModal';
import { Transaction, TransactionType } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseISO } from 'date-fns';

// Mock data para Contas a Pagar
const generateMockPayables = (): Transaction[] => {
  const now = new Date();
  const categories = ['Serviços', 'Impostos', 'Fornecedores', 'Salários', 'Aluguel', 'Marketing'];
  const suppliers = [
    'Fornecedor ABC Ltda',
    'Serviços XYZ',
    'Impostos e Taxas',
    'Equipe de Desenvolvimento',
    'Imobiliária Central',
    'Agência de Marketing Digital',
  ];

  const transactions: Transaction[] = [];
  
  // Transações vencidas
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() - (i + 1) * 5);
    transactions.push({
      id: `payable-overdue-${i}`,
      type: 'payable',
      description: `Pagamento ${categories[i % categories.length]}`,
      amount: Math.random() * 5000 + 500,
      dueDate,
      entityName: suppliers[i % suppliers.length],
      category: categories[i % categories.length],
      status: 'overdue',
      createdAt: new Date(dueDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  // Transações pendentes
  for (let i = 0; i < 8; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + i * 3);
    transactions.push({
      id: `payable-pending-${i}`,
      type: 'payable',
      description: `Pagamento ${categories[i % categories.length]}`,
      amount: Math.random() * 5000 + 500,
      dueDate,
      entityName: suppliers[i % suppliers.length],
      category: categories[i % categories.length],
      status: 'pending',
      createdAt: new Date(dueDate.getTime() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }

  // Transações pagas este mês
  for (let i = 0; i < 5; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() - i * 2);
    const paidDate = new Date(dueDate);
    paidDate.setDate(paidDate.getDate() - 1);
    transactions.push({
      id: `payable-paid-${i}`,
      type: 'payable',
      description: `Pagamento ${categories[i % categories.length]}`,
      amount: Math.random() * 5000 + 500,
      dueDate,
      paidDate,
      entityName: suppliers[i % suppliers.length],
      category: categories[i % categories.length],
      status: 'paid',
      createdAt: new Date(dueDate.getTime() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: paidDate,
    });
  }

  return transactions;
};

const STORAGE_KEY = 'finance_payable_transactions';

// Carregar transações do localStorage ou usar mock
const loadTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return generateMockPayables();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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
  const mockData = generateMockPayables();
  saveTransactions(mockData);
  return mockData;
};

// Salvar transações no localStorage
const saveTransactions = (transactions: Transaction[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Erro ao salvar transações no localStorage:', error);
  }
};

export default function ContasAPagarPage() {
  const router = useRouter();
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
      const loaded = loadTransactions();
      setTransactions(loaded);
      setIsLoaded(true);
    }
  }, [isLoaded]);

  // Salvar sempre que transactions mudar
  useEffect(() => {
    if (isLoaded) {
      saveTransactions(transactions);
    }
  }, [transactions, isLoaded]);

  const handleMarkAsPaid = (id: string) => {
    setConfirmDialog({ open: true, transactionId: id });
  };

  const confirmMarkAsPaid = () => {
    if (confirmDialog.transactionId) {
      // Força recálculo dos KPIs ao marcar como pago
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
    if (confirm('Tem certeza que deseja excluir esta conta a pagar?')) {
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
      id: editingTransaction?.id || `payable-${Date.now()}`,
      type: 'payable',
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
          Nova Conta a Pagar
        </Button>
      </div>

      <FinanceTransactionBoard
        type="payable"
        transactions={transactions}
        onMarkAsPaid={handleMarkAsPaid}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateTransaction}
        type="payable"
        transaction={editingTransaction}
      />

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, transactionId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Deseja marcar esta conta como paga?
            </DialogDescription>
          </DialogHeader>
          {transactionToMark && (
            <div className="py-4">
              <p className="font-semibold">{transactionToMark.description}</p>
              <p className="text-sm text-muted-foreground">
                Fornecedor: {transactionToMark.entityName}
              </p>
              <p className="text-lg font-bold text-orange-600 mt-2">
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
            <Button onClick={confirmMarkAsPaid} className="bg-green-600 hover:bg-green-700">
              <Check className="mr-2 h-4 w-4" />
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

