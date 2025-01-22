import { type Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export type User = Database['public']['Tables']['users']['Row'];

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
});
