'use client';

import { CreateTicketDialog } from '@/components/tickets/create-ticket-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useContact } from '@/lib/contacts/use-contacts';
import { createClient } from '@/lib/supabase/client';
import { Mail, MessageSquarePlus, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ContactActions({ contactId }: { contactId: string }) {
  const router = useRouter();
  const { data: contact } = useContact(contactId);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      toast({
        title: 'Contact deleted',
        description: 'The contact has been deleted successfully.',
      });
      router.push('/dashboard/contacts');
    } catch (error) {
      console.error('Error deleting contact', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contact. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!contact) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2'>
        <CreateTicketDialog
          trigger={
            <Button variant='secondary' className='w-full justify-start'>
              <MessageSquarePlus className='mr-2 h-4 w-4' />
              Create Ticket
            </Button>
          }
          initialContactId={contactId}
        />

        <Button
          variant='secondary'
          className='w-full justify-start'
          onClick={() =>
            router.push(`/dashboard/email/compose?to=${contact.email}`)
          }
        >
          <Mail className='mr-2 h-4 w-4' />
          Send Email
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='destructive' className='w-full justify-start'>
              <Trash className='mr-2 h-4 w-4' />
              Delete Contact
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                contact and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete Contact
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
