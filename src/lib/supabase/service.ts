import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { Database } from '../database.types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Creates a Supabase client with the service role key
 * This bypasses RLS and should only be used server-side for admin operations
 */
export const createServiceClient = cache(() =>
  createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey)
);
