import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

export function hasLocalCredentials() {
  return Boolean(process.env.LAB04_LOCAL_SUPABASE_URL && process.env.LAB04_LOCAL_ANON_KEY && process.env.LAB04_LOCAL_SERVICE_ROLE_KEY);
}
export function readLocalCredentials() {
  const url = process.env.LAB04_LOCAL_SUPABASE_URL;
  const anonKey = process.env.LAB04_LOCAL_ANON_KEY;
  const serviceKey = process.env.LAB04_LOCAL_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) throw new Error('Missing LAB04_LOCAL_* credentials. See docs/LOCAL_TEST_DATA.md.');
  const parsed = new URL(url);
  if (!(parsed.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(parsed.hostname) && parsed.port === '55321')) {
    throw new Error('SAFETY HOLD: only the local disposable Supabase instance on port 55321 is allowed');
  }
  return { url, anonKey, serviceKey };
}
function localClient(url, key) {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
function must(result, action) {
  if (result.error) throw new Error(`${action}: ${result.error.message}`);
  return result.data;
}
export async function createLocalFixtures() {
  const { url, anonKey, serviceKey } = readLocalCredentials();
  const admin = localClient(url, serviceKey);
  const nonce = randomBytes(6).toString('hex');
  const password = `${randomBytes(20).toString('base64url')}9!`;
  const userIds = [];
  const orgIds = [];
  const credentials = {};
  const users = {};
  const clients = {};
  async function cleanup() {
    if (orgIds.length) {
      for (const table of ['audit_events', 'renewals', 'documents', 'licenses', 'memberships']) {
        const result = await admin.from(table).delete().in('organization_id', orgIds);
        if (result.error) console.error(`Fixture cleanup ${table}: ${result.error.message}`);
      }
      const result = await admin.from('organizations').delete().in('id', orgIds);
      if (result.error) console.error(`Fixture cleanup organizations: ${result.error.message}`);
    }
    for (const userId of userIds) {
      const result = await admin.auth.admin.deleteUser(userId);
      if (result.error) console.error(`Fixture cleanup user: ${result.error.message}`);
    }
  }
  try {
    for (const alias of ['aAdmin', 'aClient', 'bOwner', 'noMembership']) {
      const email = `lab04_${alias.toLowerCase()}_${nonce}@example.invalid`;
      const info = must(await admin.auth.admin.createUser({ email, password, email_confirm: true }), 'create user');
      userIds.push(info.user.id);
      users[alias] = info.user.id;
      credentials[alias] = { email, password };
      clients[alias] = localClient(url, anonKey);
      must(await clients[alias].auth.signInWithPassword({ email, password }), `sign in ${alias}`);
    }
    const organizations = must(await admin.from('organizations')
      .insert([{ name: `Synthetic Acme ${nonce}` }, { name: `Synthetic Birch ${nonce}` }])
      .select('id,name'), 'create organizations');
    orgIds.push(...organizations.map(o => o.id));
    const A = organizations[0].id; const B = organizations[1].id;
    must(await admin.from('memberships').insert([
      { organization_id: A, user_id: users.aAdmin, role: 'admin' },
      { organization_id: A, user_id: users.aClient, role: 'client' },
      { organization_id: B, user_id: users.bOwner, role: 'owner' }
    ]), 'create memberships');
    return { clients, credentials, users, A, B, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
