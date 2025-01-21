'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  BookOpen,
  Building2,
  LayoutDashboard,
  Menu,
  Settings,
  Ticket,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Button } from './ui/button';

const navItems = [
  {
    title: 'Dashboard',
    href: '/app/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Tickets',
    href: '/app/tickets',
    icon: Ticket,
  },
  {
    title: 'Teams',
    href: '/app/teams',
    icon: Users,
  },
  {
    title: 'Organizations',
    href: '/app/organizations',
    icon: Building2,
  },
  {
    title: 'Knowledge Base',
    href: '/app/kb',
    icon: BookOpen,
  },
  {
    title: 'Analytics',
    href: '/app/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/app/settings',
    icon: Settings,
  },
];

export function AppNav() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav
      className={cn(
        'flex flex-col border-r bg-muted/10',
        isCollapsed ? 'w-[4rem]' : 'w-[240px]',
      )}
    >
      {/* Logo & Toggle */}
      <div className='flex h-14 items-center border-b px-4'>
        {!isCollapsed && (
          <Link href='/app' className='flex items-center gap-3'>
            <Ticket className='h-6 w-6' />
            <span className='font-semibold text-lg'>CrabDesk</span>
          </Link>
        )}
        <Button
          variant='ghost'
          size='icon'
          className={cn('h-8 w-8', isCollapsed ? 'mx-auto' : 'ml-auto')}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className='h-4 w-4' />
        </Button>
      </div>

      {/* Nav Links */}
      <div className='flex-1 space-y-1 p-2'>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
                isCollapsed && 'justify-center',
              )}
            >
              <Icon className='h-4 w-4' />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
