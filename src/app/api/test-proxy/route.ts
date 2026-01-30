import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://78.142.242.97:3001';
    
    console.log('[TEST-PROXY] Testing connection to backend...');
    console.log('[TEST-PROXY] Backend URL:', BACKEND_URL);
    
    // Testar conexão básica
    const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test123'
      }),
    });
    
    console.log('[TEST-PROXY] Response status:', response.status);
    const responseText = await response.text();
    console.log('[TEST-PROXY] Response body:', responseText);
    
    return NextResponse.json({
      status: 'proxy test',
      backend_url: BACKEND_URL,
      response_status: response.status,
      response_body: responseText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
  } catch (error) {
    console.error('[TEST-PROXY] Error:', error);
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 