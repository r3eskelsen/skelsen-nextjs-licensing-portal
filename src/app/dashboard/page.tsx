import { requireUser } from '@/lib/auth';
import { addLicense, signOut } from './actions';
import ImportForm from './ImportForm';
export const dynamic = 'force-dynamic';
type Member = { organization_id: string; user_id: string; role: 'client' | 'admin' | 'owner'; organizations: { name: string } | { name: string }[] | null };
function orgName(member: Member) {
  const org = member.organizations;
  return Array.isArray(org) ? (org[0]?.name ?? '—') : (org?.name ?? '—');
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { supabase, user } = await requireUser();
  const params = await searchParams;
  const [memberships, licenses, docs, renewals, activity] = await Promise.all([
    supabase.from('memberships').select('organization_id,user_id,role,organizations(name)').eq('user_id', user.id).order('organization_id'),
    supabase.from('licenses').select('id,organization_id,name,status,expires_on').order('expires_on'),
    supabase.from('documents').select('id,organization_id,title,created_at').limit(10),
    supabase.from('renewals').select('id,license_id,renewed_on').limit(10),
    supabase.from('audit_events').select('id,action,created_at').order('created_at', { ascending: false }).limit(10)
  ]);
  const ownMemberships = (memberships.data ?? []) as unknown as Member[];
  const writable = memberships.error ? [] : ownMemberships.filter(m => m.user_id === user.id && ['admin', 'owner'].includes(m.role));
  const organizations = writable.map(m => ({ id: m.organization_id, name: orgName(m) }));
  return <>
    <p className="eyebrow">Identity-aware workspace</p><h1>Licensing overview</h1>
    <p>Signed in as {user.email}. Database RLS restricts records to authorized organizations. Roles below describe only your own memberships.</p>
    <form action={signOut}><button>Sign out</button></form>
    {params.error && <p role="alert" className="error">Action rejected ({params.error}).</p>}
    {params.ok && <p role="status" className="success">License created.</p>}
    <div className="grid">
      <div className="panel"><p>Your organizations</p><h2>{memberships.error ? '—' : ownMemberships.length}</h2></div>
      <div className="panel"><p>Visible licenses</p><h2>{licenses.error ? '—' : licenses.data?.length ?? 0}</h2></div>
      <div className="panel"><p>Documents / renewals</p><h2>{docs.error || renewals.error ? '—' : `${docs.data?.length ?? 0} / ${renewals.data?.length ?? 0}`}</h2></div>
    </div>
    <section className="panel"><h2>Your organization roles</h2>
      {memberships.error ? <p role="alert" className="error">Unable to load memberships.</p> : ownMemberships.length === 0 ? <p>No organization has been assigned. Ask a local demo administrator to add a synthetic membership.</p> :
      <table><thead><tr><th>Organization</th><th>Your role</th><th>Organization ID</th></tr></thead>
        <tbody>{ownMemberships.map(m => <tr key={m.organization_id}><td>{orgName(m)}</td><td><span className="pill">{m.role}</span></td><td><code>{m.organization_id}</code></td></tr>)}</tbody>
      </table>}
    </section>
    <section className="panel"><h2>Licenses</h2>
      {licenses.error ? <p role="alert" className="error">Unable to load licenses.</p> :
      <table><thead><tr><th>License</th><th>State</th><th>Expires</th><th>Organization</th></tr></thead>
        <tbody>{licenses.data?.map(l => <tr key={l.id}><td>{l.name}</td><td>{l.status}</td><td>{l.expires_on}</td><td><code>{l.organization_id}</code></td></tr>)}</tbody>
      </table>}
    </section>
    {writable.length > 0 ? <>
      <section className="panel"><h2>Create license (admin / owner)</h2>
        <form action={addLicense}>
          <label htmlFor="org">Organization</label><select id="org" name="organization_id" required defaultValue=""><option value="">Select organization</option>{writable.map(m => <option key={m.organization_id} value={m.organization_id}>{orgName(m)}</option>)}</select>
          <label htmlFor="license">License name</label><input id="license" name="name" maxLength={80} required />
          <label htmlFor="expires">Expires on</label><input id="expires" name="expires_on" type="date" required />
          <button type="submit">Add license</button>
        </form>
      </section>
      <section className="panel"><h2>CSV import (admin / owner)</h2>
        <p>Constrained CSV, maximum 100 rows / 64 KiB. The server validates the user's role and PostgreSQL RLS enforces writes.</p>
        <ImportForm organizations={organizations}/>
      </section>
    </> : <section className="panel"><h2>Read-only access</h2><p>You do not have permission to create or import licenses for an organization in this demo.</p></section>}
    <section className="panel"><h2>Recent audit actions</h2>
      {activity.error ? <p role="alert" className="error">Unable to load audit activity.</p> : <ul>{activity.data?.map(e => <li key={e.id}>{e.action} · {new Date(e.created_at).toLocaleDateString('en-US')}</li>)}</ul>}
    </section>
  </>;
}
