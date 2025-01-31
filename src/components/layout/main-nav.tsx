'use client';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { BarChart2, Beaker, Inbox, Settings, Users } from 'lucide-react';
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
    <div className='flex flex-col space-y-4'>
      {/* Navigation */}
      <nav className='space-y-1'>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Fragment key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-secondary/80 hover:text-secondary-foreground',
                  'active:scale-[0.98]',
                  active
                    ? 'bg-secondary text-secondary-foreground'
                    : 'text-muted-foreground',
                  // Ocean wave animation on hover
                  'relative overflow-hidden'
                )}
              >
                {/* Background wave effect */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 transition-opacity group-hover:opacity-10',
                    "bg-[url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 6c6 0 6 4 12 4s6-4 12-4v16H0V6z' fill='%23000' fill-opacity='.1'/%3E%3C/svg%3E\")]",
                    'animate-wave bg-[length:24px_24px] bg-repeat-x'
                  )}
                />

                {Icon && (
                  <Icon
                    className={cn(
                      'mr-2 h-4 w-4 transition-transform group-hover:scale-110',
                      active
                        ? 'text-secondary-foreground'
                        : 'text-muted-foreground'
                    )}
                  />
                )}
                <span className='relative'>{item.title}</span>
              </Link>
              {/* Add separator before Testing section */}
              {index === 3 && (
                <Separator className='my-2 bg-border opacity-50' />
              )}
            </Fragment>
          );
        })}
      </nav>
    </div>
  );
}
