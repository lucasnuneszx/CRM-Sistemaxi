'use client';

import React from 'react';
import { Zap, FileText, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { BetTicket } from '@/types/betting';

interface BettingTicketCardProps {
  ticket: BetTicket;
  onClick?: () => void;
  className?: string;
}

export default function BettingTicketCard({
  ticket,
  onClick,
  className,
}: BettingTicketCardProps) {
  const borderColor = ticket.borderColor || '#DC2626'; // Vermelho padrão

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-xl',
        className
      )}
      style={{
        borderLeft: `8px solid ${borderColor}`,
      }}
      onClick={onClick}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Ícone com badge */}
          <div className="relative">
            <FileText className="h-5 w-5 text-gray-600" />
            <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {ticket.ticketNumber}
            </div>
          </div>

          {/* Tags de metadados */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            {ticket.isUnique && (
              <span className="px-2 py-1 bg-gray-100 rounded-md font-medium">
                ÚNICO
              </span>
            )}
            <span className="text-gray-500">
              {ticket.timeMinutes}M
            </span>
          </div>
        </div>

        {/* Botão de seta */}
        <button
          className="p-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          aria-label="Ver detalhes"
        >
          <ChevronRight className="h-4 w-4 text-red-600" />
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="p-4 space-y-4">
        {/* Título da Competição */}
        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
          {ticket.competition}
        </h3>

        {/* Odds Display */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            DICAS DE APOSTA
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 line-through tabular-nums">
              {ticket.oldOdd.toFixed(2)}
            </span>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-lg font-bold text-gray-900 tabular-nums">
                {ticket.boostedOdd.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Seleções */}
        <div className="space-y-3">
          {ticket.selections.map((selection, index) => (
            <div key={selection.id} className="flex items-start gap-3">
              {/* Linha vertical conectando os pontos */}
              <div className="flex flex-col items-center pt-1">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full border-2 border-gray-300',
                    index === ticket.selections.length - 1
                      ? 'bg-transparent'
                      : 'bg-white'
                  )}
                />
                {index < ticket.selections.length - 1 && (
                  <div className="w-0.5 h-6 bg-gray-200 mt-0.5" />
                )}
              </div>

              {/* Conteúdo da seleção */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">
                    {selection.team}
                  </span>
                  {selection.hasEarlyPayout && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 border-green-200 text-green-700 text-xs px-2 py-0.5"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Pagamento Antecipado
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selection.market}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé de Valores */}
      <div className="bg-gray-50/80 border-t border-gray-100 px-4 py-3">
        <div className="grid grid-cols-3 gap-4">
          {/* Odds Totais */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-gray-500 uppercase tracking-wide">
              <Zap className="h-3 w-3" />
              ODDS TOTAIS
            </div>
            <div className="text-base font-bold text-gray-900 tabular-nums">
              {ticket.totalOdds.toFixed(2)}
            </div>
          </div>

          {/* Aposta */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              APOSTA
            </div>
            <div className="text-base font-semibold text-gray-700 tabular-nums">
              R$ {ticket.betAmount.toFixed(2).replace('.', ',')}
            </div>
          </div>

          {/* Ganho Potencial */}
          <div className="space-y-1">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              GANHO POTENCIAL
            </div>
            <div className="text-base font-bold text-green-600 tabular-nums">
              R$ {ticket.potentialWin.toFixed(2).replace('.', ',')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

