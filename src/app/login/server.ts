'use server';
import { db } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { z } from 'zod';
const credentials = z.object({email:z.string().email().max(254),password:z.string().min(8).max(128)});
function parse(form: FormData) {return credentials.safeParse({email:form.get('email'),password:form.get('password')});}
export async function login(form:FormData) {
  const result=parse(form); if (!result.success) redirect('/login?error=1');
  const supabase=await db();const {error}=await supabase.auth.signInWithPassword(result.data);
  if (error) redirect('/login?error=1');redirect('/dashboard');
}
export async function signup(form:FormData) {
  const result=parse(form);if (!result.success) redirect('/login?error=1');
  const supabase=await db();const {error}=await supabase.auth.signUp(result.data);
  if(error)redirect('/login?error=1');redirect('/dashboard');
}
