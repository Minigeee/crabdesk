'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/ui/icons';
import { createClient } from '@/lib/supabase/client';
import { AuthUser } from '@supabase/supabase-js';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export function UserNav({ user }: { user: AuthUser | null }) {
  const client = createClient();

  const router = useRouter();
  const { setTheme, theme } = useTheme();

  const metadata = user?.user_metadata;
  const initials = useMemo(
    () =>
      metadata?.name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() ||
      user?.email?.[0].toUpperCase() ||
      '?',
    [metadata?.name, user?.email]
  );

  if (!user || !metadata) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage
              src={metadata.avatar_url}
              alt={metadata.name || user.email}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            {metadata.name && (
              <p className='text-sm font-medium leading-none'>
                {metadata.name}
              </p>
            )}
            <p className='text-xs leading-none text-muted-foreground'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* TODO: Make these do something */}
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Icons.user className='mr-2 h-4 w-4' />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Icons.settings className='mr-2 h-4 w-4' />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Icons.bell className='mr-2 h-4 w-4' />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Icons.sun className='mr-2 h-4 w-4' />
            ) : (
              <Icons.moon className='mr-2 h-4 w-4' />
            )}
            Toggle Theme
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            client.auth.signOut().then(() => {
              router.push('/');
            });
          }}
        >
          <Icons.logout className='mr-2 h-4 w-4' />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
