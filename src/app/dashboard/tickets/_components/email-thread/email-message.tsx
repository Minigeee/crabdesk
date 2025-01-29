import { Button } from '@/components/ui/button';
import { Tables } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import { Reply } from 'lucide-react';
import * as React from 'react';
import { type EmailThread } from './types';

interface EmailMessageProps {
  thread: EmailThread;
  message: Tables<'email_messages'>;
  onReply: (thread: EmailThread, message: Tables<'email_messages'>) => void;
}

export function EmailMessage({ thread, message, onReply }: EmailMessageProps) {
  return (
    <div className='w-full space-y-2'>
      <div className='flex items-start justify-between'>
        <div>
          <div className='font-medium'>
            {message.from_name} ({message.from_email})
          </div>
          <div className='text-sm text-muted-foreground'>
            To: {message.to_emails.join(', ')}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <div className='text-xs text-muted-foreground'>
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => onReply(thread, message)}
          >
            <Reply className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='border-l-2 pl-4'>
        <div className='whitespace-pre-wrap rounded-md bg-muted p-3 text-sm'>
          <div className='max-w-[65ch]'>{message.text_body}</div>
        </div>
      </div>
    </div>
  );
} 