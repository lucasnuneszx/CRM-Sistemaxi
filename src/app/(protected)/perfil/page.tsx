'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Save, Camera, User, Mail, Phone, FileText, Loader2, 
  Lock, BarChart3, FolderKanban, Target, Zap, Building2,
  CheckCircle2, Clock, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { buildApiUrl, API_CONFIG } from '@/config/api';
import { User as UserType } from '@/types/user';

// Schema de validação do perfil
const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  bio: z.string().max(500, 'Biografia deve ter no máximo 500 caracteres').optional(),
});

// Schema de validação de senha
const passwordSchema = z.object({
  old_password: z.string().min(1, 'Senha atual é obrigatória'),
  new_password: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
  confirm_password: z.string().min(6, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserStats {
  projects: number;
  activities: number;
  activities_completed: number;
  activities_in_progress: number;
  leads: number;
  criativos: number;
}

export default function PerfilPage() {
  const { user, token, updateUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      telefone: (user as any)?.telefone || '',
      bio: (user as any)?.bio || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Carregar estatísticas do usuário
  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return;
      
      try {
        // Construir URL corretamente: /v1/users + /me/stats = /v1/users/me/stats
        const endpoint = `${API_CONFIG.ENDPOINTS.USERS}/me/stats`;
        const url = buildApiUrl(endpoint);
        console.log('🔍 Buscando estatísticas do usuário:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Estatísticas carregadas:', data);
          setStats(data);
        } else {
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          console.error('❌ Erro ao carregar estatísticas:', response.status, response.statusText, errorText);
          // Se o endpoint não existir (404) ou outro erro, definir stats como vazio
          setStats({
            projects: 0,
            activities: 0,
            activities_completed: 0,
            activities_in_progress: 0,
            leads: 0,
            criativos: 0,
          });
        }
      } catch (error) {
        console.error('❌ Erro de rede ao carregar estatísticas:', error);
        // Em caso de erro de rede, definir stats como vazio para não quebrar a UI
        setStats({
          projects: 0,
          activities: 0,
          activities_completed: 0,
          activities_in_progress: 0,
          leads: 0,
          criativos: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [token]);

  // Atualizar formulário quando o usuário mudar
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        telefone: (user as any).telefone || '',
        bio: (user as any).bio || '',
      });
      const fotoPerfil = (user as any).foto_perfil;
      if (fotoPerfil && fotoPerfil.trim() !== '') {
        // Se já é uma URL completa (presigned URL do MinIO), usar diretamente
        if (fotoPerfil.startsWith('http://') || fotoPerfil.startsWith('https://')) {
          setPreviewImage(fotoPerfil);
        } else {
          // Se não for URL completa, limpar preview para mostrar iniciais
          setPreviewImage(null);
        }
      } else {
        setPreviewImage(null);
      }
    }
  }, [user, reset]);

  // Buscar dados atualizados do usuário ao montar o componente
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;

      try {
        const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/me`), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          mode: 'cors',
          credentials: 'omit',
        });

        if (response.ok) {
          const userData = await response.json();
          // Atualizar contexto com dados atualizados (incluindo presigned URL da foto)
          updateUser({
            ...userData,
            id: String(userData.id),
          });
          
          // Atualizar preview da imagem se houver
          if (userData.foto_perfil && userData.foto_perfil.trim() !== '') {
            if (userData.foto_perfil.startsWith('http://') || userData.foto_perfil.startsWith('https://')) {
              setPreviewImage(userData.foto_perfil);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };

    fetchUserData();
  }, [token, updateUser]);

  // Função para obter iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Upload de foto
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('A imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/me/upload-photo`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro ao fazer upload' }));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      // Atualizar contexto com todos os dados do usuário
      updateUser({
        ...updatedUser,
        id: String(updatedUser.id),
      });
      // Atualizar preview da imagem
      if (updatedUser.foto_perfil) {
        if (updatedUser.foto_perfil.startsWith('http')) {
          setPreviewImage(updatedUser.foto_perfil);
        } else {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          setPreviewImage(`${apiUrl}${updatedUser.foto_perfil}`);
        }
      }
      setSuccessMessage('Foto de perfil atualizada com sucesso!');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setErrorMessage(error?.message || 'Erro ao fazer upload da foto');
    } finally {
      setIsUploading(false);
    }
  };

  // Atualizar perfil
  const onSubmit = async (data: ProfileFormData) => {
    if (!token) {
      setErrorMessage('Token não disponível');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/me`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          telefone: data.telefone || null,
          bio: data.bio || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro ao atualizar perfil' }));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      const updatedUser = await response.json();
      // Atualizar contexto com todos os dados do usuário
      updateUser({
        ...updatedUser,
        id: String(updatedUser.id),
      });
      setSuccessMessage('Perfil atualizado com sucesso!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      setErrorMessage(error?.message || 'Erro ao atualizar perfil');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alterar senha
  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!token) {
      setErrorMessage('Token não disponível');
      return;
    }

    setIsChangingPassword(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/me/change-password`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_password: data.old_password,
          new_password: data.new_password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro ao alterar senha' }));
        throw new Error(errorData.detail || `Erro ${response.status}: ${response.statusText}`);
      }

      resetPassword();
      setSuccessMessage('Senha alterada com sucesso!');

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setErrorMessage(error?.message || 'Erro ao alterar senha');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais, estatísticas e configurações
        </p>
      </div>

      {/* Mensagens de sucesso/erro */}
      {successMessage && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        {/* Aba de Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card de Foto */}
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
                <CardDescription>Atualize sua foto de perfil</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage 
                      src={previewImage || undefined} 
                      alt={user?.name || 'Usuário'} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-2xl">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <div className="relative w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="photo-upload"
                    disabled={isUploading}
                  />
                  <Button
                    variant="outline"
                    className="w-full cursor-pointer"
                    disabled={isUploading}
                    asChild
                  >
                    <label htmlFor="photo-upload" className="cursor-pointer w-full text-center">
                      <Camera className="h-4 w-4 mr-2 inline" />
                      {isUploading ? 'Enviando...' : 'Alterar Foto'}
                    </label>
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Formatos: JPG, PNG, GIF<br />
                  Tamanho máximo: 5MB
                </p>
              </CardContent>
            </Card>

            {/* Formulário de Informações */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Atualize suas informações de perfil</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Nome */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <User className="h-4 w-4 inline mr-2" />
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Seu nome completo"
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-2" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="seu@email.com"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label htmlFor="telefone">
                      <Phone className="h-4 w-4 inline mr-2" />
                      Telefone
                    </Label>
                    <Input
                      id="telefone"
                      type="tel"
                      {...register('telefone')}
                      placeholder="(00) 00000-0000"
                    />
                    {errors.telefone && (
                      <p className="text-sm text-red-500">{errors.telefone.message}</p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">
                      <FileText className="h-4 w-4 inline mr-2" />
                      Biografia
                    </Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      placeholder="Conte um pouco sobre você..."
                      rows={4}
                    />
                    {errors.bio && (
                      <p className="text-sm text-red-500">{errors.bio.message}</p>
                    )}
                  </div>

                  {/* Setor */}
                  {user?.setor && (
                    <div className="space-y-2">
                      <Label>
                        <Building2 className="h-4 w-4 inline mr-2" />
                        Setor
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{user.setor.nome}</Badge>
                      </div>
                    </div>
                  )}

                  {/* Botão de Salvar */}
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba de Estatísticas */}
        <TabsContent value="estatisticas" className="space-y-6">
          {loadingStats ? (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projetos</CardTitle>
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.projects || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Projetos que você possui
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Atividades</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activities || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.activities_completed || 0} concluídas • {stats?.activities_in_progress || 0} em andamento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leads</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.leads || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Leads criados por você
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Criativos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.criativos || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Criativos criados por você
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.activities 
                      ? Math.round((stats.activities_completed / stats.activities) * 100) 
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Atividades concluídas
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Aba de Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Altere sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-6">
                {/* Senha Atual */}
                <div className="space-y-2">
                  <Label htmlFor="old_password">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="old_password"
                      type={showOldPassword ? 'text' : 'password'}
                      {...registerPassword('old_password')}
                      placeholder="Digite sua senha atual"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.old_password && (
                    <p className="text-sm text-red-500">{passwordErrors.old_password.message}</p>
                  )}
                </div>

                {/* Nova Senha */}
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showNewPassword ? 'text' : 'password'}
                      {...registerPassword('new_password')}
                      placeholder="Digite sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.new_password && (
                    <p className="text-sm text-red-500">{passwordErrors.new_password.message}</p>
                  )}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...registerPassword('confirm_password')}
                      placeholder="Confirme sua nova senha"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {passwordErrors.confirm_password && (
                    <p className="text-sm text-red-500">{passwordErrors.confirm_password.message}</p>
                  )}
                </div>

                {/* Botão de Salvar */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={isChangingPassword}>
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
