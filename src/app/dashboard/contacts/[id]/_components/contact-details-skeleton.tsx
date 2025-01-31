import { Skeleton } from '@/components/ui/skeleton';

export function ContactDetailsSkeleton() {
  return (
    <div className='space-y-4'>
      {/* Notes skeleton */}
      <div className='space-y-4'>
        {/* Add note form */}
        <div className='space-y-2'>
          <Skeleton className='h-24 w-full' />
          <Skeleton className='h-10 w-full' />
        </div>

        {/* Notes list */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <div className='flex-1 space-y-1'>
                <div className='flex items-center justify-between'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-4 w-24' />
                </div>
                <Skeleton className='h-16 w-full' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
