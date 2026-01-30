'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Shadcn Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const { login, loading, user, token } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Se já está autenticado, redirecionar para dashboard
  useEffect(() => {
    if (user && token && !loading) {
      console.log('✅ Usuário já autenticado, redirecionando...');
      router.push('/dashboard');
    }
  }, [user, token, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    // Timeout de segurança para evitar travamento
    const timeoutId = setTimeout(() => {
      setIsSubmitting(false);
      setError('Tempo de espera excedido. Verifique sua conexão e tente novamente.');
    }, 30000); // 30 segundos
    
    try {
      const result = await login(email, password);
      clearTimeout(timeoutId);
      
      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
      } else {
        // Se success for true, o AuthContext já vai redirecionar o usuário
        // Mas vamos resetar o estado após um pequeno delay para garantir
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-full flex justify-center mb-6">
            <Image 
              src="/sistemaxi_principal.webp" 
              alt="Sistemaxi Logo" 
              width={180} 
              height={60} 
              className="mb-2"
            />
          </div>
          <CardTitle className="text-2xl font-bold">Entrar no Sistema</CardTitle>
          <CardDescription>Entre com seu email e senha para acessar</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nome@empresa.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {/* TODO: Implementar página de recuperação de senha */}
                  <span className="text-sm text-muted-foreground">
                    Esqueceu a senha?
                  </span>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Entrando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 border-t pt-4">
          <div className="text-sm text-center text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/login/registro" className="text-primary hover:underline">
              Criar conta
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 