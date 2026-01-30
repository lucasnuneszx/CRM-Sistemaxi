'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, X, FileText, DollarSign, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { buildApiUrl, buildBaseUrl, API_CONFIG } from '@/config/api';

// Schema de validação
const propostaSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  status: z.enum(['em_aberto', 'pausado', 'cancelado', 'fechado', 'ganho']),
  progresso: z.coerce.number().min(0).max(100),
  valor: z.string().refine((val) => {
    const num = parseFloat(val.replace(/[^\d,.-]/g, '').replace(',', '.'));
    return !isNaN(num) && num >= 0;
  }, 'Valor inválido'),
  clienteId: z.string().optional(),
  responsavelId: z.string().optional(),
  observacoes: z.string().optional(),
});

type PropostaFormData = z.infer<typeof propostaSchema>;

export default function NovaPropostaPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropostaFormData>({
    resolver: zodResolver(propostaSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      status: 'em_aberto',
      progresso: 0,
      valor: '0',
      clienteId: '',
      responsavelId: '',
      observacoes: '',
    },
  });

  // Carregar clientes e usuários
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientesResponse, usersResponse] = await Promise.all([
          fetch(buildApiUrl(API_CONFIG.ENDPOINTS.CLIENTES), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
          fetch(buildBaseUrl(API_CONFIG.ENDPOINTS.USERS_FOR_ASSIGNMENT), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }),
        ]);

        if (clientesResponse.ok) {
          const clientesData = await clientesResponse.json();
          setClientes(clientesData.map((c: any) => ({
            id: c.id,
            nome: c.nome,
          })));
        }

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.map((u: any) => ({
            id: u.id,
            name: u.name,
          })));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Submeter formulário
  const onSubmit = async (data: PropostaFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Converter valor para número
      const valorNum = parseFloat(data.valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

      // Preparar dados para API
      const propostaData = {
        titulo: data.titulo,
        descricao: data.descricao || null,
        status: data.status,
        progresso: data.progresso,
        valor: valorNum,
        observacoes: data.observacoes || null,
        data_criacao: new Date().toISOString(),
        cliente_id: data.clienteId || null,
        responsavel_id: data.responsavelId || null,
        prioridade: 0,
        ordem: 0,
      };

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROPOSTAS), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propostaData),
      });

      if (response.ok) {
        const createdProposta = await response.json();
        router.push('/propostas');
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        setError(errorData.detail || 'Erro ao criar proposta');
      }
    } catch (error) {
      console.error('Erro ao criar proposta:', error);
      setError('Erro ao criar proposta. Verifique sua conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const status = watch('status');
  const progresso = watch('progresso');

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Proposta</h1>
          <p className="text-muted-foreground">
            Preencha os dados para criar uma nova proposta
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCancel} variant="outline">
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" form="proposta-form" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : (
        <form id="proposta-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dados Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dados Principais
              </CardTitle>
              <CardDescription>Informações básicas da proposta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  {...register('titulo')}
                  placeholder="Ex: Implantação de E-commerce Completo"
                />
                {errors.titulo && (
                  <p className="text-sm text-destructive">{errors.titulo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  {...register('descricao')}
                  placeholder="Descreva os detalhes da proposta..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="em_aberto">Em Aberto</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                      <SelectItem value="ganho">Ganho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progresso">Progresso: {progresso}%</Label>
                  <Input
                    id="progresso"
                    type="number"
                    min="0"
                    max="100"
                    {...register('progresso', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor e Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Valor e Cliente
              </CardTitle>
              <CardDescription>Informações financeiras e relacionamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$) *</Label>
                <Input
                  id="valor"
                  {...register('valor')}
                  placeholder="0,00"
                  type="text"
                />
                {errors.valor && (
                  <p className="text-sm text-destructive">{errors.valor.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clienteId">Cliente</Label>
                  <Select
                    value={watch('clienteId') || undefined}
                    onValueChange={(value) => setValue('clienteId', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavelId">Responsável</Label>
                  <Select
                    value={watch('responsavelId') || undefined}
                    onValueChange={(value) => setValue('responsavelId', value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observações
              </CardTitle>
              <CardDescription>Informações adicionais sobre a proposta</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  {...register('observacoes')}
                  placeholder="Adicione observações relevantes..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel} variant="outline" type="button">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar Proposta'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

