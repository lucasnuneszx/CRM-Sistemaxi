export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'project_manager' | 'creative_user' | 'user';
  createdAt: string;
  is_active: boolean;
  setorId?: string;
  setor?: {
    id: string;
    nome: string;
  };
  foto_perfil?: string;
  telefone?: string;
  bio?: string;
}

export interface Setor {
  id: string;
  nome: string;
}

export interface UserCreateData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'project_manager' | 'creative_user' | 'user';
  setorId?: string;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'project_manager' | 'creative_user' | 'user';
  setorId?: string;
  foto_perfil?: string;
  telefone?: string;
  bio?: string;
}

