import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TicketDetailPage() {
  return (
    <div className='p-6'>
      <Tabs defaultValue='conversations'>
        <TabsList>
          <TabsTrigger value='conversations'>Conversations</TabsTrigger>
          <TabsTrigger value='activity'>Activity</TabsTrigger>
        </TabsList>
        <div className='mt-4'>
          <TabsContent value='conversations' className='mt-0'>
            {/* Conversations will be added here */}
            <div className='rounded-lg border p-4'>
              <p className='text-center text-muted-foreground'>
                Conversations feature coming soon
              </p>
            </div>
          </TabsContent>
          <TabsContent value='activity' className='mt-0'>
            {/* Activity log will be added here */}
            <div className='rounded-lg border p-4'>
              <p className='text-center text-muted-foreground'>
                Activity log feature coming soon
              </p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
