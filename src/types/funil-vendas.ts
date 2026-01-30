export interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  status: 'FREE' | 'OCCUPIED' | 'CLOSED';
  tags?: string[];
  dataCadastro: Date;
  observacoes?: string;
  columnId?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  color?: string;
  leads: Lead[];
}

export interface FunilVendasState {
  columns: KanbanColumn[];
  backlog: Lead[];
  isLoading: boolean;
}

export type FunilVendasAction =
  | { type: 'SET_COLUMNS'; payload: KanbanColumn[] }
  | { type: 'SET_BACKLOG'; payload: Lead[] }
  | { type: 'MOVE_LEAD'; payload: { leadId: string; fromColumnId: string | null; toColumnId: string; newIndex: number } }
  | { type: 'ADD_LEAD'; payload: { lead: Lead; columnId?: string } }
  | { type: 'UPDATE_LEAD'; payload: { leadId: string; updates: Partial<Lead> } }
  | { type: 'DELETE_LEAD'; payload: { leadId: string } }
  | { type: 'ADD_COLUMN'; payload: { column: KanbanColumn } }
  | { type: 'UPDATE_COLUMN'; payload: { columnId: string; updates: Partial<KanbanColumn> } }
  | { type: 'DELETE_COLUMN'; payload: { columnId: string } }
  | { type: 'REORDER_COLUMNS'; payload: KanbanColumn[] }
  | { type: 'SET_LOADING'; payload: boolean };

