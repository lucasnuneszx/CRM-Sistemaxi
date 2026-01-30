interface CanalConfig {
  utm_content?: string;
  utm_term?: string;
  utm_medium?: string;
}

interface SubcanalConfig {
  close_friends?: CanalConfig;
  normal?: CanalConfig;
  free?: CanalConfig;
  vip?: CanalConfig;
}

interface CanaisConfig {
  geral?: CanalConfig;
  instagram?: SubcanalConfig;
  telegram?: SubcanalConfig;
}

export interface CasaParceira {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
  link_base: string;
  codigo_afiliado?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  canais_config?: CanaisConfig;
  ativo: boolean;
  projeto_id: string;
  created_at: string;
  updated_at?: string;
} 