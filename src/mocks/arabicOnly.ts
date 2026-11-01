export function clearEnglishContent<T>(value: T): T {
  if (Array.isArray(value)) {
    value.forEach((item) => clearEnglishContent(item));
    return value;
  }
  if (!value || typeof value !== 'object') return value;
  for (const [key, child] of Object.entries(value)) {
    const record = value as Record<string, unknown>;
    if (key === 'en') record[key] = Array.isArray(child) ? [] : '';
    else clearEnglishContent(child);
  }
  return value;
}
