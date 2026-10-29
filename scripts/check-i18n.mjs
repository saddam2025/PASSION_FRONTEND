import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { error, log } from 'node:console';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src/i18n/locales');
const english = new Set(readdirSync(join(root, 'en')).filter((file) => file.endsWith('.json')));
const arabic = new Set(readdirSync(join(root, 'ar')).filter((file) => file.endsWith('.json')));
const namespaces = new Set([...english, ...arabic]);
let failures = 0;

function keys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
}

for (const file of namespaces) {
  if (!english.has(file) || !arabic.has(file)) {
    error(`Missing locale file: ${file}`); failures += 1; continue;
  }
  const en = JSON.parse(readFileSync(join(root, 'en', file), 'utf8'));
  const ar = JSON.parse(readFileSync(join(root, 'ar', file), 'utf8'));
  const enKeys = new Set(keys(en)); const arKeys = new Set(keys(ar));
  const missingEn = [...arKeys].filter((key) => !enKeys.has(key));
  const missingAr = [...enKeys].filter((key) => !arKeys.has(key));
  if (missingEn.length || missingAr.length) {
    error(`${file}: missing EN [${missingEn.join(', ')}], missing AR [${missingAr.join(', ')}]`); failures += 1;
  }
}
if (failures) process.exitCode = 1;
else log(`i18n key parity passed for ${namespaces.size} namespaces.`);
