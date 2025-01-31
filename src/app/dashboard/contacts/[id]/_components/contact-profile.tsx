'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useContact, useContactMutations } from '@/lib/contacts/use-contacts';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Save, X } from 'lucide-react';
import { useState } from 'react';

export function ContactProfile({ contactId }: { contactId: string }) {
  const { data: contact } = useContact(contactId);
  const { updateContact } = useContactMutations();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(contact?.name || '');

  if (!contact) return null;

  const handleSave = async () => {
    await updateContact.mutateAsync({
      id: contactId,
      updates: { name: editedName },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(contact.name || '');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle>Contact Profile</CardTitle>
        {!isEditing ? (
          <Button variant='ghost' size='sm' onClick={() => setIsEditing(true)}>
            <Pencil className='h-4 w-4' />
          </Button>
        ) : (
          <div className='flex gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleSave}
              disabled={updateContact.isPending}
            >
              <Save className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleCancel}
              disabled={updateContact.isPending}
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Editable fields */}
          <div className='space-y-2'>
            <Label>Name</Label>
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder='Contact name'
              />
            ) : (
              <div className='rounded-md border px-3 py-2'>
                {contact.name || contact.email}
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label>Email</Label>
            <div className='rounded-md border px-3 py-2'>{contact.email}</div>
          </div>

          {/* Read-only timestamps */}
          <div className='grid grid-cols-2 gap-4 pt-2'>
            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                First Seen
              </div>
              <div className='text-sm'>
                {formatDistanceToNow(new Date(contact.first_seen_at), {
                  addSuffix: true,
                })}
              </div>
            </div>

            <div>
              <div className='text-sm font-medium text-muted-foreground'>
                Last Seen
              </div>
              <div className='text-sm'>
                {formatDistanceToNow(new Date(contact.last_seen_at), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
