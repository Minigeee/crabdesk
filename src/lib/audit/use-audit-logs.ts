import { useAuth } from '@/lib/auth/hooks';
import { createClient } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import assert from 'assert';
import { useEffect, useMemo } from 'react';
import { AuditLog, AuditService } from './audit-service';

// Query keys
export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (entityType: string, entityId: string) =>
    [...auditKeys.lists(), { entityType, entityId }] as const,
};

export function useAuditLogs(entityType: string, entityId: string) {
  const { organization } = useAuth();
  const queryClient = useQueryClient();

  // Create memoized service instance
  const auditService = useMemo(() => {
    const supabase = createClient();
    if (!organization) return null;
    return new AuditService(supabase, organization.id);
  }, [organization]);

  // Setup real-time subscription
  useEffect(() => {
    if (!auditService) return;

    const subscription = auditService.subscribeToEntityAuditLogs(
      entityType,
      entityId,
      (log) => {
        // Add new log to existing data
        queryClient.setQueryData(
          auditKeys.list(entityType, entityId),
          (oldData: AuditLog[] | undefined) => [log, ...(oldData || [])]
        );
      }
    );

    return () => {
      subscription.then((sub) => sub.unsubscribe());
    };
  }, [entityType, entityId, auditService, queryClient]);

  return useQuery({
    queryKey: auditKeys.list(entityType, entityId),
    queryFn: async () => {
      assert(auditService, 'Audit service is not initialized');
      return auditService.getEntityAuditLogs(entityType, entityId);
    },
    enabled: !!auditService,
  });
}
