'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

// Shadcn Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validar senhas
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await register({
        name,
        email,
        password,
        role: 'user' // Definindo role padrão
      });
      
      if (!result.success) {
        setError(result.message);
      }
      // Se success for true, o AuthContext já vai redirecionar o usuário
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar');
    } finally {
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
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>Preencha os dados para se registrar</CardDescription>
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
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Seu nome completo" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
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
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Registrando...' : 'Criar Conta'}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4 border-t pt-4">
          <div className="text-sm text-center text-muted-foreground">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 