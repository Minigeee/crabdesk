import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

type InternalUser = Tables<'internal_users'>;

/**
 * Get the current session and user data
 * Use this in server components and API routes
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }

  return session;
}

/**
 * Get the current authenticated user with internal user data
 * Use this in server components and API routes
 */
export async function getCurrentUser(): Promise<{
  user: InternalUser;
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
} | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = await createClient();

  // Get internal user data
  const { data: internalUser, error } = await supabase
    .from('internal_users')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .single();

  if (error || !internalUser) {
    console.error('Error getting internal user:', error?.message);
    return null;
  }

  return {
    user: internalUser,
    session,
  };
}

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
 * Get session data with organization context
 * Use this when you need both session and org data
 */
export async function getSessionWithOrganization() {
  const userData = await getCurrentUser();
  if (!userData) return null;

  const { user, session } = userData;
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
    session,
    organization,
  };
}
