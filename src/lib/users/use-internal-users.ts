import { Tables } from '@/lib/database.types';
import { createClient } from '@/lib/supabase/client';
import { useQuery } from '@tanstack/react-query';
import assert from 'assert';
import { useInternalAuth } from '../auth/internal/hooks';

export type InternalUser = Tables<'internal_users'>;

export function useInternalUsers(search: string) {
  const { organization } = useInternalAuth();

  return useQuery({
    queryKey: ['internal_users', search],
    queryFn: async () => {
      assert(organization, 'Organization is required');
      const supabase = createClient();
      const { data } = await supabase
        .from('internal_users')
        .select('*')
        .eq('org_id', organization.id)
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(10);
      return (data as InternalUser[]) || [];
    },
    enabled: !!organization,
  });
}
