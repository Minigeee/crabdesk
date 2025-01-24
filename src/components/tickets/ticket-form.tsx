import { ContactSelect } from '@/components/contacts/contact-select';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FileUpload } from '@/components/ui/file-upload';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserSelect } from '@/components/users/user-select';
import { FileAttachment } from '@/lib/tickets/ticket-service';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Separator } from '../ui/separator';

// Ticket form schema
const ticketFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  contact_id: z.string().uuid('Contact is required'),
  priority: z
    .enum(['low', 'normal', 'high', 'urgent'] as const)
    .default('normal'),
  source: z.enum(['email', 'chat', 'portal', 'api'] as const).default('portal'),
  status: z
    .enum(['open', 'pending', 'resolved', 'closed'] as const)
    .default('open'),
  assignee_id: z.string().uuid().optional(),
  team_id: z.string().uuid().optional(),
  description: z.string().optional(),
});

export type TicketFormData = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  onSubmit: (
    data: TicketFormData,
    attachments: FileAttachment[]
  ) => Promise<void>;
  defaultValues?: Partial<TicketFormData>;
  isSubmitting?: boolean;
}

export function TicketForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: TicketFormProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      subject: '',
      status: 'open',
      priority: 'normal',
      source: 'portal',
      ...defaultValues,
    },
  });

  const handleSubmit = async (data: TicketFormData) => {
    await onSubmit(data, attachments);
  };

  const handleFileChange = (files: File[]) => {
    const newAttachments = files.map((file) => ({
      file,
      filename: file.name,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
        <FormField
          control={form.control}
          name='subject'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder='Enter ticket subject' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='contact_id'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <FormControl>
                <ContactSelect value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='priority'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select priority' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='low'>Low</SelectItem>
                    <SelectItem value='normal'>Normal</SelectItem>
                    <SelectItem value='high'>High</SelectItem>
                    <SelectItem value='urgent'>Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='open'>Open</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='resolved'>Resolved</SelectItem>
                    <SelectItem value='closed'>Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='description'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Enter ticket description'
                  className='min-h-[100px]'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible
          open={isMoreOptionsOpen}
          onOpenChange={setIsMoreOptionsOpen}
        >
          <CollapsibleTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              className='flex w-full items-center justify-between px-2 py-0.5'
            >
              <span className='text-sm font-medium'>More Options</span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  isMoreOptionsOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className='space-y-4'>
            <Separator />
            <FormField
              control={form.control}
              name='assignee_id'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <FormControl>
                    <UserSelect value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Attachments</label>
              <FileUpload
                onFilesSelected={handleFileChange}
                maxSize={10 * 1024 * 1024} // 10MB
                accept={{
                  'image/*': [],
                  'application/pdf': [],
                  'application/msword': [],
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    [],
                }}
              />
              {attachments.length > 0 && (
                <div className='mt-2 space-y-2'>
                  {attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded-md border p-2'
                    >
                      <span className='text-sm'>{attachment.filename}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeAttachment(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className='flex justify-end'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
