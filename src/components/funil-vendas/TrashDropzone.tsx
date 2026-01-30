'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface TrashDropzoneProps {
  type?: string;
}

export function TrashDropzone({ type }: TrashDropzoneProps) {
  // Se não especificar type, aceita qualquer tipo (undefined = aceita todos)
  // Se especificar, aceita apenas aquele tipo
  return (
    <Droppable droppableId="trash" type={type} isDropDisabled={false}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={cn(
            'h-9 px-4 rounded-md border border-border bg-background flex items-center justify-center transition-all duration-300 min-w-[36px] relative z-50',
            snapshot.isDraggingOver
              ? 'bg-destructive/40 border-destructive scale-110 shadow-xl ring-2 ring-destructive ring-offset-2 animate-pulse'
              : 'hover:bg-muted/50 hover:border-destructive/50',
            'cursor-pointer'
          )}
          style={{ pointerEvents: 'auto' }}
        >
          <Trash2
            className={cn(
              'h-4 w-4 transition-all duration-300',
              snapshot.isDraggingOver
                ? 'text-destructive scale-150 animate-bounce'
                : 'text-muted-foreground hover:text-destructive'
            )}
          />
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}

