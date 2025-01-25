import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Tables } from '@/lib/database.types';

export type UserData = {
  user: Tables<'users'>;
  organization: Tables<'organizations'>;
};

/**
 * Get the current authenticated user and their organization
 */
export async function getCurrentUser(): Promise<UserData | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  // Get org_id from user_metadata
  const orgId = authUser.user_metadata.org_id;
  if (!orgId) {
    return null;
  }

  // Get user and organization data
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', authUser.id)
    .eq('org_id', orgId)
    .single();

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (!user || !organization) {
    return null;
  }

  return { user, organization };
}

/**
 * Require user to be authenticated
 * Redirects to login if not authenticated
 */
export async function requireUser(): Promise<UserData> {
  const userData = await getCurrentUser();
  if (!userData) {
    redirect('/auth/login');
  }
  return userData;
}

/**
 * Require user to have access to an organization
 * Redirects to login if not authenticated or no access
 */
export async function requireOrganizationAccess(
  orgId: string
): Promise<UserData> {
  const userData = await requireUser();
  if (userData.organization.id !== orgId) {
    redirect('/auth/login');
  }
  return userData;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

/**
 * Switch to a different organization
 */
export async function switchOrganization(orgId: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  // Update user metadata
  await supabase.auth.updateUser({
    data: { org_id: orgId }
  });

  // Clear cookies to force new session
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');

  // Redirect to force reload
  redirect('/');
} 