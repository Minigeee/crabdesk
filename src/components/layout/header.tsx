import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { OrganizationSwitcher } from '@/components/layout/organization-switcher';
import { UserNav } from '@/components/layout/user-nav';
import { getAuthUser } from '@/lib/auth/common/supabase';

export async function Header() {
  const user = await getAuthUser();
  return (
    <header className='flex h-14 items-center justify-between border-b px-4'>
      <Breadcrumbs />
      <div className='flex items-center gap-4'>
        <OrganizationSwitcher />
        <UserNav user={user} />
      </div>
    </header>
  );
}
