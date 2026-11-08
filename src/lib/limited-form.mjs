/**
 * Read multipart data with a bounded request body before invoking formData().
 * Protects local demo against unbounded multipart buffering. The body bound
 * includes multipart headers and boundaries; the CSV file has a lower bound.
 */
export const MAX_MULTIPART_BYTES = 96 * 1024;
export class PayloadTooLargeError extends Error {}
export class UnsupportedMediaTypeError extends Error {}

export async function parseBoundedMultipart(request) {
  const contentType = request.headers.get('content-type') ?? '';
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !/boundary=/i.test(contentType)) {
    throw new UnsupportedMediaTypeError('Expected multipart/form-data');
  }
  const claimedLength = request.headers.get('content-length');
  if (claimedLength && Number.isFinite(Number(claimedLength)) && Number(claimedLength) > MAX_MULTIPART_BYTES) {
    throw new PayloadTooLargeError('Multipart request exceeded limit');
  }
  if (!request.body) throw new Error('Empty body');
  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_MULTIPART_BYTES) {
        await reader.cancel();
        throw new PayloadTooLargeError('Multipart request exceeded limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const joined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  const boundedRequest = new Request('http://127.0.0.1/local-import', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body: joined
  });
  return boundedRequest.formData();
}
