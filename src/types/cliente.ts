export interface Cliente {
  id?: string;
  nome: string;
  cpf?: string;
  dataNascimento?: string;
  email: string;
  telefone?: string;
  whatsapp?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  origemLead?: string;
  leadId?: string; // ID do lead que originou este cliente
  observacoes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}


