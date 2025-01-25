import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to /login if not authenticated
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/dashboard') ||
      (request.nextUrl.pathname.startsWith('/portal') &&
        request.nextUrl.pathname !== '/portal/verify'))
  ) {
    const redirectUrl = new URL('/login', request.url);
    // Add the current path as the next parameter
    redirectUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Auth routes - redirect to /dashboard if already authenticated
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register')
  ) {
    // If there's a next parameter, redirect there, otherwise go to dashboard or portal
    const orgId = user.app_metadata.org_id;
    const orgRole = orgId
      ? user.app_metadata.org_roles[orgId]
      : Object.values(user.app_metadata.org_roles)[0];

    if (orgRole) {
      const next =
        request.nextUrl.searchParams.get('next') ||
        (orgRole === 'portal_user' ? '/portal' : '/dashboard');
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
