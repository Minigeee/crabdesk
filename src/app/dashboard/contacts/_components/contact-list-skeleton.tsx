import { Skeleton } from '@/components/ui/skeleton';

export function ContactListSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='rounded-lg border'>
        <div className='border-b px-4 py-3'>
          <div className='flex items-center gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-4 w-24' />
            ))}
          </div>
        </div>
        <div className='divide-y'>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className='px-4 py-4'>
              <div className='flex items-center gap-4'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-48' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-4 w-24' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
