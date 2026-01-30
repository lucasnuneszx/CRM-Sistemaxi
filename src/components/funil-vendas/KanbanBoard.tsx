'use client';

import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Lead, KanbanColumn as KanbanColumnType } from '@/types/funil-vendas';
import { useFunilVendas } from '@/context/FunilVendasContext';

interface KanbanBoardProps {
  onLeadClick?: (lead: Lead) => void;
  onAddLead?: (columnId: string) => void;
  onEditColumn?: (column: KanbanColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function KanbanBoard({
  onLeadClick,
  onAddLead,
  onEditColumn,
  onDeleteColumn,
}: KanbanBoardProps) {
  const { state } = useFunilVendas();

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 p-4 h-full min-w-max">
        {state.columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onLeadClick={onLeadClick}
              onAddLead={onAddLead}
              onEditColumn={onEditColumn}
              onDeleteColumn={onDeleteColumn}
            />
          ))}
      </div>
    </div>
  );
}
