import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { NotesList } from '@/components/notes/notes-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCurrentUser } from '@/lib/auth/session';
import { ContactService } from '@/lib/contacts/contact-service';
import { createClient } from '@/lib/supabase/server';
import { ContactActions } from './_components/contact-actions';
import { ContactDetailsSkeleton } from './_components/contact-details-skeleton';
import { ContactProfile } from './_components/contact-profile';
import { TicketHistory } from './_components/ticket-history';

export default async function ContactDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: contactId } = await params;

  const userData = await getCurrentUser();
  if (!userData) {
    notFound();
  }

  const supabase = await createClient();
  const contactService = new ContactService(supabase, userData.organization.id);

  // Get contact details
  const contact = await contactService.getContactById(contactId);
  if (!contact) {
    notFound();
  }

  return (
    <div className='flex h-full'>
      {/* Sidebar */}
      <ScrollArea className='w-[300px] overflow-y-auto border-r xl:w-[400px]'>
        <div className='space-y-6 p-4'>
          <ContactProfile contactId={contactId} />
          <TicketHistory contactId={contactId} />
          <ContactActions contactId={contactId} />
        </div>
      </ScrollArea>

      {/* Main content */}
      <div className='flex min-w-0 flex-1 flex-col'>
        <div className='border-b bg-background p-4'>
          <div className='flex items-center'>
            <h1 className='text-xl font-semibold'>
              {contact.name || contact.email}
            </h1>
          </div>
          <div className='text-sm text-muted-foreground'>
            {contact.name && contact.email}
          </div>
        </div>

        <div className='flex-1 p-6'>
          <Suspense fallback={<ContactDetailsSkeleton />}>
            <NotesList
              entityType='contact'
              entityId={contactId}
              title='Contact Notes'
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
