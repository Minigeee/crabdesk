'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tables } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Mail, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useEmailTesting } from './email-testing-provider';

type EmailThread = Tables<'email_threads'> & {
  messages: Tables<'email_messages'>[];
};

export function EmailHistory() {
  const {
    setTab,
    threads,
    refreshThreads,
    selectedThread: replyTo,
    setSelectedThread: setReplyTo,
    isLoading,
    error,
  } = useEmailTesting();
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(
    replyTo
  );

  useEffect(() => {
    refreshThreads().catch(console.error);
  }, [refreshThreads]);

  return (
    <div className='grid h-[600px] grid-cols-3 gap-6'>
      {/* Thread List */}
      <div className='col-span-1 rounded-lg border'>
        <div className='flex items-center justify-between border-b p-4'>
          <h3 className='font-medium'>Email Threads</h3>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => refreshThreads()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <RefreshCcw className='h-4 w-4' />
            )}
          </Button>
        </div>
        <ScrollArea className='h-[calc(600px-57px)]'>
          {error ? (
            <Alert variant='destructive' className='m-4'>
              <AlertDescription>
                Failed to load threads: {error.message}
              </AlertDescription>
            </Alert>
          ) : isLoading && threads.length === 0 ? (
            <div className='flex h-full items-center justify-center text-muted-foreground'>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Loading threads...
            </div>
          ) : threads.length === 0 ? (
            <div className='flex h-full items-center justify-center text-muted-foreground'>
              No email threads found
            </div>
          ) : (
            <div className='divide-y'>
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread)}
                  className={`w-full p-4 text-left transition-colors hover:bg-muted ${
                    selectedThread?.id === thread.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className='mb-1 flex items-start justify-between'>
                    <span className='line-clamp-1 font-medium'>
                      {thread.subject}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {formatDistanceToNow(new Date(thread.last_message_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {thread.from_email}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Thread */}
      <div className='col-span-2 rounded-lg border'>
        {selectedThread ? (
          <>
            <div className='border-b p-4'>
              <div className='mb-1'>
                <h3 className='font-medium'>{selectedThread.subject}</h3>
              </div>
              <div className='flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Thread ID: {selectedThread.id}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    setReplyTo(selectedThread);
                    setTab('email');
                  }}
                >
                  <Mail className='h-4 w-4' />
                  Reply
                </Button>
              </div>
            </div>
            <ScrollArea className='h-[calc(600px-89px)]'>
              <div className='space-y-6 p-4'>
                {selectedThread.messages.map((message) => (
                  <div key={message.id} className='space-y-2'>
                    <div className='flex items-start justify-between'>
                      <div>
                        <div className='font-medium'>
                          {message.from_name} ({message.from_email})
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          To: {message.to_emails.join(', ')}
                        </div>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div className='border-l-2 pl-4'>
                      <div className='whitespace-pre-wrap rounded-md bg-muted p-3 text-sm'>
                        {message.text_body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className='flex h-full items-center justify-center text-muted-foreground'>
            Select a thread to view messages
          </div>
        )}
      </div>
    </div>
  );
}
