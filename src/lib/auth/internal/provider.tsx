'use client';

import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { createContext, useEffect, useState } from 'react';
import type { InternalAuthContext as InternalAuthContextType } from '../common/types';

type InternalUser = Tables<'internal_users'>;
type Organization = Tables<'organizations'>;

export const InternalAuthContext = createContext<InternalAuthContextType>({
  user: null,
  organization: null,
  organizations: [],
  isLoading: true,
  error: null,
  switchOrganization: async () => {},
});

export function InternalAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<InternalUser | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setOrganization(null);
        setOrganizations([]);
        setIsLoading(false);
        return;
      }

      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get internal user data
        const { data: userData, error: userError } = await supabase
          .from('internal_users')
          .select('*')
          .eq('auth_user_id', session.user.id)
          .single();

        if (userError) throw userError;
        if (!userData) throw new Error('Internal user not found');

        setUser(userData);

        // Get organization data
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.org_id)
          .single();

        if (orgError) throw orgError;
        if (!orgData) throw new Error('Organization not found');

        setOrganization(orgData);
        setOrganizations([orgData]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load user data'));
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const switchOrganization = async (orgId: string) => {
    try {
      const targetOrg = organizations.find((org) => org.id === orgId);
      if (!targetOrg) {
        throw new Error('Organization not found');
      }

      // Update the current organization
      setOrganization(targetOrg);

      // Update user preferences
      if (user) {
        await supabase
          .from('internal_users')
          .update({
            preferences: {
              ...(user.preferences as Record<string, unknown>),
              last_org_id: orgId,
            },
          })
          .eq('id', user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to switch organization'));
      throw err;
    }
  };

  return (
    <InternalAuthContext.Provider
      value={{
        user,
        organization,
        organizations,
        isLoading,
        error,
        switchOrganization,
      }}
    >
      {children}
    </InternalAuthContext.Provider>
  );
} 