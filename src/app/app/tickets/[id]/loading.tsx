import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TicketDetailLoading() {
  return (
    <div className='flex min-h-full flex-col'>
      {/* Header */}
      <header className='border-b bg-background'>
        <div className='flex h-14 items-center gap-4 px-4'>
          <Button variant='ghost' size='sm' asChild>
            <Link href='/tickets'>
              <ArrowLeft className='h-4 w-4' />
              Back
            </Link>
          </Button>
          <div className='flex flex-1 items-center justify-between'>
            <h1 className='text-lg font-semibold'>Ticket Details</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className='flex-1 space-y-4 p-8 pt-6'>
        <div className='grid gap-6'>
          {/* Title and Metadata */}
          <div className='space-y-2'>
            <Skeleton className='h-8 w-2/3' />
            <Skeleton className='h-4 w-1/3' />
          </div>

          {/* Status and Priority */}
          <div className='flex gap-4'>
            <Skeleton className='h-6 w-24' />
            <Skeleton className='h-6 w-24' />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-32 w-full' />
          </div>

          {/* Assignment */}
          <div className='space-y-2'>
            <Skeleton className='h-5 w-24' />
            <div className='rounded-lg border p-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-5 w-32' />
                </div>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-5 w-32' />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className='space-y-2'>
            <Skeleton className='h-5 w-24' />
            <div className='flex gap-2'>
              <Skeleton className='h-6 w-16' />
              <Skeleton className='h-6 w-16' />
              <Skeleton className='h-6 w-16' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
