export interface BetSelection {
  id: string;
  team: string;
  market: string;
  hasEarlyPayout?: boolean; // Se true, mostra badge "Pagamento Antecipado"
}

export interface BetTicket {
  id: string;
  ticketNumber: number; // Número do bilhete (badge no ícone)
  competition: string; // Título da competição
  isUnique: boolean; // Se mostra tag "ÚNICO"
  timeMinutes: number; // Tempo em minutos (ex: 4M)
  oldOdd: number; // Odd antiga (riscada)
  boostedOdd: number; // Odd turbinada (com ícone de raio)
  selections: BetSelection[]; // Lista de seleções
  totalOdds: number; // Odds totais
  betAmount: number; // Valor da aposta em R$
  potentialWin: number; // Ganho potencial em R$
  borderColor?: string; // Cor da borda lateral (padrão: vermelho #DC2626)
}

