import { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import assert from 'assert';
import { useAuth } from '@/lib/auth/hooks';

export type User = Tables<'users'>;

export function useOrganizationUsers(search: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      assert(organization, 'Organization is required');
      const supabase = createClient();
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('org_id', organization.id)
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(10);
      return (data as User[]) || [];
    },
    enabled: !!organization,
  });
}
