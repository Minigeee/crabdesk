'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useInternalAuth } from '@/lib/auth/internal/hooks';
import { MessageWithSender } from '@/lib/messages/message-service';
import { useMessages } from '@/lib/messages/use-messages';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import { UserAvatar } from '../users/user-avatar';

interface MessageThreadProps {
  ticketId: string;
}

export function MessageThread({ ticketId }: MessageThreadProps) {
  const { messages, isLoading, addMessage } = useMessages(ticketId);
  const { user: internalUser } = useInternalAuth();
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim() || !internalUser) return;

    setIsSending(true);
    try {
      await addMessage({
        ticket_id: ticketId,
        content: newMessage,
        sender_type: 'internal_user',
        sender_id: internalUser.id,
        content_type: 'text',
        is_private: isInternal,
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
      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwnMessage={message.sender_id === internalUser?.id}
          />
        ))}
      </div>

      <div className='border-t bg-background p-4'>
        <div className='space-y-4'>
          {internalUser && (
            <div className='flex items-center space-x-2'>
              <Switch
                id='internal-mode'
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label htmlFor='internal-mode'>Internal note</Label>
            </div>
          )}
          <div className='flex gap-2'>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                isInternal ? 'Type an internal note...' : 'Type your message...'
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
  const isInternalUser = message.sender_type === 'internal_user';
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
            message.is_private
              ? 'bg-muted text-muted-foreground'
              : isOwnMessage
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent',
            'whitespace-pre-wrap'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
