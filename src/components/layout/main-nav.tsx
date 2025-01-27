'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  BarChart2,
  Inbox,
  Settings,
  Users,
  Beaker,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart2,
  },
  {
    title: 'Tickets',
    href: '/dashboard/tickets',
    icon: Inbox,
  },
  {
    title: 'Contacts',
    href: '/dashboard/contacts',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    title: 'Testing',
    href: '/dashboard/testing',
    icon: Beaker,
  },
];

export function MainNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (pathname?.startsWith(href + '/') && href !== '/dashboard')
    );
  };

  return (
    <nav className='space-y-1'>
      {navItems.map((item, index) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Fragment key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted',
                active && 'bg-muted'
              )}
            >
              {Icon && <Icon className='mr-2 h-4 w-4' />}
              {item.title}
            </Link>
            {/* Add separator before Testing section */}
            {index === 3 && <Separator className='my-2' />}
          </Fragment>
        );
      })}
    </nav>
  );
}
