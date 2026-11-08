'use server';
import { requireUser } from '@/lib/auth';
import { isValidIsoDate } from '@/lib/date-policy.mjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const newLicense = z.object({
  organization_id: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  expires_on: z.string().refine(isValidIsoDate, 'Invalid calendar date')
});

export async function addLicense(form: FormData) {
  const parsed = newLicense.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect('/dashboard?error=input');
  const { supabase, user } = await requireUser();
  // Explicit role check for actionable UX; database RLS remains authoritative.
  const { data: member, error: memberError } = await supabase.from('memberships')
    .select('role')
    .eq('organization_id', parsed.data.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (memberError || !member || !['admin', 'owner'].includes(member.role)) {
    redirect('/dashboard?error=denied');
  }
  const { error } = await supabase.from('licenses').insert(parsed.data);
  if (error) redirect('/dashboard?error=denied');
  revalidatePath('/dashboard');
  redirect('/dashboard?ok=created');
}

export async function signOut() {
  const { supabase } = await requireUser();
  await supabase.auth.signOut();
  redirect('/login');
}
