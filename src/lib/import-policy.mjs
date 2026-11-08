import { isValidIsoDate } from './date-policy.mjs';
export const MAX_CSV_BYTES = 64 * 1024;
export const MAX_CSV_ROWS = 100;
export const ALLOWED_HEADERS = ['organization_id', 'name', 'expires_on'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateCsv(text, organizationId) {
  if (typeof text !== 'string' || Buffer.byteLength(text, 'utf8') > MAX_CSV_BYTES) throw Error('CSV size exceeded');
  if (typeof organizationId !== 'string' || !UUID.test(organizationId)) throw Error('Invalid organization ID');
  // Deliberately support a constrained, unquoted subset of CSV only.
  const lines = text.replace(/\r\n/g, '\n').trim().split('\n');
  if (lines.length < 2 || lines.length - 1 > MAX_CSV_ROWS) throw Error('CSV row count invalid');
  if (lines[0] !== ALLOWED_HEADERS.join(',')) throw Error('Unexpected CSV headers');
  return lines.slice(1).map((line) => {
    const items = line.split(',');
    if (items.length !== 3) throw Error('Unsupported CSV row');
    const [org, name, expiry] = items.map(s => s.trim());
    if (org.toLowerCase() !== organizationId.toLowerCase()) throw Error('Cross-tenant row denied');
    if (!/^[a-zA-Z0-9 ._()-]{1,80}$/.test(name)) throw Error('Invalid license name');
    if (!isValidIsoDate(expiry)) throw Error('Invalid date');
    return { organization_id: organizationId, name, expires_on: expiry };
  });
}
