'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HomeIcon, TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    title: 'Overview',
    href: '/portal',
    icon: HomeIcon,
  },
  {
    title: 'Tickets',
    href: '/portal/tickets',
    icon: TicketIcon,
  },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className='min-h-[calc(100vh-3.5rem)] w-full p-4'>
      <div className='space-y-1'>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'w-full justify-start gap-2',
                isActive && 'bg-muted'
              )}
            >
              <Icon className='h-4 w-4' />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
