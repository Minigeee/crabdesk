import type { Tables } from '@/lib/database.types';
import { Database } from '@/lib/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

export type AuditLog = Tables<'audit_logs'> & {
  actor?: Pick<Tables<'internal_users'>, 'id' | 'name' | 'avatar_url'> | null;
};

export class AuditService {
  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly orgId: string
  ) {}

  async getEntityAuditLogs(
    entityType: string,
    entityId: string
  ): Promise<AuditLog[]> {
    const { data, error } = await this.supabase
      .from('audit_logs')
      .select(
        `
        *,
        actor:actor_id (
          id,
          name,
          avatar_url
        )
      `
      )
      .eq('org_id', this.orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async subscribeToEntityAuditLogs(
    entityType: string,
    entityId: string,
    callback: (log: AuditLog) => void
  ) {
    return this.supabase
      .channel(`audit:${entityType}:${entityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `entity_type=eq.${entityType} AND entity_id=eq.${entityId}`,
        },
        (payload) => {
          callback(payload.new as AuditLog);
        }
      )
      .subscribe();
  }
}
