import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const actorState = vi.hoisted(() => ({ role: 'admin' as 'admin'|'assistant' }));
vi.mock('@/services/auth.mock', () => ({ mockAuthService: { getCurrentUser: vi.fn(async () => actorState.role === 'admin' ? { id: 'user-admin-001', name: { ar:'مدير', en:'' }, email:'admin@example.test', role:'admin', permissions:[] } : { id:'user-assistant-001', name:{ar:'مساعد',en:''}, email:'assistant@example.test', role:'assistant', permissions:[] }) } }));

import { coursesService } from './service';
import { readCourses, resetCourses } from './storage';

const values = new Map<string,string>();
const storage = {
  getItem: (key:string) => values.get(key) ?? null,
  setItem: (key:string,value:string) => values.set(key,value),
  removeItem: (key:string) => values.delete(key),
  clear: () => values.clear(),
  key: (index:number) => [...values.keys()][index] ?? null,
  get length() { return values.size; },
};

describe('Slice 4A saveDraft permissions and slug persistence', () => {
  beforeEach(() => { values.clear(); vi.stubGlobal('window',{localStorage:storage}); actorState.role='admin'; resetCourses(); });
  afterEach(() => vi.unstubAllGlobals());

  it('blocks an Assistant from changing accreditation verification in the service', async () => {
    const created = await coursesService.create({ title:{ar:'كورس اختبار',en:''}, category:'اختبار', slug:'slice-four-a-permission', template:'blank' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    actorState.role='assistant';
    const modified = structuredClone(created.data.draft);
    modified.details.accreditation.verifiedByAcademy = true;
    const saved = await coursesService.saveDraft(created.data.id, modified, created.data.version);
    expect(saved).toMatchObject({ ok:false, code:'FORBIDDEN' });
    expect(readCourses().find((course)=>course.id===created.data.id)?.draft.details.accreditation.verifiedByAcademy).toBe(false);
  });

  it('allows Admin verification and keeps the previous public slug in history', async () => {
    const created = await coursesService.create({ title:{ar:'كورس اختبار',en:''}, category:'اختبار', slug:'slice-four-a-slug-old', template:'blank' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const modified = structuredClone(created.data.draft);
    modified.details.accreditation.verifiedByAcademy = true;
    modified.details.slug = 'slice-four-a-slug-new';
    const saved = await coursesService.saveDraft(created.data.id, modified, created.data.version);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.data.slug).toBe('slice-four-a-slug-new');
    expect(saved.data.slugHistory).toContain('slice-four-a-slug-old');
    expect(saved.data.draft.details.accreditation.verifiedByAcademy).toBe(true);
  });

  it('refuses reserved or duplicate slugs before persisting a draft', async () => {
    const created = await coursesService.create({ title:{ar:'كورس اختبار',en:''}, category:'اختبار', slug:'slice-four-a-slug-check', template:'blank' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const modified = structuredClone(created.data.draft);
    modified.details.slug = 'admin';
    const result = await coursesService.saveDraft(created.data.id, modified, created.data.version);
    expect(result).toMatchObject({ok:false,code:'VALIDATION_ERROR'});
    expect(readCourses().find((course)=>course.id===created.data.id)?.slug).toBe('slice-four-a-slug-check');
  });
});
