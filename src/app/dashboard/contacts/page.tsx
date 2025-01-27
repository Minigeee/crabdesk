import { Metadata } from 'next';
import { Suspense } from 'react';

import { ContactFilters } from './_components/contact-filters';
import { ContactList } from './_components/contact-list';
import { ContactListSkeleton } from './_components/contact-list-skeleton';

export const metadata: Metadata = {
  title: 'Contacts | CrabDesk',
  description: 'Manage your customer contacts',
};

export default function ContactsPage() {
  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold tracking-tight'>Contacts</h1>
      </div>

      <ContactFilters />

      <Suspense fallback={<ContactListSkeleton />}>
        <ContactList />
      </Suspense>
    </div>
  );
}
