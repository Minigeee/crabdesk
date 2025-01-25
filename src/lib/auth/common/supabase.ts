import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

export interface AuthUser extends Omit<User, 'user_metadata'> {
  user_metadata: {
    name: string;
  };
  app_metadata: {
    org_id?: string;
    org_roles?: Record<string, string>;
  };
}

/**
 * Get the current authenticated user from Supabase Auth
 * This is the safe way to get user data as it validates the token with Supabase Auth server
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Error getting auth user:', error?.message);
    return null;
  }

  return {
    ...user,
    user_metadata: {
      name: user.user_metadata.name as string,
    },
    app_metadata: {
      org_id: user.app_metadata.org_id as string | undefined,
    },
  } as AuthUser;
});

/**
 * Sign out the current user and clear their session
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearAuthCookies();
}

/**
 * Clear auth cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.set('sb-access-token', '', { maxAge: 0 });
  cookieStore.set('sb-refresh-token', '', { maxAge: 0 });
}
