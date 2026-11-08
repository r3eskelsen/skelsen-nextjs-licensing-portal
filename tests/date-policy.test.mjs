import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidIsoDate } from '../src/lib/date-policy.mjs';
test('accepts valid date and Gregorian leap day', () => {
  assert.equal(isValidIsoDate('2028-02-29'), true);
  assert.equal(isValidIsoDate('2027-12-31'), true);
});
test('rejects impossible and noncanonical date', () => {
  for (const date of ['2027-02-29','2027-02-30','2027-13-01','2027-04-31','0000-01-01','2027-1-1','2027-12-01T00:00:00Z']) {
    assert.equal(isValidIsoDate(date), false, date);
  }
});
