import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261105000100_initial.sql', import.meta.url), 'utf8');
const privacy = readFileSync(new URL('../supabase/migrations/20261108000100_membership_visibility.sql', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const required = ['organizations','memberships','licenses','documents','renewals','audit_events'];
test('RLS declared on all six tenant tables', () => required.forEach(name => assert.match(sql, new RegExp(`alter table public\\.${name} enable row level security`))));
test('writes are default-deny except scoped license writes', () => { assert.match(sql, /license_insert.*has_org_role/); assert.doesNotMatch(sql, /create policy member_insert/); assert.doesNotMatch(sql, /create policy audit_insert/); });
test('cross-organization foreign keys enforced', () => ['documents_same_org_fk','renewals_same_org_fk','audit_same_org_fk'].forEach(name => assert.ok(sql.includes(name))));
test('additive migration restricts membership visibility to auth.uid', () => {
  assert.match(privacy, /drop policy if exists member_select on public\.memberships/);
  assert.match(privacy, /using \(user_id = \(select auth\.uid\(\)\)\)/);
});
test('dashboard requests only the authenticated user membership', () => {
  assert.match(dashboard, /\.eq\('user_id', user\.id\)/);
  assert.match(dashboard, /writable\.length > 0/);
  assert.match(dashboard, /Read-only access/);
});
