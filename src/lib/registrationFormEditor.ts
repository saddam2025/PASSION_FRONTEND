import type { RegistrationField } from '@/schemas/registrationForm';

export function moveRegistrationField(fields: RegistrationField[], from: number, to: number): RegistrationField[] {
  if (from < 0 || to < 0 || from >= fields.length || to >= fields.length || from === to) return fields;
  const next = [...fields];
  const [field] = next.splice(from, 1);
  if (!field) return fields;
  next.splice(to, 0, field);
  return next;
}

export function createRegistrationFieldId(): string {
  return `custom-${crypto.randomUUID().slice(0, 12)}`;
}

export function createRegistrationOptionId(): string {
  return `option-${crypto.randomUUID()}`;
}
