import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localeRoot = join(project, 'src/i18n/locales');
const arRoot = join(localeRoot, 'ar');
const sourceRoot = join(project, 'src');
const localeFiles = readdirSync(arRoot).filter((name) => name.endsWith('.json'));
const localeKeys = new Map();
const referenced = new Map();
const dynamicNamespaces = new Set();
const errors = [];

function flatten(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) visit(path);
    else if (/\.(?:ts|tsx)$/.test(entry.name)) scan(path);
  }
}
function scan(path) {
  const source = readFileSync(path, 'utf8');
  const namespaces = new Set();
  for (const match of source.matchAll(/useTranslation\s*\(([^)]*)\)/g)) {
    for (const ns of match[1].matchAll(/['"]([\w-]+)['"]/g)) namespaces.add(ns[1]);
  }
  if (!namespaces.size) return;
  const dynamic = /\bt\(\s*(?:[A-Za-z_$]|`)/.test(source);
  if (dynamic) for (const namespace of namespaces) dynamicNamespaces.add(namespace);
  const literals = [...source.matchAll(/\bt\(\s*(['"`])([^'"`$]+)\1/g)];
  for (const match of literals) {
    const raw = match[2];
    const colon = raw.indexOf(':');
    const explicitNamespace = colon > 0 ? raw.slice(0, colon) : null;
    const key = colon > 0 ? raw.slice(colon + 1) : raw;
    const candidates = explicitNamespace ? [explicitNamespace] : [...namespaces];
    const found = candidates.filter((namespace) => localeKeys.get(namespace)?.has(key));
    if (!found.length) errors.push(`${path}: translation key not found: ${raw}`);
    else for (const namespace of found) referenced.get(namespace)?.add(key);
  }
}

for (const file of localeFiles) {
  const namespace = file.replace(/\.json$/, '');
  try {
    const content = JSON.parse(readFileSync(join(arRoot, file), 'utf8'));
    localeKeys.set(namespace, new Set(flatten(content)));
    referenced.set(namespace, new Set());
  } catch (error) {
    errors.push(`${file}: invalid Arabic JSON (${error.message})`);
  }
}
visit(sourceRoot);
for (const namespace of localeKeys.keys()) {
  if (!namespaceMatchesNamespaceFile(namespace, localeFiles)) errors.push(`Missing Arabic locale file: ${namespace}.json`);
  if (dynamicNamespaces.has(namespace)) continue;
  for (const key of localeKeys.get(namespace)) {
    if (!referenced.get(namespace).has(key)) errors.push(`${namespace}.json: unused key ${key}`);
  }
}

function namespaceMatchesNamespaceFile(namespace, files) {
  return files.includes(`${namespace}.json`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Arabic-only i18n validation passed for ${localeFiles.length} namespaces.`);
}
