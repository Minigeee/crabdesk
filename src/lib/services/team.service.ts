import { type Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';

export class TeamService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase?: SupabaseClient<Database>) {
    if (supabase) {
      this.supabase = supabase;
    } else {
      throw new Error('Supabase client must be provided');
    }
  }

  static async create(): Promise<TeamService> {
    const supabase = await createClient();
    return new TeamService(supabase);
  }

  async list(organizationId?: string) {
    let query = this.supabase.from('teams').select('id, name, description');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
