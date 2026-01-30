'use client';

import React from 'react';
import { Lead } from '@/types/funil-vendas';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Draggable } from '@hello-pangea/dnd';

interface KanbanCardProps {
  lead: Lead;
  index: number;
  onClick?: (lead: Lead) => void;
}

export function KanbanCard({ lead, index, onClick }: KanbanCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick?.(lead)}
          className={`
            bg-card border border-border rounded-lg p-3 mb-2 cursor-pointer
            transition-all hover:shadow-md
            ${snapshot.isDragging ? 'shadow-lg rotate-2' : ''}
          `}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{lead.nome}</h4>
              <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
            </div>
            {lead.tags && lead.tags.length > 0 ? (
              <Badge
                variant="default"
                className="text-xs ml-2 shrink-0"
              >
                {lead.tags[0]}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-xs ml-2 shrink-0"
              >
                Sem origem
              </Badge>
            )}
          </div>

          {lead.telefone && (
            <p className="text-xs text-muted-foreground mb-2">{lead.telefone}</p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>ID: {lead.id.slice(0, 8)}</span>
            <span>
              {format(new Date(lead.dataCadastro), 'dd/MM/yyyy')}
            </span>
          </div>

          {lead.tags && lead.tags.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {lead.tags.slice(1).map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

