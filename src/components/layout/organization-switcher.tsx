'use client';

import { useInternalAuth } from '@/lib/auth/internal/hooks';
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

export function OrganizationSwitcher() {
  const { organization, organizations, switchOrganization } = useInternalAuth();

  if (!organization || organizations.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='flex items-center gap-2'>
          <div className='flex max-w-[140px] items-center gap-2'>
            <div className='flex h-5 w-5 items-center justify-center rounded-md bg-primary/10'>
              <p className='text-xs font-medium text-primary'>
                {organization.name[0].toUpperCase()}
              </p>
            </div>
            <p className='truncate text-sm'>{organization.name}</p>
          </div>
          <Icons.chevronDown className='h-4 w-4 text-muted-foreground' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchOrganization(org.id)}
              className='flex items-center gap-2'
            >
              <div className='flex h-5 w-5 items-center justify-center rounded-md bg-primary/10'>
                <p className='text-xs font-medium text-primary'>
                  {org.name[0].toUpperCase()}
                </p>
              </div>
              <span className='flex-1 truncate'>{org.name}</span>
              {org.id === organization.id && (
                <Icons.check className='h-4 w-4 text-primary' />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* TODO: Make this do something */}
        <DropdownMenuItem>
          <Icons.plus className='mr-2 h-4 w-4' />
          Create Organization
        </DropdownMenuItem>
        {/* TODO: Make this do something */}
        <DropdownMenuItem>
          <Icons.settings className='mr-2 h-4 w-4' />
          Organization Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
