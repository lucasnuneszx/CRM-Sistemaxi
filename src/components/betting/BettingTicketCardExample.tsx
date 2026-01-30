'use client';

import React from 'react';
import BettingTicketCard from './BettingTicketCard';
import type { BetTicket } from '@/types/betting';

/**
 * Exemplo de uso do BettingTicketCard
 * Baseado na imagem de referência com Real Madrid, Odd 8.00, Aposta 60,00
 */
export default function BettingTicketCardExample() {
  // Exemplo de bilhete baseado na imagem
  const exampleTicket: BetTicket = {
    id: 'ticket-001',
    ticketNumber: 1,
    competition: 'Longo Prazo - UEFA Champions League',
    isUnique: true,
    timeMinutes: 4,
    oldOdd: 6.50,
    boostedOdd: 8.00,
    selections: [
      {
        id: 'sel-001',
        team: 'Real Madrid',
        market: 'Vencer a partida',
        hasEarlyPayout: true, // Ativando Pagamento Antecipado
      },
    ],
    totalOdds: 8.00,
    betAmount: 60.00,
    potentialWin: 480.00, // 60.00 * 8.00
    borderColor: '#DC2626', // Vermelho como na imagem
  };

  // Exemplo com múltiplas seleções
  const multiSelectionTicket: BetTicket = {
    id: 'ticket-002',
    ticketNumber: 2,
    competition: 'Combinado - Premier League + La Liga',
    isUnique: false,
    timeMinutes: 15,
    oldOdd: 12.50,
    boostedOdd: 15.00,
    selections: [
      {
        id: 'sel-002-1',
        team: 'Manchester City',
        market: 'Vencer a partida',
        hasEarlyPayout: false,
      },
      {
        id: 'sel-002-2',
        team: 'Barcelona',
        market: 'Mais de 2.5 gols',
        hasEarlyPayout: true,
      },
      {
        id: 'sel-002-3',
        team: 'Liverpool',
        market: 'Ambos marcam',
        hasEarlyPayout: false,
      },
    ],
    totalOdds: 15.00,
    betAmount: 50.00,
    potentialWin: 750.00,
    borderColor: '#059669', // Verde para diferenciar
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Exemplos de Bilhetes de Aposta
          </h1>
          <p className="text-gray-600">
            Componentes BettingTicketCard com diferentes configurações
          </p>
        </div>

        {/* Exemplo 1: Baseado na imagem (Real Madrid) */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Exemplo 1: Bilhete Único (Real Madrid)
          </h2>
          <BettingTicketCard
            ticket={exampleTicket}
            onClick={() => console.log('Bilhete clicado:', exampleTicket.id)}
          />
        </div>

        {/* Exemplo 2: Múltiplas seleções */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Exemplo 2: Combinado com Múltiplas Seleções
          </h2>
          <BettingTicketCard
            ticket={multiSelectionTicket}
            onClick={() =>
              console.log('Bilhete clicado:', multiSelectionTicket.id)
            }
          />
        </div>

        {/* Grid de exemplos */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Grid de Exemplos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BettingTicketCard
              ticket={{
                ...exampleTicket,
                id: 'ticket-003',
                ticketNumber: 3,
                borderColor: '#7C3AED', // Roxo
              }}
            />
            <BettingTicketCard
              ticket={{
                ...exampleTicket,
                id: 'ticket-004',
                ticketNumber: 4,
                borderColor: '#2563EB', // Azul
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

