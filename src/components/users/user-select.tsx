import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SearchBar } from '@/components/ui/search-bar';
import { useInternalUsers } from '@/lib/users/use-internal-users';
import { XIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface UserSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function UserSelect({ value, onChange }: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [autofocus, setAutofocus] = useState(false);
  const { data: users = [] } = useInternalUsers(search);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === value),
    [users, value]
  );

  const initials = useMemo(() => {
    return selectedUser?.name
      ?.split(/\s+/)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }, [selectedUser]);

  return (
    <div className='space-y-2'>
      {!selectedUser && (
        <Popover open={open} onOpenChange={setOpen}>
          <div className='relative'>
            <SearchBar
              value={search}
              onChange={setSearch}
              onFocus={() => {
                setOpen(true);
                if (autofocus) {
                  setAutofocus(false);
                }
              }}
              placeholder='Search users...'
              autoFocus={autofocus}
            />
            <PopoverTrigger className='absolute -bottom-1 left-0 w-full' />
          </div>
          <PopoverContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            onFocusOutside={(e) => e.preventDefault()}
            align='start'
            className='pointer-events-auto max-h-[300px] overflow-y-auto p-2'
          >
            {users.length === 0 ? (
              <p className='p-2 text-sm text-muted-foreground'>
                No users found.
              </p>
            ) : (
              <div className='space-y-1'>
                {users.map((user) => (
                  <Button
                    key={user.id}
                    variant='ghost'
                    className='h-fit w-full justify-start text-left'
                    onClick={() => {
                      onChange(user.id);
                      setOpen(false);
                    }}
                  >
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-8 w-8'>
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className='h-full w-full object-cover'
                          />
                        ) : (
                          <AvatarFallback>
                            {user.name
                              .split(/\s+/)
                              .map((word) => word[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className='flex flex-col'>
                        <h3 className='text-sm font-medium'>{user.name}</h3>
                        {user.is_admin && (
                          <p className='text-xs text-muted-foreground'>Admin</p>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {selectedUser && (
        <div className='flex items-center gap-3 rounded-md border p-3'>
          <Avatar className='h-10 w-10'>
            {selectedUser.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedUser.avatar_url}
                alt={selectedUser.name}
                className='h-full w-full object-cover'
              />
            ) : (
              <AvatarFallback>{initials}</AvatarFallback>
            )}
          </Avatar>

          <div className='flex flex-1 flex-col'>
            <h3 className='text-sm font-medium'>{selectedUser.name}</h3>
            {selectedUser.is_admin && (
              <p className='text-sm text-muted-foreground'>Admin</p>
            )}
          </div>

          <Button
            variant='ghost'
            size='icon'
            onClick={() => {
              onChange('');
              setAutofocus(true);
            }}
          >
            <XIcon className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
} 