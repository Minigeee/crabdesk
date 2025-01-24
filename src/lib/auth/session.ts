import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

type InternalUser = Tables<'internal_users'>;

/**
 * Get the current authenticated user
 * Use this in server components and API routes
 * This is the safe way to get user data as it validates the token with Supabase Auth server
 */
export const getCurrentUser = cache(
  async (): Promise<{
    user: InternalUser;
    authUser: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>['user'];
  } | null> => {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const supabase = await createClient();

    // Get internal user data
    const { data: internalUser, error } = await supabase
      .from('internal_users')
      .select('*')
      .eq('auth_user_id', authUser.user.id)
      .single();

    if (error || !internalUser) {
      console.error('Error getting internal user:', error?.message);
      return null;
    }

    return {
      user: internalUser,
      authUser: authUser.user,
    };
  }
);

/**
 * Get the current authenticated user from Supabase Auth
 * This is the safe way to get user data as it validates the token with Supabase Auth server
 */
const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('Error getting auth user:', error?.message);
    return null;
  }

  return { user };
});

/**
 * Require organization access for a route
 * Use this in server components and API routes
 */
export async function requireOrganizationAccess(organizationId: string) {
  const userData = await getCurrentUser();

  if (!userData) {
    redirect('/login');
  }

  const { user } = userData;

  if (user.org_id !== organizationId && !user.is_admin) {
    redirect('/unauthorized');
  }

  return user;
}

/**
 * Clear the current session
 * Use this for logging out
 */
export async function clearSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Clear any session cookies
  const cookieStore = await cookies();
  cookieStore.set('sb-access-token', '', { maxAge: 0 });
  cookieStore.set('sb-refresh-token', '', { maxAge: 0 });
}

/**
 * Get user data with organization context
 * Use this when you need both user and org data
 * This is the safe way to get user data as it validates the token with Supabase Auth server
 */
export const getUserWithOrganization = cache(async () => {
  const userData = await getCurrentUser();
  if (!userData) return null;

  const { user, authUser } = userData;
  const supabase = await createClient();

  // Get organization data
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', user.org_id)
    .single();

  if (error || !organization) {
    console.error('Error getting organization:', error?.message);
    return null;
  }

  return {
    user,
    authUser,
    organization,
  };
});
