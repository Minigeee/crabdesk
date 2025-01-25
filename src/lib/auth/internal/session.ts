import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthUser } from '../common/supabase';

type InternalUser = Tables<'internal_users'>;
type Organization = Tables<'organizations'>;

/**
 * Get the current authenticated internal user
 * Use this in server components and API routes
 */
export const getCurrentInternalUser = cache(
  async (): Promise<{
    user: InternalUser;
    organization: Organization;
  } | null> => {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const supabase = await createClient();

    // Get internal user data
    const { data: internalUser, error: userError } = await supabase
      .from('internal_users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !internalUser) {
      console.error('Error getting internal user:', userError?.message);
      return null;
    }

    // Get organization data
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', internalUser.org_id)
      .single();

    if (orgError || !organization) {
      console.error('Error getting organization:', orgError?.message);
      return null;
    }

    return {
      user: internalUser,
      organization,
    };
  }
);

/**
 * Require internal user authentication for a route
 * Use this in server components and API routes
 */
export async function requireInternalUser() {
  const userData = await getCurrentInternalUser();

  if (!userData) {
    redirect('/login');
  }

  return userData;
}

/**
 * Require organization access for a route
 * Use this in server components and API routes
 */
export async function requireOrganizationAccess(organizationId: string) {
  const userData = await getCurrentInternalUser();

  if (!userData) {
    redirect('/login');
  }

  const { user } = userData;

  if (user.org_id !== organizationId && !user.is_admin) {
    redirect('/unauthorized');
  }

  return userData;
}
