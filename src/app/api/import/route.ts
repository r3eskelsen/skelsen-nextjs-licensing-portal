import { db } from '@/lib/supabase';
import { validateCsv, MAX_CSV_BYTES } from '@/lib/import-policy.mjs';
import {
  parseBoundedMultipart, PayloadTooLargeError, UnsupportedMediaTypeError
} from '@/lib/limited-form.mjs';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const supabase = await db();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let form: FormData;
  try {
    form = await parseBoundedMultipart(request);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return Response.json({ error: 'File upload exceeds request limit' }, { status: 413 });
    if (error instanceof UnsupportedMediaTypeError) return Response.json({ error: 'Multipart form required' }, { status: 415 });
    return Response.json({ error: 'Invalid multipart data' }, { status: 400 });
  }

  const file = form.get('file');
  const organizationId = form.get('organization_id');
  if (!(file instanceof File) || typeof organizationId !== 'string' || file.size > MAX_CSV_BYTES ||
      !file.name.toLowerCase().endsWith('.csv')) {
    return Response.json({ error: 'Invalid CSV file' }, { status: 400 });
  }
  const { data: membership, error: roleError } = await supabase.from('memberships')
    .select('role').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle();
  if (roleError || !membership || !['admin', 'owner'].includes(membership.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  let rows;
  try { rows = validateCsv(await file.text(), organizationId); }
  catch { return Response.json({ error: 'Invalid CSV content' }, { status: 400 }); }
  const { error: insertError } = await supabase.from('licenses').insert(rows);
  if (insertError) return Response.json({ error: 'Import denied by database policy' }, { status: 403 });
  return Response.json({ imported: rows.length }, { status: 201 });
}
