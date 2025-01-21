import { type Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';

export class UserService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    if (supabase) {
      this.supabase = supabase;
    } else {
      throw new Error('Supabase client must be provided');
    }
  }

  static async create(): Promise<UserService> {
    const supabase = await createClient();
    return new UserService(supabase);
  }

  async listAgents(organizationId?: string) {
    let query = this.supabase
      .from('users')
      .select('id, full_name, email, role')
      .in('role', ['agent', 'admin']);

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async listCustomers(organizationId?: string) {
    let query = this.supabase
      .from('users')
      .select('id, full_name, email')
      .eq('role', 'customer');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
