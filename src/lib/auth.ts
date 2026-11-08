import { db } from './supabase';
import { redirect } from 'next/navigation';
export async function requireUser() {
  const supabase = await db();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/login');
  return { supabase, user: data.user };
}
