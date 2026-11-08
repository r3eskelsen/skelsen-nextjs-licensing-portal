/** Real local Supabase JWT and PostgREST checks. Run only against an isolated
 * local stack. Never prints secrets, passwords, tokens, or user emails. */
import assert from 'node:assert/strict';
import { createLocalFixtures } from '../helpers/local-fixtures.mjs';

let f;
let passed = 0;
function ok(label, condition) {
  assert.ok(condition, label);
  console.log(`PASS ${String(++passed).padStart(2, '0')} ${label}`);
}
async function select(client, table, org) {
  const res = await client.from(table).select('*').eq('organization_id', org);
  assert.equal(res.error, null, `${table}: ${res.error?.message}`);
  return res.data;
}
async function main() {
  f = await createLocalFixtures();
  const { aAdmin, aClient, bOwner, noMembership } = f.clients;
  const seedA = await aAdmin.from('licenses').insert({ organization_id: f.A, name: 'Synthetic A', expires_on: '2028-01-01' }).select().single();
  ok('Admin A can create license A', !seedA.error && !!seedA.data?.id);
  const seedB = await bOwner.from('licenses').insert({ organization_id: f.B, name: 'Synthetic B', expires_on: '2028-01-01' }).select().single();
  ok('Owner B can create license B', !seedB.error && !!seedB.data?.id);

  ok('Client A sees own license A', (await select(aClient, 'licenses', f.A)).length === 1);
  ok('Client A cannot see license B', (await select(aClient, 'licenses', f.B)).length === 0);
  ok('Admin A cannot see license B', (await select(aAdmin, 'licenses', f.B)).length === 0);
  ok('Owner B cannot see license A', (await select(bOwner, 'licenses', f.A)).length === 0);
  ok('Unassigned user cannot see any license', (await select(noMembership, 'licenses', f.A)).length === 0);

  const visibleMembers = await select(aClient, 'memberships', f.A);
  ok('Client A reads only own membership', visibleMembers.length === 1 && visibleMembers[0].user_id === f.users.aClient && visibleMembers[0].role === 'client');
  const adminMembers = await select(aAdmin, 'memberships', f.A);
  ok('Admin A reads only own membership', adminMembers.length === 1 && adminMembers[0].user_id === f.users.aAdmin);
  ok('Owner B cannot enumerate A members', (await select(bOwner, 'memberships', f.A)).length === 0);

  async function deniedWrite(label, client, org, action = 'insert') {
    const result = action === 'update'
      ? await client.from('licenses').update({ name: 'Unauthorized change' }).eq('id', seedA.data.id).select()
      : await client.from('licenses').insert({ organization_id: org, name: 'Unauthorized change', expires_on: '2028-01-01' }).select();
    // UPDATE can be filtered as 0 affected rows, INSERT must receive an RLS error.
    ok(label, Boolean(result.error) || (action === 'update' && result.data?.length === 0));
  }
  await deniedWrite('Client A cannot create license A', aClient, f.A);
  await deniedWrite('Admin A cannot create license B', aAdmin, f.B);
  await deniedWrite('Owner B cannot create license A', bOwner, f.A);
  await deniedWrite('Unassigned user cannot create license A', noMembership, f.A);
  await deniedWrite('Client A cannot update license A', aClient, f.A, 'update');

  const eventsA = await select(aClient, 'audit_events', f.A);
  ok('Audit actor A is recorded by database trigger', eventsA.some(e => e.action === 'license.created' && e.actor_id === f.users.aAdmin));
  ok('Client A cannot see audit from B', (await select(aClient, 'audit_events', f.B)).length === 0);
  const anonUrl = process.env.LAB04_LOCAL_SUPABASE_URL;
  const anonKey = process.env.LAB04_LOCAL_ANON_KEY;
  const unauth = await fetch(`${anonUrl}/rest/v1/licenses?select=id`, { headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` } });
  ok('Anonymous REST request does not return licensed records', unauth.status === 401 || unauth.status === 403 || (unauth.ok && (await unauth.json()).length === 0));
  console.log(`LOCAL_AUTH_MATRIX=${passed}_PASS_0_FAIL`);
}
try { await main(); }
catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
finally { if (f) await f.cleanup(); }
