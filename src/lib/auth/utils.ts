import { type Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

export type User = Database['public']['Tables']['users']['Row'];

export async function getUser() {
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
}
