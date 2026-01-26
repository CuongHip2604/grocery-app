import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, await params);
}

async function proxyRequest(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join('/');
  const url = new URL(request.url);
  const targetUrl = `${API_URL}/api/${path}${url.search}`;

  const headers: HeadersInit = {};
  request.headers.forEach((value, key) => {
    // Skip host header and other headers that shouldn't be forwarded
    if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
      headers[key] = value;
    }
  });

  try {
    const body = request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { message: 'Proxy error', error: String(error) },
      { status: 502 }
    );
  }
}
