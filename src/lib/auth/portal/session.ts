import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getAuthUser } from '../common/supabase';

type PortalUser = Tables<'portal_users'>;
type Contact = Tables<'contacts'>;

/**
 * Get the current authenticated portal user
 * Use this in server components and API routes
 */
export const getCurrentPortalUser = cache(
  async (): Promise<{
    user: PortalUser;
    contact: Contact;
  } | null> => {
    const authUser = await getAuthUser();
    if (!authUser) return null;

    const supabase = await createClient();

    // Get portal user data
    const { data: portalUser, error: userError } = await supabase
      .from('portal_users')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .single();

    if (userError || !portalUser) {
      console.error('Error getting portal user:', userError?.message);
      return null;
    }

    // Get contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('portal_user_id', portalUser.id)
      .single();

    if (contactError || !contact) {
      console.error('Error getting contact:', contactError?.message);
      return null;
    }

    return {
      user: portalUser,
      contact,
    };
  }
);

/**
 * Require portal user authentication for a route
 * Use this in server components and API routes
 */
export async function requirePortalUser() {
  const userData = await getCurrentPortalUser();

  if (!userData) {
    redirect('/login');
  }

  return userData;
}

/**
 * Require portal access for a route
 * Use this in server components and API routes
 */
export async function requirePortalAccess(organizationId: string) {
  const userData = await getCurrentPortalUser();

  if (!userData) {
    redirect('/login');
  }

  const { user } = userData;

  if (user.org_id !== organizationId) {
    redirect('/unauthorized');
  }

  return userData;
} 