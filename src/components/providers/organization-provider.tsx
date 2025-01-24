'use client';

import { useAuth } from '@/components/providers/auth-provider';
import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import assert from 'assert';
import { createContext, useContext, useEffect, useState } from 'react';

type Organization = Tables<'organizations'>;
type InternalUser = Tables<'internal_users'>;

interface OrganizationContextType {
  organization: Organization | null;
  organizations: Organization[];
  internalUser: InternalUser | null;
  isLoading: boolean;
  switchOrganization: (orgId: string) => Promise<void>;
  error: Error | null;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  organizations: [],
  internalUser: null,
  isLoading: true,
  switchOrganization: async () => {},
  error: null,
});

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      'useOrganization must be used within an OrganizationProvider'
    );
  }
  return context;
};

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [internalUser, setInternalUser] = useState<InternalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function loadOrganizationData() {
      assert(user, 'User is required');

      try {
        // First get the internal user
        const { data: userData, error: userError } = await supabase
          .from('internal_users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (userError) throw userError;
        if (!userData) throw new Error('User not found');

        setInternalUser(userData);

        // Then get their organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.org_id)
          .single();
          
        if (orgsError) throw orgsError;
        if (orgsData) {
          setOrganizations([orgsData]);
          setOrganization(orgsData);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err
            : new Error('Failed to load organization data')
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadOrganizationData();
  }, [user]);

  const switchOrganization = async (orgId: string) => {
    try {
      const targetOrg = organizations.find((org) => org.id === orgId);
      if (!targetOrg) {
        throw new Error('Organization not found');
      }

      // Update the current organization
      setOrganization(targetOrg);

      // Here you could also update any user preferences or last accessed org
      if (internalUser) {
        await supabase
          .from('internal_users')
          .update({
            preferences: {
              ...(internalUser.preferences as Record<string, unknown>),
              last_org_id: orgId,
            },
          })
          .eq('id', internalUser.id);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to switch organization')
      );
      throw err;
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizations,
        internalUser,
        isLoading,
        switchOrganization,
        error,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}
