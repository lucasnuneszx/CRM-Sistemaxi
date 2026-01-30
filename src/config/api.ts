// Função para determinar se deve usar proxy
const shouldUseProxy = (): boolean => {
  if (typeof window === 'undefined') return false; // Server-side
  return window.location.protocol === 'https:' && process.env.NODE_ENV === 'production';
};

// Função para obter URL base
const getBaseUrl = (): string => {
  if (shouldUseProxy()) {
    return `${window.location.origin}/api/proxy`;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

// Função para obter URL da API
const getApiBaseUrl = (): string => {
  if (shouldUseProxy()) {
    return `${window.location.origin}/api/proxy/api`;
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
};

// Configuração das URLs da API
export const API_CONFIG = {
  get BASE_URL() { return getBaseUrl(); },
  get API_BASE_URL() { return getApiBaseUrl(); },
  
  // Endpoints específicos
  ENDPOINTS: {
    // Autenticação
    LOGIN: '/v1/auth/login',
    REGISTER: '/v1/auth/register',
    ME: '/v1/auth/me',
    
    // Projetos
    PROJECTS: '/projects',
    PROJECTS_V1: '/v1/projects',
    
    // Usuários
    USERS: '/v1/users',
    USERS_FOR_ASSIGNMENT: '/users/for-assignment',
    USERS_ME: '/v1/users/me',
    USERS_ME_STATS: '/v1/users/me/stats',
    USERS_ME_CHANGE_PASSWORD: '/v1/users/me/change-password',
    USERS_ME_UPLOAD_PHOTO: '/v1/users/me/upload-photo',
    
    // Atividades
    ACTIVITIES: '/v1/atividades',
    ACTIVITIES_OLD: '/atividades', // Algumas rotas ainda usam sem v1
    
    // Setores
    SECTORS: '/v1/setores',
    
    // Métricas de Redes Sociais
    SOCIAL_METRICS: '/v1/metricas-redes-sociais',
    SOCIAL_STATS: '/v1/metricas-redes-sociais/estatisticas',
    
    // Relatórios Diários
    DAILY_REPORTS: '/v1/relatorios-diarios',
    DAILY_STATS: '/v1/relatorios-diarios/estatisticas',
    DAILY_DASHBOARD: '/v1/relatorios-diarios/dashboard/consolidado',
    
    // Casas Parceiras
    PARTNER_HOUSES: '/v1/casas-parceiras',
    
    // Credenciais
    CREDENTIALS: '/v1/credenciais-acesso',
    PLATFORMS: '/v1/credenciais-acesso/plataformas/disponiveis',
    
    // Documentos
    DOCUMENTS: '/v1/documentos',
    
    // Criativos
    CREATIVES: '/v1/criativos',
    CREATIVES_KANBAN: '/v1/criativos/kanban',
    CREATIVES_STATS: '/v1/criativos/stats',
    
    // Team Members
    TEAM_MEMBERS: '/team-members',
    
    // Leads e Funil de Vendas
    LEADS: '/v1/leads',
    KANBAN_COLUMNS: '/v1/kanban-columns',
    
    // Clientes
    CLIENTES: '/v1/clientes',
    
    // Propostas
    PROPOSTAS: '/v1/propostas',
    
    // Notificações
    NOTIFICACOES: '/v1/notificacoes',
    NOTIFICACOES_COUNT: '/v1/notificacoes/count',
  }
};

// Função helper para construir URLs completas da API
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Função helper para URLs da API base (sem /api)
export const buildBaseUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Funções helper específicas para endpoints comuns
export const getProjectUrl = (projectId: string, endpoint?: string): string => {
  const base = `${API_CONFIG.ENDPOINTS.PROJECTS_V1}/${projectId}`;
  return buildApiUrl(endpoint ? `${base}${endpoint}` : base);
};

export const getProjectActivityUrl = (projectId: string): string => {
  return buildApiUrl(`${API_CONFIG.ENDPOINTS.ACTIVITIES}/projeto/${projectId}`);
};

export const getProjectReportsUrl = (projectId: string, params?: string): string => {
  const base = `${API_CONFIG.ENDPOINTS.DAILY_REPORTS}/projeto/${projectId}`;
  return buildApiUrl(params ? `${base}?${params}` : base);
};

export const getProjectSocialMetricsUrl = (projectId: string, params?: string): string => {
  const base = `${API_CONFIG.ENDPOINTS.SOCIAL_METRICS}/projeto/${projectId}`;
  return buildApiUrl(params ? `${base}?${params}` : base);
};

export const getProjectPartnerHousesUrl = (projectId: string): string => {
  return buildApiUrl(`${API_CONFIG.ENDPOINTS.PARTNER_HOUSES}/projeto/${projectId}`);
};

export const getCreativesUrl = (params?: string): string => {
  const base = API_CONFIG.ENDPOINTS.CREATIVES;
  return buildApiUrl(params ? `${base}?${params}` : base);
};

export const getCreativesKanbanUrl = (projectId?: string): string => {
  const base = API_CONFIG.ENDPOINTS.CREATIVES_KANBAN;
  return buildApiUrl(projectId ? `${base}?projeto_id=${projectId}` : base);
};

export const getCreativesStatsUrl = (projectId?: string): string => {
  const base = API_CONFIG.ENDPOINTS.CREATIVES_STATS;
  return buildApiUrl(projectId ? `${base}?projeto_id=${projectId}` : base);
}; 