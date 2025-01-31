'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';

export async function login(formData: FormData, next: string) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(next);
}

export async function signup(formData: FormData, next: string) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;

  const supabase = await createClient();
  const serviceClient = createServiceClient();

  // TEMP : Get first organization available to add user to
  const { data: organizations, error: organizationsError } = await serviceClient
    .from('organizations')
    .select('*')
    .limit(1);

  if (organizationsError || organizations.length === 0) {
    return { error: organizationsError?.message || 'No organizations found' };
  }

  const { data: userData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        org_id: organizations[0].id,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!userData.user) {
    return { error: 'User could not be created' };
  }

  // Create a new user in the organization
  await serviceClient.from('users').insert({
    auth_user_id: userData.user.id,
    name,
    org_id: organizations[0].id,
  });

  redirect(next);
}
