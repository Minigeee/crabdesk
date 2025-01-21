import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CreateTicketForm } from './create-ticket-form';

export default function NewTicketPage() {
  return (
    <div className='flex min-h-full flex-col'>
      {/* Header */}
      <header className='border-b bg-background'>
        <div className='flex h-14 items-center gap-4 px-4'>
          <Button variant='ghost' size='icon' asChild>
            <Link href='/tickets'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div className='flex flex-1 items-center justify-between'>
            <h1 className='text-lg font-semibold'>Create New Ticket</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className='flex-1 space-y-4 p-8'>
        <Card>
          <CardHeader>
            <CardTitle>Ticket Information</CardTitle>
            <CardDescription>
              Fill out the form below to create a new support ticket.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTicketForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 