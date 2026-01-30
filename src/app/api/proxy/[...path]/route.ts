import { NextRequest, NextResponse } from 'next/server';

// Configuração do backend
const BACKEND_URL = process.env.BACKEND_URL || 'http://78.142.242.97:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path, 'PATCH');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Responder às requisições OPTIONS para CORS
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Reconstruir o caminho
    const path = pathSegments.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    console.log(`[PROXY] ${method} ${targetUrl}`);

    // Preparar headers
    const headers = new Headers();
    
    // Copiar headers importantes da requisição original
    const importantHeaders = ['authorization', 'content-type', 'accept', 'user-agent'];
    importantHeaders.forEach(headerName => {
      const value = request.headers.get(headerName);
      if (value) {
        headers.set(headerName, value);
        console.log(`[PROXY] Header ${headerName}:`, value);
      }
    });

    // Garantir content-type para POST/PUT/PATCH se não existir
    if (['POST', 'PUT', 'PATCH'].includes(method) && !headers.get('content-type')) {
      headers.set('content-type', 'application/json');
      console.log(`[PROXY] Added default content-type: application/json`);
    }

    // Preparar body se necessário
    let body = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await request.text();
        console.log(`[PROXY] Body:`, body);
      } catch (error) {
        console.error(`[PROXY] Error reading body:`, error);
      }
    }

    // Fazer a requisição para o backend
    const response = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    console.log(`[PROXY] Response status:`, response.status, response.statusText);

    // Ler a resposta
    const responseData = await response.text();
    
    if (response.status >= 400) {
      console.error(`[PROXY] Error response:`, responseData);
    } else {
      console.log(`[PROXY] Success response:`, responseData.substring(0, 200) + '...');
    }
    
    // Criar resposta com headers CORS
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
    });

    // Adicionar headers CORS
    nextResponse.headers.set('Access-Control-Allow-Origin', '*');
    nextResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    nextResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Copiar headers importantes da resposta
    const responseHeaders = ['content-type', 'cache-control', 'etag'];
    responseHeaders.forEach(headerName => {
      const value = response.headers.get(headerName);
      if (value) {
        nextResponse.headers.set(headerName, value);
      }
    });

    return nextResponse;

  } catch (error) {
    console.error('[PROXY] Error:', error);
    
    return new NextResponse(
      JSON.stringify({ 
        error: 'Proxy error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
} 