import type { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type UserData = {
  user: Tables<'users'>;
  organization: Tables<'organizations'>;
  organizations: Tables<'organizations'>[];
};

/**
 * Hook to access the current authenticated user
 */
export function useAuth() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data, isLoading, error } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<UserData | null> => {
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

      // Get all organizations user has access to
      const { data: organizations = [] } = await supabase
        .from('users')
        .select('organizations(*)')
        .eq('auth_user_id', authUser.id);

      if (!user || !organization) {
        return null;
      }

      return {
        user,
        organization,
        organizations: organizations?.map((row) => row.organizations) ?? [],
      };
    },
  });

  // Switch organization mutation
  const switchOrganization = useMutation({
    mutationFn: async (orgId: string) => {
      await supabase.auth.updateUser({
        data: { org_id: orgId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });

  // Sign out mutation
  const signOut = useMutation({
    mutationFn: async () => {
      await supabase.auth.signOut();
    },
  });

  return {
    user: data?.user ?? null,
    organization: data?.organization ?? null,
    organizations: data?.organizations ?? [],
    isLoading,
    error,
    switchOrganization: switchOrganization.mutate,
    signOut: signOut.mutate,
  };
}
