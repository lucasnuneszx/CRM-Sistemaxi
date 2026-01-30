'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
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
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

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

export default function EditarAtividadePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const router = useRouter();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Configuração do formulário
  const form = useForm<z.infer<typeof atividadeSchema>>({
    resolver: zodResolver(atividadeSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      status: "",
      prazo: "",
      dataInicio: "",
      dataFim: "",
      prioridade: "",
      projetoId: "",
      responsavelId: "",
      setorId: "",
    },
  });

  // Buscar dados para os selects e a atividade atual
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar a atividade
        const atividadeResponse = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD)}/${resolvedParams.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!atividadeResponse.ok) {
          throw new Error('Falha ao carregar atividade');
        }

        const atividadeData = await atividadeResponse.json();
        
        // Formatar as datas para o formato de input date
        const formatDateForInput = (dateString?: string) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        // Preencher o formulário com os dados da atividade
        form.reset({
          nome: atividadeData.nome,
          descricao: atividadeData.descricao || "",
          status: atividadeData.status,
          prazo: formatDateForInput(atividadeData.prazo),
          dataInicio: formatDateForInput(atividadeData.dataInicio),
          dataFim: formatDateForInput(atividadeData.dataFim),
          prioridade: atividadeData.prioridade,
          projetoId: atividadeData.projetoId,
          responsavelId: atividadeData.responsavelId || "",
          setorId: atividadeData.setorId || "",
        });

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
          setUsuarios(usuariosData);
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
  }, [token, resolvedParams.id, form]);

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

      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD)}/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar atividade');
      }

      // Redirecionar para a lista de atividades após sucesso
      router.push('/atividades');
    } catch (err) {
      console.error('Erro ao atualizar atividade:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar atividade');
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
            router.push('/atividades');
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
        <h1 className="text-3xl font-bold">Editar Atividade</h1>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormField
                    control={form.control}
                    name="projetoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projeto</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
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
                    name="dataFim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Conclusão</FormLabel>
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
                </div>
                
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
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setLoadingCancel(true);
                      router.push('/atividades');
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
                    Salvar Alterações
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