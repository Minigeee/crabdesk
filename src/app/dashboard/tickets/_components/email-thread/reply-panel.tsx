import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Loader2, Mail, Star } from 'lucide-react';
import * as React from 'react';
import { EMAIL_TEMPLATES, type ReplyContext } from './types';
import { getGradeColor, getGradeLabel } from './utils';
import type { ResponseGrade } from '@/lib/tickets/grader-service';

interface ReplyPanelProps {
  isOpen: boolean;
  replyContext: ReplyContext | null;
  emailReplyText: string;
  onEmailReplyTextChange: (text: string) => void;
  onClose: () => void;
  onSendReply: () => void;
  onGradeResponse: () => void;
  isSending: boolean;
  isGrading: boolean;
  grade: ResponseGrade | null;
  orgDomain: string;
}

export function ReplyPanel({
  isOpen,
  replyContext,
  emailReplyText,
  onEmailReplyTextChange,
  onClose,
  onSendReply,
  onGradeResponse,
  isSending,
  isGrading,
  grade,
  orgDomain,
}: ReplyPanelProps) {
  if (!isOpen || !replyContext) return null;

  return (
    <ScrollArea className='flex h-full flex-col'>
      <div className='flex h-14 items-center justify-between border-b px-4 py-2'>
        <h3 className='font-semibold'>New Reply</h3>
        <Button variant='ghost' size='icon' onClick={onClose}>
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      <div className='border-b bg-muted/50 px-4 py-3 text-sm'>
        <div className='space-y-2'>
          <div className='flex items-start gap-2'>
            <span className='w-16 font-medium'>From:</span>
            <div>{`Support Team <support@${orgDomain}>`}</div>
          </div>
          <div className='flex items-start gap-2'>
            <span className='w-16 font-medium'>To:</span>
            <div>
              {`${replyContext.originalMessage.from_name} <${replyContext.originalMessage.from_email}>`}
            </div>
          </div>
          <div className='flex items-start gap-2'>
            <span className='w-16 font-medium'>Subject:</span>
            <div>{replyContext.originalMessage.subject}</div>
          </div>
          <div className='mt-2 rounded-md bg-muted p-3 text-xs text-muted-foreground'>
            <div className='mb-1 font-medium'>In Reply To:</div>
            <div className='line-clamp-3 opacity-70'>
              {replyContext.originalMessage.text_body}
            </div>
          </div>
        </div>
      </div>

      <div className='flex-1 space-y-4 p-4'>
        <div className='flex items-center justify-between'>
          <h4 className='text-sm font-medium'>Email Template</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' className='w-[200px] justify-between'>
                Select template
                <ChevronDown className='ml-2 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-[200px]'>
              {EMAIL_TEMPLATES.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onSelect={() => onEmailReplyTextChange(template.body)}
                  className='flex flex-col items-start py-3'
                >
                  <div className='font-medium'>{template.title}</div>
                  <div className='text-xs text-muted-foreground'>
                    {template.description}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Textarea
          value={emailReplyText}
          onChange={(e) => onEmailReplyTextChange(e.target.value)}
          placeholder='Type your reply...'
          className='min-h-[300px] flex-1 resize-none'
        />

        {grade && (
          <div className='rounded-md border bg-muted/50 p-3'>
            <div className='mb-2 flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Star
                  className={cn('h-4 w-4', getGradeColor(grade.quality_score))}
                />
                <span className='font-medium'>
                  Quality: {getGradeLabel(grade.quality_score)}
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Star
                  className={cn('h-4 w-4', getGradeColor(grade.accuracy_score))}
                />
                <span className='font-medium'>
                  Accuracy: {getGradeLabel(grade.accuracy_score)}
                </span>
              </div>
            </div>
            <p className='text-sm text-muted-foreground'>{grade.summary}</p>
            {grade.concerns.length > 0 && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant='link' className='mt-2 h-auto p-0 text-xs'>
                    View Concerns
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent className='w-80'>
                  <div className='prose'>
                    <div className='mb-1 font-medium'>Concerns:</div>
                    <ul className='text-sm text-muted-foreground'>
                      {grade.concerns.map((concern, i) => (
                        <li key={i}>{concern}</li>
                      ))}
                    </ul>
                  </div>
                </HoverCardContent>
              </HoverCard>
            )}
          </div>
        )}

        <div className='flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={onGradeResponse}
            disabled={isGrading || !emailReplyText.trim()}
          >
            {isGrading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Grading...
              </>
            ) : (
              <>
                <Star className='mr-2 h-4 w-4' />
                Grade Response
              </>
            )}
          </Button>
          <Button
            onClick={onSendReply}
            disabled={isSending || !emailReplyText.trim()}
          >
            {isSending ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Sending...
              </>
            ) : (
              <>
                <Mail className='mr-2 h-4 w-4' />
                Send Reply
              </>
            )}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
} 