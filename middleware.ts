import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const roles = new Set([
  'clinical:optometrist',
  'clinical:assistant',
  'frontdesk:receptionist',
  'inventory:manager',
  'laboratory:technician',
  'admin',
]);

function isApi(pathname: string): boolean {
  return pathname.startsWith('/api/');
}

export async function middleware(request: NextRequest) {
  const authMode = process.env.AUTH_MODE ?? (process.env.NODE_ENV === 'production' ? 'supabase' : 'demo');
  if (authMode === 'demo' || authMode === 'proxy') return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  const publicPath = pathname === '/login' || pathname === '/api/health' || pathname.startsWith('/_next/');
  if (publicPath) return NextResponse.next();

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    if (isApi(pathname)) return NextResponse.json({ error: 'Autenticación no configurada' }, { status: 503 });
    return NextResponse.redirect(new URL('/login?error=auth-config', request.url));
  }

  const requestHeaders = new Headers(request.headers);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    if (isApi(pathname)) return NextResponse.json({ error: 'Autenticación requerida' }, { status: 401 });
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(pathname)}`, request.url));
  }

  const role = user.app_metadata?.role;
  if (typeof role !== 'string' || !roles.has(role)) {
    if (isApi(pathname)) return NextResponse.json({ error: 'Rol de usuario no configurado' }, { status: 403 });
    return NextResponse.redirect(new URL('/login?error=role', request.url));
  }

  requestHeaders.set('x-auth-user-id', user.id);
  requestHeaders.set('x-auth-role', role);
  const refreshedCookies = response.cookies.getAll();
  const refreshedHeaders = Array.from(response.headers.entries());
  response = NextResponse.next({ request: { headers: requestHeaders } });
  refreshedCookies.forEach(({ name, value, ...options }) => response.cookies.set(name, value, options));
  refreshedHeaders.forEach(([name, value]) => response.headers.set(name, value));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
