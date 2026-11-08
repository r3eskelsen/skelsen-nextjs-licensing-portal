'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

type WritableOrganization = { id: string; name: string };
export default function ImportForm({ organizations }: { organizations: WritableOrganization[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true); setFeedback(null);
    try {
      const response = await fetch('/api/import', { method: 'POST', body: new FormData(formElement) });
      const result: { imported?: number; error?: string } = await response.json();
      if (!response.ok) { setFeedback({ ok: false, text: result.error ?? 'Import rejected.' }); return; }
      setFeedback({ ok: true, text: `${result.imported ?? 0} license(s) imported.` });
      formElement.reset();
      router.refresh();
    } catch {
      setFeedback({ ok: false, text: 'Request failed. Check your local connection.' });
    } finally { setBusy(false); }
  }
  return <form onSubmit={submit}>
    <label htmlFor="import-org">Organization</label>
    <select id="import-org" name="organization_id" required defaultValue="">
      <option value="">Select organization</option>
      {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
    </select>
    <label htmlFor="csv">CSV file</label>
    <input id="csv" name="file" type="file" accept=".csv,text/csv" required />
    <button type="submit" disabled={busy}>{busy ? 'Importing…' : 'Import licenses'}</button>
    {feedback && <p role={feedback.ok ? 'status' : 'alert'} className={feedback.ok ? 'success' : 'error'}>{feedback.text}</p>}
  </form>;
}
