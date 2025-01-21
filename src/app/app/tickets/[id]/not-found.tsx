import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TicketNotFound() {
  return (
    <div className='flex min-h-full flex-col'>
      <header className='border-b bg-background'>
        <div className='flex h-14 items-center gap-4 px-4'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/tickets'>
              <ArrowLeft className='h-4 w-4' />
              Back
            </Link>
          </Button>
          <div className='flex flex-1 items-center justify-between'>
            <h1 className='text-lg font-semibold'>Ticket Not Found</h1>
          </div>
        </div>
      </header>

      <div className='flex flex-1 items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold'>404</h2>
          <p className='mt-2 text-muted-foreground'>
            {`The ticket you're looking for doesnt exist or has been deleted.`}
          </p>
          <Button className='mt-4' asChild>
            <Link href='/tickets'>Return to Tickets</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
