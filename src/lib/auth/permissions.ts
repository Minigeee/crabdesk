import type { Tables } from '@/lib/database.types';

type User = Tables<'users'>;

export type Permission =
  | 'manage:users'
  | 'manage:teams'
  | 'manage:tickets'
  | 'manage:contacts'
  | 'manage:settings'
  | 'manage:email'
  | 'view:analytics';

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'manage:users',
    'manage:teams',
    'manage:tickets',
    'manage:contacts',
    'manage:settings',
    'manage:email',
    'view:analytics',
  ],
  agent: [
    'manage:tickets',
    'manage:contacts',
    'manage:email',
    'view:analytics',
  ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: User | null,
  permission: Permission
): boolean {
  if (!user) return false;

  // Admins have all permissions
  if (user.is_admin) return true;

  // Get permissions based on role
  const allowedPermissions = ROLE_PERMISSIONS[user.role] || [];

  return allowedPermissions.includes(permission);
}

/**
 * Check if a user has access to an organization
 */
export function hasOrganizationAccess(
  user: User | null,
  organizationId: string
): boolean {
  if (!user) return false;
  return user.org_id === organizationId;
}

/**
 * Check if a user has access to a team
 */
export async function hasTeamAccess(
  user: User | null,
  teamId: string,
  supabase: any // Replace with proper Supabase client type
): Promise<boolean> {
  if (!user) return false;

  // Admins have access to all teams in their org
  if (user.is_admin) {
    const { data: team } = await supabase
      .from('teams')
      .select('org_id')
      .eq('id', teamId)
      .single();

    return team?.org_id === user.org_id;
  }

  // Check team membership
  const { data } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('team_id', teamId)
    .single();

  return !!data;
}

/**
 * Check if a user owns a resource
 */
export function isResourceOwner(
  user: User | null,
  resourceUserId: string
): boolean {
  if (!user) return false;
  return user.id === resourceUserId;
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: User | null): Permission[] {
  if (!user) return [];

  if (user.is_admin) {
    return Object.values(ROLE_PERMISSIONS).flat();
  }

  return ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Check if user has any of the given permissions
 */
export function hasAnyPermission(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(
  user: User | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;
  return permissions.every((permission) => hasPermission(user, permission));
}
