export interface Proposta {
  id: string;
  titulo: string;
  descricao: string;
  status: 'em_aberto' | 'pausado' | 'cancelado' | 'fechado' | 'ganho';
  progresso: number; // 0-100
  dataCriacao: Date;
  responsavel: {
    id: string;
    nome: string;
  };
  valor: number;
  clienteId?: string;
  clienteNome?: string;
  observacoes?: string;
  prioridade?: number; // Ordem de prioridade (menor = maior prioridade)
  ordem?: number; // Ordem de exibição
}

