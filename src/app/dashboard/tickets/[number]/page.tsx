import { NotesList } from '@/components/notes/notes-list';
import { ContactPanel } from '@/components/tickets/contact-panel';
import { MessageThread } from '@/components/tickets/message-thread';
import { TicketActions } from '@/components/tickets/ticket-actions';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { TicketService } from '@/lib/tickets/ticket-service';
import {
  EyeOffIcon,
  MailIcon,
  MessageCircleIcon,
  StickyNoteIcon,
} from 'lucide-react';
import { notFound } from 'next/navigation';
import { EmailThreadView } from '../_components/email-thread-view';
import { TicketViewProvider } from '../_components/ticket-view-provider';
import { TicketHeader } from './_components/ticket-header';

interface PageProps {
  params: Promise<{
    number: string;
  }>;
}

async function getTicketByNumber(number: string) {
  const userData = await getCurrentUser();
  if (!userData) return null;

  const supabase = await createClient();
  const ticketService = new TicketService(supabase, userData.organization.id);

  try {
    // Get the ticket with all relations
    const ticket = await ticketService.getTicketByNumber(
      parseInt(number, 10),
      true
    );

    // Get recent tickets for the contact
    const { data: recentTickets } = await ticketService.getTickets({
      filters: {
        contact_id: ticket.contact_id,
      },
      orderBy: [{ column: 'created_at', ascending: false }],
      limit: 5,
    });

    // Filter out the current ticket from recent tickets
    const filteredRecentTickets = recentTickets.filter(
      (t) => t.id !== ticket.id
    );

    return {
      ...ticket,
      recentContactTickets: filteredRecentTickets,
    };
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }
}

export default async function TicketPage({ params }: PageProps) {
  const { number: ticketNumber } = await params;
  const ticket = await getTicketByNumber(ticketNumber);
  if (!ticket) {
    notFound();
  }

  const userData = await getCurrentUser();
  if (!userData) {
    notFound();
  }

  return (
    <TicketViewProvider>
      <div className='flex h-full'>
        <ScrollArea className='w-[300px] overflow-y-auto border-r xl:w-[400px]'>
          <div className='space-y-6 p-4'>
            <TicketActions ticket={ticket} />
            <ContactPanel
              contact={ticket.contact}
              recentTickets={ticket.recentContactTickets}
            />
          </div>
        </ScrollArea>

        {/* Main content */}
        <div className='flex min-w-0 flex-1 flex-col'>
          <TicketHeader ticket={ticket} />

          <Tabs defaultValue='email' className='flex h-0 flex-1 flex-col'>
            <TabsList className='justify-start rounded-none border-b py-5'>
              <TabsTrigger value='email' className='gap-2'>
                <MailIcon className='h-4 w-4' />
                Emails
              </TabsTrigger>
              <TabsTrigger value='notes' className='gap-2'>
                <StickyNoteIcon className='h-4 w-4' />
                Notes
              </TabsTrigger>
              <TabsTrigger value='public' className='gap-2'>
                <MessageCircleIcon className='h-4 w-4' />
                Messages
              </TabsTrigger>
              <TabsTrigger value='internal' className='gap-2'>
                <EyeOffIcon className='h-4 w-4' />
                Team Messages
              </TabsTrigger>
            </TabsList>

            <div className='min-h-0 flex-1'>
              <TabsContent
                value='public'
                className='m-0 h-full data-[state=inactive]:hidden'
              >
                <MessageThread ticketId={ticket.id} visibility='public' />
              </TabsContent>
              <TabsContent
                value='internal'
                className='m-0 h-full data-[state=inactive]:hidden'
              >
                <MessageThread ticketId={ticket.id} visibility='internal' />
              </TabsContent>
              <TabsContent
                value='email'
                className='m-0 h-full data-[state=inactive]:hidden'
              >
                <EmailThreadView ticketId={ticket.id} />
              </TabsContent>
              <TabsContent
                value='notes'
                className='m-0 h-full data-[state=inactive]:hidden'
              >
                <div className='p-6'>
                  <NotesList
                    entityType='ticket'
                    entityId={ticket.id}
                    title='Ticket Notes'
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </TicketViewProvider>
  );
}
