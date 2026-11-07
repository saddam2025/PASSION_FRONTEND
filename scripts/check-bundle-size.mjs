import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';

const root = process.cwd();
const manifestPath = resolve(root, 'dist/.vite/manifest.json');
const limitKb = 250 * 1.15;
if (!existsSync(manifestPath)) {
  console.error('Bundle check failed: build manifest is missing.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entry = Object.values(manifest).find((item) => item.isEntry && item.file.endsWith('.js'));
if (!entry) {
  console.error('Bundle check failed: JavaScript application entry is missing from the manifest.');
  process.exit(1);
}

const visited = new Set();
const visit = (item) => {
  if (visited.has(item.file)) return;
  visited.add(item.file);
  for (const key of item.imports ?? []) if (manifest[key]) visit(manifest[key]);
};
visit(entry);
const bytes = [...visited].reduce((total, file) => total + gzipSync(readFileSync(resolve(root, 'dist', file))).byteLength, 0);
const sizeKb = bytes / 1024;
console.log(`Initial shell JavaScript (gzip): ${sizeKb.toFixed(1)} KB; budget ${limitKb.toFixed(1)} KB (250 KB + 15%).`);
if (sizeKb > limitKb) {
  console.error('Bundle check failed: initial shell JavaScript is more than 15% over budget.');
  process.exit(1);
}
