'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { type TicketWithDetails } from '@/lib/types/ticket';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TicketBreadcrumbProps {
  ticket: TicketWithDetails;
}

export function TicketBreadcrumb({ ticket }: TicketBreadcrumbProps) {
  const pathname = usePathname();
  const isEditPage = pathname.endsWith('/edit');
  const isSubRoute = isEditPage;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href='/app/tickets'>Tickets</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isSubRoute && (
            <BreadcrumbLink asChild>
              <Link href={`/app/tickets/${ticket.id}`}>{ticket.title}</Link>
            </BreadcrumbLink>
          )}
          {!isSubRoute && <BreadcrumbPage>{ticket.title}</BreadcrumbPage>}
        </BreadcrumbItem>
        {isEditPage && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
