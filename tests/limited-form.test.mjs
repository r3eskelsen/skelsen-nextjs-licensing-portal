import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBoundedMultipart, PayloadTooLargeError, UnsupportedMediaTypeError, MAX_MULTIPART_BYTES } from '../src/lib/limited-form.mjs';
const make = (n) => {
  const data = new FormData();
  data.set('organization_id', '11111111-1111-4111-8111-111111111111');
  data.set('file', new File([new Uint8Array(n)], 'licenses.csv', { type: 'text/csv' }));
  return new Request('http://127.0.0.1/api/import', { method: 'POST', body: data });
};
test('bounded multipart safely parses a small file', async () => {
  const parsed = await parseBoundedMultipart(make(100));
  assert.equal(parsed.get('file').size, 100);
});
test('oversized multipart is rejected before formData buffering', async () => {
  await assert.rejects(parseBoundedMultipart(make(MAX_MULTIPART_BYTES + 5)), PayloadTooLargeError);
});
test('non-multipart content is rejected', async () => {
  const request = new Request('http://127.0.0.1/api/import', { method: 'POST', body: 'hello' });
  await assert.rejects(parseBoundedMultipart(request), UnsupportedMediaTypeError);
});
