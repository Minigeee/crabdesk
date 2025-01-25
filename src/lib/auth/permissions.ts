import type { Tables } from '@/lib/database.types';

type InternalUser = Tables<'internal_users'>;

// Define the preferences type
interface UserPreferences {
  role?: string;
  last_org_id?: string;
  [key: string]: any;
}

export type Permission =
  | 'manage:users'
  | 'manage:teams'
  | 'manage:tickets'
  | 'manage:contacts'
  | 'manage:settings'
  | 'view:analytics';

// Role-based permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'manage:users',
    'manage:teams',
    'manage:tickets',
    'manage:contacts',
    'manage:settings',
    'view:analytics',
  ],
  agent: ['manage:tickets', 'manage:contacts', 'view:analytics'],
  viewer: ['view:analytics'],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: InternalUser | null,
  permission: Permission
): boolean {
  if (!user) return false;

  // Admins have all permissions
  if (user.is_admin) return true;

  // Get role from user preferences or default to viewer
  const preferences = user.preferences as UserPreferences;
  const role = preferences?.role || 'viewer';
  const allowedPermissions = ROLE_PERMISSIONS[role] || [];

  return allowedPermissions.includes(permission);
}

/**
 * Check if a user has access to an organization
 */
export function hasOrganizationAccess(
  user: InternalUser | null,
  organizationId: string
): boolean {
  if (!user) return false;
  return user.org_id === organizationId;
}

/**
 * Check if a user has access to a team
 */
export async function hasTeamAccess(
  user: InternalUser | null,
  teamId: string,
  supabase: any // Replace with proper Supabase client type
): Promise<boolean> {
  if (!user) return false;

  // Admins have access to all teams
  if (user.is_admin) return true;

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
  user: InternalUser | null,
  resourceUserId: string
): boolean {
  if (!user) return false;
  return user.id === resourceUserId;
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: InternalUser | null): Permission[] {
  if (!user) return [];

  if (user.is_admin) {
    return Object.values(ROLE_PERMISSIONS).flat();
  }

  const preferences = user.preferences as UserPreferences;
  const role = preferences?.role || 'viewer';
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if user has any of the given permissions
 */
export function hasAnyPermission(
  user: InternalUser | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;

  return permissions.some((permission) => hasPermission(user, permission));
}

/**
 * Check if user has all of the given permissions
 */
export function hasAllPermissions(
  user: InternalUser | null,
  permissions: Permission[]
): boolean {
  if (!user) return false;

  return permissions.every((permission) => hasPermission(user, permission));
}
