'use client';

import { useState, useEffect } from 'react';
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

interface Setor {
  id: string;
  nome: string;
}

// Schema para validação do formulário
const userSchema = z.object({
  name: z.string().min(3, {
    message: "O nome deve ter pelo menos 3 caracteres",
  }),
  email: z.string().email({
    message: "E-mail inválido",
  }),
  role: z.string(),
  setorId: z.string().optional(),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres",
  }),
});

export default function NewUserPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [setores, setSetores] = useState<Setor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuração do formulário
  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      setorId: "none",
      password: "",
    },
  });

  // Buscar setores
  useEffect(() => {
    if (!token) return;

    const fetchSetores = async () => {
      try {
        const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS)}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSetores(data);
        }
      } catch (err) {
        console.error('Erro ao buscar setores:', err);
      }
    };

    fetchSetores();
  }, [token]);

  // Envio do formulário
  const onSubmit = async (values: z.infer<typeof userSchema>) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Remover setorId se for "none"
      if (values.setorId === "none") {
        delete values.setorId;
      }

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar usuário');
      }

      // Redirecionar para a lista de usuários após sucesso
      router.push('/users');
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" onClick={() => router.push('/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Adicionar Novo Usuário</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input placeholder="Senha" type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="project_manager">Gerente de Projeto</SelectItem>
                        <SelectItem value="creative_user">Usuário Criativo</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
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
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/users')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Usuário
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 