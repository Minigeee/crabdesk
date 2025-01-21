import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversationThread } from './components/conversation-thread';
import { TicketHistory } from './components/ticket-history';
import { ServerConversationService } from '@/lib/services/server/conversation.service';

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const conversationService = await ServerConversationService.create();
  const initialMessages = await conversationService.getTicketConversations(params.id);

  return (
    <div className='p-6'>
      <Tabs defaultValue='conversations'>
        <TabsList>
          <TabsTrigger value='conversations'>Conversations</TabsTrigger>
          <TabsTrigger value='activity'>Activity</TabsTrigger>
        </TabsList>
        <div className='mt-4'>
          <TabsContent value='conversations' className='mt-0'>
            <ConversationThread initialMessages={initialMessages} />
          </TabsContent>
          <TabsContent value='activity' className='mt-0'>
            <TicketHistory ticketId={params.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
