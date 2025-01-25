'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useMemo } from 'react';

const pathToLabel: Record<string, string> = {
  dashboard: 'Dashboard',
  tickets: 'Tickets',
  contacts: 'Contacts',
  settings: 'Settings',
  my: 'My Tickets',
  unassigned: 'Unassigned',
  new: 'New',
};

function getBreadcrumbs(pathname: string) {
  const paths = pathname.split('/').filter(Boolean);
  return paths.map((path, index) => ({
    label: pathToLabel[path] || path,
    href: '/' + paths.slice(0, index + 1).join('/'),
  }));
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const breadcrumbs = useMemo(() => getBreadcrumbs(pathname), [pathname]);
  const isSubRoute = breadcrumbs.length > 2; // More than /dashboard/section

  return (
    <div className='flex items-center gap-4'>
      {isSubRoute && (
        <Button variant='ghost' size='icon' className='h-8 w-8' asChild>
          <Link href={breadcrumbs[breadcrumbs.length - 2].href}>
            <ArrowLeft className='h-4 w-4' />
            <span className='sr-only'>Go back</span>
          </Link>
        </Button>
      )}

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/dashboard' className='flex items-center'>
              <Home className='h-4 w-4' />
              <span className='sr-only'>Dashboard</span>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbs.slice(1).map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index < breadcrumbs.length - 2 ? (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}
