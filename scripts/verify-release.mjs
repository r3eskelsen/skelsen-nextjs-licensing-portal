/** Offline public release inventory verification. No network or file writes. */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifest = resolve(root, 'RELEASE_MANIFEST_SHA256.csv');
if (!existsSync(manifest)) throw new Error('No release manifest found');
const lines = readFileSync(manifest, 'utf8').trim().split(/\r?\n/);
if (lines[0] !== 'path,sha256') throw new Error('Unexpected manifest header');
let count = 0;
for (const line of lines.slice(1)) {
  const comma = line.lastIndexOf(',');
  if (comma < 1) throw new Error('Malformed manifest row');
  const rel = line.slice(0, comma);
  const expected = line.slice(comma + 1);
  const abs = resolve(root, rel);
  if (relative(root, abs).startsWith('..') || abs === root) throw new Error('Unsafe manifest path');
  const actual = createHash('sha256').update(readFileSync(abs)).digest('hex');
  if (actual !== expected) throw new Error(`HASH MISMATCH: ${rel}`);
  count += 1;
}
console.log(`PUBLIC_RELEASE_MANIFEST=PASS; VERIFIED_FILES=${count}`);
