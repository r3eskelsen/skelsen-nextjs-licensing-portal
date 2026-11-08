import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function db() {
  const jar = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || key.startsWith('REPLACE_')) throw new Error('Local Supabase environment not configured');
  return createServerClient(url, key, {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values: Array<{ name: string; value: string; options: CookieOptions }>) {
        try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Read-only server component; session middleware refreshes tokens. */ }
      }
    }
  });
}
