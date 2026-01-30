'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { buildApiUrl, buildBaseUrl, API_CONFIG } from '@/config/api';

interface Projeto {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
}

interface Setor {
  id: string;
  nome: string;
}

// Schema para validação do formulário
const atividadeSchema = z.object({
  nome: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres",
  }),
  descricao: z.string().optional(),
  status: z.string(),
  prazo: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  prioridade: z.string(),
  projetoId: z.string({
    required_error: "Selecione um projeto",
  }),
  responsavelId: z.string().optional(),
  setorId: z.string().optional(),
});

// Componente que usa useSearchParams
function NovaAtividadeContent() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId'); // Captura projectId da URL
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Configuração do formulário
  const form = useForm<z.infer<typeof atividadeSchema>>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      status: "Não iniciada",
      prazo: "",
      dataInicio: "",
      dataFim: "",
      prioridade: "Média",
      projetoId: projectId || "", // Pré-seleciona projeto se veio da URL
      responsavelId: "",
      setorId: "",
    },
  });

  // Buscar dados para os selects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar projetos
        const projetosResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (projetosResponse.ok) {
          const projetosData = await projetosResponse.json();
          setProjetos(projetosData);
        }

        // Buscar usuários
        const usuariosResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (usuariosResponse.ok) {
          const usuariosData = await usuariosResponse.json();
          console.log('Debug - Usuários carregados:', usuariosData.length);
          setUsuarios(usuariosData);
        } else {
          console.error('Erro ao buscar usuários:', usuariosResponse.status);
        }

        // Buscar setores
        const setoresResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS), {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (setoresResponse.ok) {
          const setoresData = await setoresResponse.json();
          setSetores(setoresData);
        }
      } catch (err) {
        console.error('Erro:', err);
        setError('Falha ao carregar dados. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Envio do formulário
  const onSubmit = async (values: z.infer<typeof atividadeSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Remover campos vazios
      Object.keys(values).forEach(key => {
        if (values[key as keyof typeof values] === "") {
          delete values[key as keyof typeof values];
        }
      });

      // Validar campos obrigatórios
      if (!values.projetoId) {
        throw new Error('Projeto é obrigatório');
      }

      // Transformar dados para o formato esperado pelo FastAPI (snake_case)
      const transformedData: Record<string, string | undefined> = {
        nome: values.nome,
        status: values.status,
        prioridade: values.prioridade,
        projeto_id: values.projetoId, // Campo obrigatório
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (values.descricao && values.descricao.trim()) {
        transformedData.descricao = values.descricao.trim();
      }

      if (values.prazo) {
        transformedData.prazo = new Date(values.prazo + 'T23:59:59').toISOString();
      }

      if (values.dataInicio) {
        transformedData.data_inicio = new Date(values.dataInicio + 'T00:00:00').toISOString();
      }

      if (values.dataFim) {
        transformedData.data_fim = new Date(values.dataFim + 'T23:59:59').toISOString();
      }

      if (values.responsavelId && values.responsavelId !== "none") {
        transformedData.responsavel_id = values.responsavelId;
      }

      if (values.setorId && values.setorId !== "none") {
        transformedData.setor_id = values.setorId;
      }

      console.log('Debug - Enviando dados:', transformedData);

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Debug - Erro da API:', errorData);
        
        // Melhor tratamento de erro
        let errorMessage = 'Erro ao criar atividade';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Erro de validação do Pydantic
            errorMessage = errorData.detail.map((err: {loc?: string[], msg: string}) => 
              `${err.loc?.join(' → ')}: ${err.msg}`
            ).join('\n');
          } else if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
        
        throw new Error(errorMessage);
      }

      // Redirecionar conforme origem após sucesso
      const successUrl = projectId ? `/projects/${projectId}` : '/atividades';
      router.push(successUrl);
    } catch (err) {
      console.error('Erro ao criar atividade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar atividade');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => {
            setLoadingCancel(true);
            // Se veio de um projeto específico, volta para ele, senão vai para lista geral
            const backUrl = projectId ? `/projects/${projectId}` : '/atividades';
            router.push(backUrl);
          }}
          disabled={loadingCancel}
        >
          {loadingCancel ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ArrowLeft className="h-4 w-4 mr-2" />
          )}
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">
          Nova Atividade
          {projectId && (
            <span className="text-lg text-muted-foreground ml-2">
              • Para Projeto Específico
            </span>
          )}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Atividade</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Carregando dados...</p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Atividade</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da atividade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Só mostra dropdown de projeto se NÃO veio de um projeto específico */}
                  {!projectId && (
                    <FormField
                      control={form.control}
                      name="projetoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Projeto</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um projeto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {projetos.map(projeto => (
                                <SelectItem key={projeto.id} value={projeto.id}>
                                  {projeto.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Se veio de um projeto específico, mostra info do projeto */}
                  {projectId && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        Projeto selecionado:
                      </h3>
                      <p className="font-medium">
                        {projetos.find(p => p.id === projectId)?.name || 'Carregando...'}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Esta atividade será criada para este projeto
                      </p>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição detalhada da atividade"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Não iniciada">Não iniciada</SelectItem>
                            <SelectItem value="Em andamento">Em andamento</SelectItem>
                            <SelectItem value="Concluída">Concluída</SelectItem>
                            <SelectItem value="Atrasada">Atrasada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prioridade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a prioridade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prazo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="dataInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="responsavelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsável</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem responsável</SelectItem>
                            {usuarios.map(usuario => (
                              <SelectItem key={usuario.id} value={usuario.id}>
                                {usuario.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="setorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um setor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sem setor</SelectItem>
                            {setores.map(setor => (
                              <SelectItem key={setor.id} value={setor.id}>
                                {setor.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setLoadingCancel(true);
                      const backUrl = projectId ? `/projects/${projectId}` : '/atividades';
                      router.push(backUrl);
                    }}
                    disabled={loadingCancel || isSubmitting}
                  >
                    {loadingCancel ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Atividade
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente de loading para o Suspense
function LoadingFallback() {
  return (
    <div className="p-6">
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando...</p>
      </div>
    </div>
  );
}

// Componente principal que envolve com Suspense
export default function NovaAtividadePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NovaAtividadeContent />
    </Suspense>
  );
} 