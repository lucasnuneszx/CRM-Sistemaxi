'use client';

import React from 'react';
import { Calendar, User, MoreVertical, FileText, DollarSign, GripVertical } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Proposta } from '@/types/proposta';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProposalCardProps {
  proposta: Proposta;
  index: number;
  onViewDetails?: (proposta: Proposta) => void;
  onEdit?: (proposta: Proposta) => void;
  onDelete?: (propostaId: string) => void;
  onUpdateProgress?: (propostaId: string, progresso: number) => void;
}

export function ProposalCard({
  proposta,
  index,
  onViewDetails,
  onEdit,
  onDelete,
  onUpdateProgress,
}: ProposalCardProps) {
  const getStatusConfig = (status: Proposta['status']) => {
    switch (status) {
      case 'em_aberto':
        return { label: 'Em Aberto', variant: 'default' as const, color: 'bg-green-500' };
      case 'pausado':
        return { label: 'Pausado', variant: 'secondary' as const, color: 'bg-yellow-500' };
      case 'cancelado':
        return { label: 'Cancelado', variant: 'destructive' as const, color: 'bg-red-500' };
      case 'fechado':
      case 'ganho':
        return { label: status === 'ganho' ? 'Ganho' : 'Fechado', variant: 'default' as const, color: 'bg-blue-500' };
      default:
        return { label: 'Indefinido', variant: 'outline' as const, color: 'bg-gray-500' };
    }
  };

  const statusConfig = getStatusConfig(proposta.status);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy");
  };

  return (
    <Draggable draggableId={proposta.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "transition-shadow hover:shadow-lg",
            snapshot.isDragging && "shadow-xl ring-2 ring-primary"
          )}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <Badge variant={statusConfig.variant} className="text-xs">
                  {statusConfig.label}
                </Badge>
                {proposta.prioridade && (
                  <Badge variant="outline" className="text-xs">
                    #{proposta.prioridade}
                  </Badge>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(proposta)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete?.(proposta.id)}
                    className="text-destructive"
                  >
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-lg leading-tight">{proposta.titulo}</CardTitle>
            <CardDescription className="line-clamp-2">
              {proposta.descricao}
            </CardDescription>
          </CardHeader>

      <CardContent className="space-y-6">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Progresso da Negociação</span>
            <span className="font-semibold text-foreground">{proposta.progresso}%</span>
          </div>
          <div 
            className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onEdit?.(proposta)}
            title="Clique para atualizar o progresso"
          >
            <div
              className={`h-full ${statusConfig.color} transition-all duration-300`}
              style={{ width: `${proposta.progresso}%` }}
            />
          </div>
        </div>

        {/* Valor da Proposta */}
        {proposta.valor > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-foreground">
              {formatCurrency(proposta.valor)}
            </span>
          </div>
        )}

        {/* Metadados */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span className="text-xs font-medium uppercase tracking-wide">Criado</span>
            </div>
            <p className="text-sm font-medium">{formatDate(proposta.dataCriacao)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="text-xs font-medium uppercase tracking-wide">Responsável</span>
            </div>
            <p className="text-sm font-medium truncate">
              {proposta.responsavel?.nome || 'Não atribuído'}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          onClick={() => onViewDetails?.(proposta)}
          className="flex-1"
          variant="default"
        >
          Ver Detalhes
        </Button>
        <Button
          onClick={() => onEdit?.(proposta)}
          variant="outline"
          size="icon"
        >
          <FileText className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
      )}
    </Draggable>
  );
}

