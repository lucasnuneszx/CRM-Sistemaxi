'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FunilVendasState, FunilVendasAction, Lead, KanbanColumn } from '@/types/funil-vendas';

// Estado inicial
const initialState: FunilVendasState = {
  columns: [],
  backlog: [],
  isLoading: false,
};

// Reducer
function funilVendasReducer(
  state: FunilVendasState,
  action: FunilVendasAction
): FunilVendasState {
  switch (action.type) {
    case 'SET_COLUMNS':
      return { ...state, columns: action.payload };

    case 'SET_BACKLOG':
      return { ...state, backlog: action.payload };

    case 'MOVE_LEAD': {
      const { leadId, fromColumnId, toColumnId, newIndex } = action.payload;
      const newColumns = [...state.columns];
      const newBacklog = [...state.backlog];

      // Remover lead da origem
      let leadToMove: Lead | undefined;
      if (fromColumnId === null) {
        // Movendo do backlog
        const index = newBacklog.findIndex(l => l.id === leadId);
        if (index !== -1) {
          leadToMove = newBacklog.splice(index, 1)[0];
        }
      } else {
        // Movendo de uma coluna
        const fromColumn = newColumns.find(c => c.id === fromColumnId);
        if (fromColumn) {
          const index = fromColumn.leads.findIndex(l => l.id === leadId);
          if (index !== -1) {
            leadToMove = fromColumn.leads.splice(index, 1)[0];
          }
        }
      }

      if (!leadToMove) return state;

      // Adicionar lead ao destino
      if (toColumnId === 'backlog') {
        newBacklog.splice(newIndex, 0, { ...leadToMove, columnId: undefined });
      } else {
        const toColumn = newColumns.find(c => c.id === toColumnId);
        if (toColumn) {
          leadToMove.columnId = toColumnId;
          toColumn.leads.splice(newIndex, 0, leadToMove);
        }
      }

      return { ...state, columns: newColumns, backlog: newBacklog };
    }

    case 'ADD_LEAD': {
      const { lead, columnId } = action.payload;
      if (columnId) {
        const newColumns = state.columns.map(col =>
          col.id === columnId
            ? { ...col, leads: [...col.leads, { ...lead, columnId }] }
            : col
        );
        return { ...state, columns: newColumns };
      } else {
        return { ...state, backlog: [...state.backlog, lead] };
      }
    }

    case 'UPDATE_LEAD': {
      const { leadId, updates } = action.payload;
      const newColumns = state.columns.map(col => ({
        ...col,
        leads: col.leads.map(lead =>
          lead.id === leadId ? { ...lead, ...updates } : lead
        ),
      }));
      const newBacklog = state.backlog.map(lead =>
        lead.id === leadId ? { ...lead, ...updates } : lead
      );
      return { ...state, columns: newColumns, backlog: newBacklog };
    }

    case 'DELETE_LEAD': {
      const { leadId } = action.payload;
      const newColumns = state.columns.map(col => ({
        ...col,
        leads: col.leads.filter(lead => lead.id !== leadId),
      }));
      const newBacklog = state.backlog.filter(lead => lead.id !== leadId);
      return { ...state, columns: newColumns, backlog: newBacklog };
    }

    case 'ADD_COLUMN': {
      return { ...state, columns: [...state.columns, action.payload.column] };
    }

    case 'UPDATE_COLUMN': {
      const { columnId, updates } = action.payload;
      const newColumns = state.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      );
      return { ...state, columns: newColumns };
    }

    case 'DELETE_COLUMN': {
      const { columnId } = action.payload;
      const column = state.columns.find(c => c.id === columnId);
      if (column) {
        // Mover leads de volta para o backlog
        const newBacklog = [...state.backlog, ...column.leads.map(l => ({ ...l, columnId: undefined }))];
        const newColumns = state.columns.filter(c => c.id !== columnId);
        return { ...state, columns: newColumns, backlog: newBacklog };
      }
      return state;
    }

    case 'REORDER_COLUMNS':
      return { ...state, columns: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    default:
      return state;
  }
}

// Context
interface FunilVendasContextType {
  state: FunilVendasState;
  dispatch: React.Dispatch<FunilVendasAction>;
  // Helper functions
  moveLead: (leadId: string, fromColumnId: string | null, toColumnId: string, newIndex: number) => void;
  addLead: (lead: Lead, columnId?: string) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  deleteLead: (leadId: string) => void;
  addColumn: (column: KanbanColumn) => void;
  updateColumn: (columnId: string, updates: Partial<KanbanColumn>) => void;
  deleteColumn: (columnId: string) => void;
  reorderColumns: (columns: KanbanColumn[]) => void;
}

const FunilVendasContext = createContext<FunilVendasContextType | undefined>(undefined);

// Provider
export function FunilVendasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(funilVendasReducer, initialState);

  const moveLead = (leadId: string, fromColumnId: string | null, toColumnId: string, newIndex: number) => {
    dispatch({ type: 'MOVE_LEAD', payload: { leadId, fromColumnId, toColumnId, newIndex } });
  };

  const addLead = (lead: Lead, columnId?: string) => {
    dispatch({ type: 'ADD_LEAD', payload: { lead, columnId } });
  };

  const updateLead = (leadId: string, updates: Partial<Lead>) => {
    dispatch({ type: 'UPDATE_LEAD', payload: { leadId, updates } });
  };

  const deleteLead = (leadId: string) => {
    dispatch({ type: 'DELETE_LEAD', payload: { leadId } });
  };

  const addColumn = (column: KanbanColumn) => {
    dispatch({ type: 'ADD_COLUMN', payload: { column } });
  };

  const updateColumn = (columnId: string, updates: Partial<KanbanColumn>) => {
    dispatch({ type: 'UPDATE_COLUMN', payload: { columnId, updates } });
  };

  const deleteColumn = (columnId: string) => {
    dispatch({ type: 'DELETE_COLUMN', payload: { columnId } });
  };

  const reorderColumns = (columns: KanbanColumn[]) => {
    dispatch({ type: 'REORDER_COLUMNS', payload: columns });
  };

  return (
    <FunilVendasContext.Provider
      value={{
        state,
        dispatch,
        moveLead,
        addLead,
        updateLead,
        deleteLead,
        addColumn,
        updateColumn,
        deleteColumn,
        reorderColumns,
      }}
    >
      {children}
    </FunilVendasContext.Provider>
  );
}

// Hook
export function useFunilVendas() {
  const context = useContext(FunilVendasContext);
  if (context === undefined) {
    throw new Error('useFunilVendas must be used within a FunilVendasProvider');
  }
  return context;
}

