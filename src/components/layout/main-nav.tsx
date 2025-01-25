'use client';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  BarChart2,
  ChevronDown,
  ChevronRight,
  Inbox,
  Settings,
  Users,
  Beaker,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: NavItem[];
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
    items: [
      { title: 'All Tickets', href: '/dashboard/tickets' },
      { title: 'My Tickets', href: '/dashboard/tickets/my' },
      { title: 'Unassigned', href: '/dashboard/tickets/unassigned' },
    ],
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
  const [openSections, setOpenSections] = useState<string[]>(['Tickets']);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (pathname?.startsWith(href + '/') && href !== '/dashboard')
    );
  };

  return (
    <nav className='space-y-1'>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const isOpen = openSections.includes(item.title);

        if (item.items) {
          return (
            <Collapsible
              key={item.title}
              open={isOpen}
              onOpenChange={() => toggleSection(item.title)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn('w-full justify-between', active && 'bg-muted')}
                >
                  <span className='flex items-center'>
                    {Icon && <Icon className='mr-2 h-4 w-4' />}
                    {item.title}
                  </span>
                  {isOpen ? (
                    <ChevronDown className='h-4 w-4' />
                  ) : (
                    <ChevronRight className='h-4 w-4' />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className='ml-4 space-y-1 pt-1'>
                {item.items.map((subItem) => (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted',
                      isActive(subItem.href) && 'bg-muted'
                    )}
                  >
                    {subItem.title}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-muted',
              active && 'bg-muted'
            )}
          >
            {Icon && <Icon className='mr-2 h-4 w-4' />}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
