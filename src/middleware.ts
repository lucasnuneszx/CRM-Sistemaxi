import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não precisam de autenticação
const publicPaths = ['/login', '/login/registro', '/login/recuperar'];
// Padrões de arquivos estáticos que devem ser sempre acessíveis
const staticFiles = ['/images/', '/_next/', '/favicon.ico', '/logo.svg', '/sistemaxi_principal.webp'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Permitir acesso a arquivos estáticos
  if (staticFiles.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Verificar se é uma rota pública
  if (publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  
  // Para simplificar, vamos deixar o AuthContext gerenciar a autenticação
  // O middleware apenas vai proteger rotas muito sensíveis
  // O AuthContext vai redirecionar automaticamente se não estiver autenticado

  
  return NextResponse.next();
}

// Definir em quais caminhos o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /api (API routes)
     * 3. /static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. all root files inside public (e.g. /favicon.ico)
           */
      '/((?!_next|api|static|_vercel|.*\\..*|$).*)',
    ],
}; 