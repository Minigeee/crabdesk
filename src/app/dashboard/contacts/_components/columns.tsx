import { Contact } from '@/lib/contacts/use-contacts';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

type ColumnDef = {
  id: keyof Contact;
  label: string;
  sortable?: boolean;
  width?: number;
  cell: (contact: Contact) => React.ReactNode;
};

export const COLUMNS: ColumnDef[] = [
  {
    id: 'name',
    label: 'Name',
    sortable: true,
    cell: (contact) => (
      <Link
        href={`/dashboard/contacts/${contact.id}`}
        className='font-medium hover:underline'
      >
        {contact.name || contact.email}
      </Link>
    ),
  },
  {
    id: 'email',
    label: 'Email',
    sortable: true,
    cell: (contact) => contact.email,
  },
  {
    id: 'open_tickets_count',
    label: 'Open Tickets',
    sortable: true,
    width: 160,
    cell: (contact) => contact.open_tickets_count,
  },
  {
    id: 'total_tickets_count',
    label: 'Total Tickets',
    sortable: true,
    width: 160,
    cell: (contact) => contact.total_tickets_count,
  },
  {
    id: 'first_seen_at',
    label: 'First Seen',
    sortable: true,
    width: 160,
    cell: (contact) =>
      formatDistanceToNow(new Date(contact.first_seen_at), {
        addSuffix: true,
      }),
  },
  {
    id: 'last_seen_at',
    label: 'Last Seen',
    sortable: true,
    width: 160,
    cell: (contact) =>
      formatDistanceToNow(new Date(contact.last_seen_at), {
        addSuffix: true,
      }),
  },
];
