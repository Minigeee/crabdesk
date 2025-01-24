'use client';

import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { OrganizationSwitcher } from '@/components/layout/organization-switcher';
import { UserNav } from '@/components/layout/user-nav';

export function Header() {
  return (
    <header className='flex h-14 items-center justify-between border-b px-4'>
      <div className='flex items-center gap-4'>
        <Breadcrumbs />
      </div>
      <div className='flex items-center gap-4'>
        <OrganizationSwitcher />
        <UserNav />
      </div>
    </header>
  );
}
