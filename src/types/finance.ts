export type TransactionType = 'payable' | 'receivable';
export type TransactionStatus = 'pending' | 'paid' | 'overdue';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  entityName: string; // Cliente ou Fornecedor
  category: string;
  status: TransactionStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceKPIs {
  totalPending: number;
  overdue: number;
  paidThisMonth: number;
}

export interface FinanceFilters {
  search: string;
  status: TransactionStatus | 'all';
  month: string; // YYYY-MM
}

