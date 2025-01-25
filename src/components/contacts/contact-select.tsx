import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SearchBar } from '@/components/ui/search-bar';
import { useContacts } from '@/lib/contacts/use-contacts';
import { PenIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface ContactSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function ContactSelect({ value, onChange }: ContactSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [autofocus, setAutofocus] = useState(false);
  const { data: contacts = [] } = useContacts(search);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === value),
    [contacts, value]
  );

  const initials = useMemo(() => {
    return selectedContact?.name
      ?.split(/\s+/)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }, [selectedContact]);

  return (
    <div className='space-y-2'>
      {!selectedContact && (
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
              placeholder='Search contacts...'
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
            {contacts.length === 0 ? (
              <p className='p-2 text-sm text-muted-foreground'>
                No contacts found.
              </p>
            ) : (
              <div className='space-y-1'>
                {contacts.map((contact) => (
                  <Button
                    key={contact.id}
                    variant='ghost'
                    className='h-fit w-full justify-start text-left'
                    onClick={() => {
                      onChange(contact.id);
                      setOpen(false);
                    }}
                  >
                    <div className='flex flex-col'>
                      <h3 className='text-sm font-medium'>{contact.name}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {contact.email}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {selectedContact && (
        <div className='flex items-center gap-3 rounded-md border p-3'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className='flex flex-1 flex-col'>
            <h3 className='text-sm font-medium'>{selectedContact.name}</h3>
            <p className='text-sm text-muted-foreground'>
              {selectedContact.email}
            </p>
          </div>

          <Button
            variant='ghost'
            size='icon'
            onClick={() => {
              onChange('');
              setAutofocus(true);
            }}
          >
            <PenIcon className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
