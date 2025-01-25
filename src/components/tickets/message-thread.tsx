'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/hooks';
import { MessageWithSender } from '@/lib/messages/message-service';
import { useMessages } from '@/lib/messages/use-messages';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { EyeOffIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { UserAvatar } from '../users/user-avatar';

interface MessageThreadProps {
  ticketId: string;
  visibility: 'internal' | 'public';
}

export function MessageThread({ ticketId, visibility }: MessageThreadProps) {
  const { messages, isLoading, addMessage } = useMessages(ticketId);
  const { user: internalUser } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Filter messages based on visibility
  const visibleMessages = useMemo(
    () =>
      messages.filter((message) =>
        visibility === 'internal' ? message.is_private : !message.is_private
      ),
    [messages, visibility]
  );

  const handleSend = async () => {
    if (!newMessage.trim() || !internalUser) return;

    setIsSending(true);
    try {
      await addMessage({
        ticket_id: ticketId,
        content: newMessage,
        sender_type: 'user',
        sender_id: internalUser.id,
        content_type: 'text',
        is_private: visibility === 'internal',
      });
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-4 p-4'>
        {[1, 2, 3].map((i) => (
          <Card key={i} className='p-4'>
            <div className='flex items-start gap-4'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-2'>
                <Skeleton className='h-4 w-1/4' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col'>
      <ScrollArea className='min-h-0 flex-1 overflow-y-auto'>
        <div className='space-y-4 p-4'>
          {visibleMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === internalUser?.id}
            />
          ))}
        </div>
      </ScrollArea>

      <div className='border-t bg-background p-4'>
        <div className='space-y-4'>
          <div className='flex gap-2'>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                visibility === 'internal'
                  ? 'Type an internal note...'
                  : 'Type your message...'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className='flex-1'
              rows={3}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !newMessage.trim()}
              className='self-end'
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const isInternalUser = message.sender_type === 'user';
  const sender = message.sender;

  return (
    <div
      className={cn(
        'flex gap-4',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <UserAvatar user={sender} />
      <div
        className={cn(
          'flex flex-col',
          isOwnMessage ? 'items-end' : 'items-start',
          'max-w-[60ch]'
        )}
      >
        <div
          className={cn(
            'flex w-full items-baseline gap-2 px-2',
            isOwnMessage && 'flex-row-reverse'
          )}
        >
          {!isOwnMessage && (
            <span className='text-sm font-medium'>
              {sender?.name ??
                (isInternalUser
                  ? 'Unknown Agent'
                  : ((sender as { email: string })?.email ??
                    'Unknown Contact'))}
            </span>
          )}
          <span className='text-xs text-muted-foreground'>
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </span>
          {message.is_private && (
            <>
              <div className='flex-grow' />
              <div title='Internal Note' className='translate-y-1'>
                <EyeOffIcon
                  className='h-3.5 w-3.5 text-muted-foreground'
                  aria-label='Internal Note'
                />
              </div>
            </>
          )}
        </div>
        <div
          className={cn(
            'mt-1 rounded-lg px-4 py-2',
            isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-accent',
            'whitespace-pre-wrap'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
