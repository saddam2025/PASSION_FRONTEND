import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const actorState = vi.hoisted(() => ({ role: 'admin' as 'admin' | 'assistant' }));
vi.mock('@/services/auth.mock', () => ({ mockAuthService: { getCurrentUser: vi.fn(async () => actorState.role === 'admin' ? ({ id:'user-admin-001', name:{ar:'مدير',en:''}, email:'admin@example.test', role:'admin', permissions:[] }) : ({ id:'user-assistant-001', name:{ar:'مساعد',en:''}, email:'assistant@example.test', role:'assistant', permissions:[] })) } }));
import { coursesService } from './service';
import { COURSES_STORAGE_KEY, readCourses, resetCourses } from './storage';
const values = new Map<string,string>();
const storage = { getItem:(key:string)=>values.get(key)??null, setItem:(key:string,value:string)=>values.set(key,value), removeItem:(key:string)=>values.delete(key), clear:()=>values.clear(), key:(index:number)=>[...values.keys()][index]??null, get length(){return values.size;} };
async function code<T>(promise:Promise<{ok:true;data:T}|{ok:false;code:string}>){const result=await promise;return result.ok?'OK':result.code;}
describe('courses service under Scope V1',()=>{
  beforeEach(()=>{values.clear();vi.stubGlobal('window',{localStorage:storage});actorState.role='admin';resetCourses();});
  afterEach(()=>vi.unstubAllGlobals());
  it('creates an Admin draft with a selected template and persists optimistic edits',async()=>{
    const created=await coursesService.create({title:{ar:'كورس اختبار',en:''},category:'إدارة',slug:'scope-v1-course',template:'short'});
    expect(created.ok).toBe(true); if(!created.ok)return;
    expect(created.data.status).toBe('draft'); expect(created.data.draft.page.sections.length).toBeGreaterThan(0); expect(values.has(COURSES_STORAGE_KEY)).toBe(true);
    const snapshot={...created.data.draft,details:{...created.data.draft.details,shortDescription:{ar:'وصف محفوظ',en:''}}};
    const saved=await coursesService.saveDraft(created.data.id,snapshot,created.data.version);
    expect(saved.ok).toBe(true); if(saved.ok){expect(saved.data.version).toBe(created.data.version+1);expect(readCourses().find((item)=>item.id===created.data.id)?.draft.details.shortDescription.ar).toBe('وصف محفوظ');}
  });
  it('refuses all course and studio access to an Assistant',async()=>{
    actorState.role='assistant';
    expect(await code(coursesService.list())).toBe('FORBIDDEN'); expect(await code(coursesService.get('course-seed-001'))).toBe('FORBIDDEN');
    expect(await code(coursesService.create({title:{ar:'كورس',en:''},category:'إدارة',slug:'assistant-course'}))).toBe('FORBIDDEN');
    expect(await code(coursesService.publish('course-seed-001'))).toBe('FORBIDDEN');
  });
  it('publishes directly after readiness and edits only the draft until publish changes',async()=>{
    const before=readCourses().find((item)=>item.id==='course-seed-001')!;
    const draft={...before.draft,details:{...before.draft.details,shortDescription:{ar:'تعديل غير منشور',en:''}}};
    const saved=await coursesService.saveDraft(before.id,draft,before.version); expect(saved.ok).toBe(true); if(!saved.ok)return;
    expect(saved.data.published?.details.shortDescription.ar).not.toBe('تعديل غير منشور');
    const published=await coursesService.publish(before.id,saved.data.version); expect(published.ok).toBe(true); if(published.ok)expect(published.data.published?.details.shortDescription.ar).toBe('تعديل غير منشور');
  });
  it('unpublishes while retaining the snapshot, archives/restores, and soft-deletes only for Admin',async()=>{
    const unpublished=await coursesService.unpublish('course-seed-001'); expect(unpublished.ok).toBe(true); if(!unpublished.ok)return;
    expect(unpublished.data.status).toBe('draft'); expect(unpublished.data.published).not.toBeNull(); expect((await coursesService.getPublishedBySlug(unpublished.data.slug)).ok).toBe(false);
    const archived=await coursesService.archive(unpublished.data.id,unpublished.data.version); expect(archived.ok).toBe(true); if(!archived.ok)return;
    const restored=await coursesService.unarchive(archived.data.id,archived.data.version); expect(restored.ok&&restored.data.status).toBe('published');
    const removed=await coursesService.remove(archived.data.id); expect(removed.ok).toBe(true); expect(readCourses().find((item)=>item.id===archived.data.id)?.deletedAt).toBeTruthy();
  });
});
