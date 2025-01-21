'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ClientConversationService } from '@/lib/services/client/conversation.service';
import { type ThreadedConversation } from '@/lib/types/conversation';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(calendar);

function ConversationMessage({
  message,
  isNested = false,
}: {
  message: ThreadedConversation;
  isNested?: boolean;
}) {
  const { user } = useAuth();
  const isCurrentUser = user?.id === message.user?.id;
  const isInternal = message.is_internal;
  const messageDate = dayjs(message.created_at);

  return (
    <div
      className={cn(
        'group relative flex gap-3 py-3',
        isNested && 'ml-12',
        isInternal && 'bg-muted/50 px-3 rounded-lg',
      )}
    >
      <Avatar className='h-8 w-8 shrink-0'>
        <AvatarImage src={message.user?.avatar_url || undefined} />
        <AvatarFallback>{message.user?.full_name?.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className='flex-1 space-y-1'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium'>{message.user?.full_name}</span>
          <span
            className='text-xs text-muted-foreground'
            title={messageDate.format('LLLL')}
          >
            {messageDate.calendar(null, {
              sameDay: '[Today at] h:mm A',
              lastDay: '[Yesterday at] h:mm A',
              lastWeek: 'dddd [at] h:mm A',
              sameElse: 'MMM D, YYYY [at] h:mm A',
            })}
          </span>
          {isInternal && (
            <span className='rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800'>
              Internal Note
            </span>
          )}
        </div>
        <div className='text-sm text-muted-foreground whitespace-pre-wrap'>
          {message.message}
        </div>
        {message.replies?.map((reply) => (
          <ConversationMessage key={reply.id} message={reply} isNested />
        ))}
      </div>
    </div>
  );
}

type ConversationThreadProps = {
  initialMessages: ThreadedConversation[];
};

export function ConversationThread({
  initialMessages,
}: ConversationThreadProps) {
  const params = useParams();
  const ticketId = params.id as string;
  const [messages, setMessages] =
    useState<ThreadedConversation[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const { user } = useAuth();
  const conversationService = new ClientConversationService();

  useEffect(() => {
    let subscription: any;

    console.log('setupRealtime');

    async function setupRealtime() {
      subscription = await conversationService.subscribeToTicketConversations(
        ticketId,
        (newMessage) => {
          console.log('newMessage', newMessage);

          setMessages((prev) => {
            // If it's a reply, find the parent and add it
            if (newMessage.parent_id) {
              return prev.map((msg) => {
                if (msg.id === newMessage.parent_id) {
                  return {
                    ...msg,
                    replies: [...(msg.replies || []), newMessage],
                  };
                }
                return msg;
              });
            }
            // Otherwise add it to the root level
            return [...prev, newMessage];
          });
        },
        (updatedMessage) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg,
            ),
          );
        },
        (deletedId) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== deletedId));
        },
      );
    }

    setupRealtime();

    return () => {
      subscription?.unsubscribe();
    };
  }, [ticketId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    await conversationService.create({
      ticket_id: ticketId,
      user_id: user.id,
      message: newMessage.trim(),
      is_internal: isInternal,
    });

    setNewMessage('');
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-2 rounded-lg border p-4'>
        {messages.length > 0 ? (
          messages.map((message) => (
            <ConversationMessage key={message.id} message={message} />
          ))
        ) : (
          <div className='text-center text-muted-foreground text-sm'>
            No messages yet. Be the first to start the conversation!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder='Type your message...'
          className='min-h-[100px]'
        />
        <div className='flex items-center justify-between'>
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className='rounded border-gray-300'
            />
            Internal note (only visible to team members)
          </label>
          <Button type='submit' disabled={!newMessage.trim()}>
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
}
