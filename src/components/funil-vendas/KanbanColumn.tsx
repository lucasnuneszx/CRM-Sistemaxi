'use client';

import React, { useState } from 'react';
import { MoreVertical, Plus, GripVertical } from 'lucide-react';
import { KanbanColumn as KanbanColumnType, Lead } from '@/types/funil-vendas';
import { KanbanCard } from './KanbanCard';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Droppable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onLeadClick?: (lead: Lead) => void;
  onAddLead?: (columnId: string) => void;
  onEditColumn?: (column: KanbanColumnType) => void;
  onDeleteColumn?: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  onLeadClick,
  onAddLead,
  onEditColumn,
  onDeleteColumn,
}: KanbanColumnProps) {
  return (
    <div className="w-80 bg-muted/30 rounded-lg border border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm truncate">{column.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {column.leads.length}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditColumn?.(column)}>
                  Editar coluna
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDeleteColumn?.(column.id)}
                  className="text-destructive"
                >
                  Excluir coluna
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onAddLead?.(column.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>

      {/* Cards */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 overflow-y-auto p-3 transition-colors
              ${snapshot.isDraggingOver ? 'bg-accent/50' : ''}
            `}
          >
            {column.leads.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 border-2 border-dashed border-border rounded-lg">
                Arraste cards aqui
              </div>
            ) : (
              <div>
                {column.leads.map((lead, index) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    index={index}
                    onClick={onLeadClick}
                  />
                ))}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}


