import type { Tables } from '@/lib/database.types';

export interface BaseUser {
  id: string;
  auth_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  isLoading: boolean;
  error: Error | null;
}

export interface AuthContext<U extends BaseUser> {
  user: U | null;
  isLoading: boolean;
  error: Error | null;
}

export interface InternalAuthContext
  extends AuthContext<Tables<'internal_users'>> {
  organization: Tables<'organizations'> | null;
  organizations: Tables<'organizations'>[];
  switchOrganization: (orgId: string) => Promise<void>;
}

export interface PortalAuthContext extends AuthContext<Tables<'portal_users'>> {
  contact: Tables<'contacts'> | null;
}
