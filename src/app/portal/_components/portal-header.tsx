import { UserNav } from '@/components/layout/user-nav';
import { OrganizationBranding } from '@/components/organization/branding';
import { getAuthUser } from '@/lib/auth/common/supabase';
import { type Tables } from '@/lib/database.types';

interface PortalHeaderProps {
  user: Tables<'portal_users'>;
  contact: Tables<'contacts'>;
}

export async function PortalHeader({ user }: PortalHeaderProps) {
  const authUser = await getAuthUser();
  return (
    <header className='flex h-14 items-center justify-between border-b px-4'>
      <div className='flex items-center gap-4'>
        <OrganizationBranding orgId={user.org_id} />
      </div>
      <div className='flex items-center gap-4'>
        <UserNav user={authUser} />
      </div>
    </header>
  );
}
