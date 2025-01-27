'use client';

import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/ui/search-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

export function ContactFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      if (params.get('page') === '1') {
        params.delete('page');
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (value: string) => {
    updateSearchParams({ query: value, page: '1' });
  };

  const handleInteractionFilter = (value: string) => {
    updateSearchParams({ interaction: value, page: '1' });
  };

  const handleClearFilters = () => {
    router.push('/dashboard/contacts');
  };

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-1 items-center gap-4'>
        <div className='max-w-sm flex-1'>
          <SearchBar
            placeholder='Search contacts...'
            value={searchParams.get('query') || ''}
            onChange={handleSearch}
          />
        </div>
        <Select
          defaultValue={searchParams.get('interaction') || ''}
          onValueChange={handleInteractionFilter}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by...' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='24h'>Last 24 hours</SelectItem>
            <SelectItem value='7d'>Last 7 days</SelectItem>
            <SelectItem value='30d'>Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(searchParams.get('query') || searchParams.get('interaction')) && (
        <Button
          variant='ghost'
          onClick={handleClearFilters}
          className='mt-2 sm:mt-0'
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}
