import { ScrollArea } from '@/components/ui/scroll-area';
import { TicketService } from '@/lib/services/ticket.service';
import { type TicketWithDetails } from '@/lib/types/ticket';
import { notFound } from 'next/navigation';
import { TicketActions } from './components/ticket-actions';
import { TicketBreadcrumb } from './components/ticket-breadcrumb';
import { TicketSidebar } from './components/ticket-sidebar';

interface LayoutProps {
  children: React.ReactNode;
  params: {
    id: string;
  };
}

export default async function TicketLayout({ children, params }: LayoutProps) {
  const ticketService = await TicketService.create();
  const ticket = await ticketService.getById(params.id);

  if (!ticket) {
    notFound();
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <header className='border-b bg-background h-14'>
        <div className='flex h-14 items-center justify-between px-4'>
          <TicketBreadcrumb ticket={ticket as TicketWithDetails} />
          <TicketActions ticket={ticket as TicketWithDetails} />
        </div>
      </header>

      {/* Content */}
      <div className='flex flex-grow'>
        {/* Sidebar */}
        <TicketSidebar ticket={ticket as TicketWithDetails} />

        {/* Main Content */}
        <ScrollArea className='flex-1 h-[calc(100vh-3.5rem)]'>
          {children}
        </ScrollArea>
      </div>
    </div>
  );
}
