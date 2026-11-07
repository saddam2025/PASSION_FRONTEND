/* global window, document */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve, sep } from 'node:path';

const root = process.cwd();
const baseUrl = process.env.PERF_URL ?? 'http://127.0.0.1:4173';
const label = process.env.PERF_LABEL ?? 'AFTER';
const preview = spawn(process.execPath, [resolve(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { cwd: root, stdio: 'ignore', windowsHide: true });
const user = (role) => ({ id: `perf-${role}`, name: { ar: role === 'admin' ? 'مسؤول تجريبي' : 'مساعد تجريبي' }, email: `perf-${role}@example.invalid`, role });
const time = new Date().toISOString();
const course = {
  id: 'perf-course', slug: 'perf-course', slugHistory: [], status: 'draft', featured: false, createdBy: 'perf-admin',
  createdAt: time, updatedAt: time, version: 1, published: null,
  draft: {
    details: { title: { ar: 'كورس تجريبي', en: '' }, shortDescription: { ar: 'وصف تجريبي', en: '' }, category: 'تدريب', instructor: { name: { ar: 'مدرب تجريبي', en: '' } }, coverImage: { src: '/images/course-cover-default.webp', alt: { ar: 'غلاف', en: '' }, decorative: false }, delivery: { method: 'online' }, schedule: {}, pricing: { price: 50000, currency: 'EGP' }, enrollment: { registrationOpen: false }, accreditation: {} },
    page: { schemaVersion: 1, sections: [] }, form: { fields: [] }, seo: {},
  },
};
const emptyPage = { items: [], total: 0, page: 1, pageSize: 25, pageCount: 1 };
const overview = { totalRegistrations: 0, registrations: 0, paid: 0, unpaid: 0, netRevenue: 0, revenueByCurrency: [], courses: [] };
const charts = { range: { from: '2026-11-01', to: '2026-11-07', granularity: 'day' }, registrationsSeries: [], revenueSeriesByCurrency: [], netRevenueByCurrency: [], funnel: { registered: 0, contacted: 0, awaitingPayment: 0, paid: 0, cancelled: 0 }, paymentStatusDistribution: [], byCourse: [] };
let currentRole = 'admin';
let loggedIn = false;

function apiResponse(path, method) {
  if (path.endsWith('/auth/csrf')) return { status: 200, body: { csrfToken: 'perf-test-csrf-token' } };
  if (path.endsWith('/auth/login') && method === 'POST') { loggedIn = true; return { status: 200, body: { user: user(currentRole) } }; }
  if (path.endsWith('/auth/me') || path.endsWith('/auth/refresh')) return loggedIn ? { status: 200, body: { user: user(currentRole) } } : { status: 401, body: { error: { code: 'UNAUTHENTICATED', message: 'Unauthenticated' } } };
  if (path.endsWith('/settings/public')) return { status: 200, body: { academyName: { ar: 'أكاديمية تجريبية' }, logo: '/images/academy-logo.png', logoKey: '/images/academy-logo.png', favicon: '/images/favicon.png', whatsappNumber: '', email: '', phone: '', contact: {}, seoDefaults: {}, socialLinks: {} } };
  if (path.endsWith('/settings')) return { status: 200, body: { version: 1, academy: {}, contact: {}, social: {}, messaging: {}, registration: {}, legal: {}, seo: {} } };
  if (path.endsWith('/admin/overview/charts')) return { status: 200, body: charts };
  if (path.includes('/admin/overview')) return { status: 200, body: overview };
  if (path.endsWith('/categories/public')) return { status: 200, body: { items: [] } };
  if (path.endsWith('/courses/perf-course')) return { status: 200, body: { course } };
  if (path.includes('/courses?') || path.endsWith('/courses')) return { status: 200, body: emptyPage };
  if (path.endsWith('/enrollments/filters')) return { status: 200, body: { courses: [] } };
  if (path.includes('/enrollments?') || path.endsWith('/enrollments')) return { status: 200, body: emptyPage };
  if (path.includes('/users?') || path.endsWith('/users')) return { status: 200, body: emptyPage };
  return { status: 200, body: emptyPage };
}

async function waitReady() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try { const response = await fetch(baseUrl); if (response.ok) return; } catch { /* preview is starting */ }
    await delay(150);
  }
  throw new Error('vite preview did not become ready');
}
async function main() {
  if (!existsSync(resolve(root, 'dist/index.html'))) throw new Error('Run npm run build before npm run perf.');
  await waitReady();
  const browser = await chromium.launch({ channel: process.env.PERF_BROWSER ?? 'chrome', headless: true });
  const results = [];
  const consoleErrors = [];
  const screenshotDir = resolve(root, '..', 'docs', 'perf', 'screenshots');
  mkdirSync(screenshotDir, { recursive: true });
  const profiles = [
    { name: 'desktop', viewport: { width: 1440, height: 1000 }, mobile: false },
    { name: 'mobile-375', viewport: { width: 375, height: 812 }, mobile: true },
  ];
  const paths = [
    { role: 'admin', path: '/admin', label: 'Admin overview' },
    { role: 'admin', path: '/admin/courses', label: 'Courses' },
    { role: 'admin', path: '/admin/courses/perf-course/studio/page', label: 'Course studio' },
    { role: 'admin', path: '/admin/registrations', label: 'Admin registrations (route equivalent for requested /admin/leads)' },
    { role: 'admin', path: '/admin', label: 'Admin analytics (analytics are part of overview; /admin/analytics is not a registered route)' },
    { role: 'admin', path: '/admin/settings', label: 'Settings' },
    { role: 'assistant', path: '/assistant/registrations', label: 'Assistant registrations (the /assistant entry redirects here)' },
  ];
  try {
    for (const profile of profiles) {
      for (const role of ['admin', 'assistant']) {
        currentRole = role;
        loggedIn = false;
        const coldContext = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: profile.mobile ? 2 : 1, isMobile: profile.mobile, hasTouch: profile.mobile });
        const coldPage = await coldContext.newPage();
        await coldPage.route('**/api/**', async (route) => {
          const request = route.request();
          const parsedUrl = new URL(request.url());
          const result = apiResponse(parsedUrl.pathname, request.method());
          await route.fulfill({ status: result.status, contentType: 'application/json', body: JSON.stringify(result.body) });
        });
        await coldPage.goto(new URL(role === 'admin' ? '/admin' : '/assistant/registrations', baseUrl).href, { waitUntil: 'domcontentloaded' });
        await coldPage.locator('#boot-splash').waitFor({ state: 'visible', timeout: 3000 });
        await coldPage.screenshot({ path: resolve(screenshotDir, `cold-load-${role}-${profile.name}.png`), fullPage: false });
        await coldContext.close();
      }
      for (const target of paths) {
        currentRole = target.role;
        loggedIn = false;
        const context = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: profile.mobile ? 2 : 1, isMobile: profile.mobile, hasTouch: profile.mobile });
        const page = await context.newPage();
        page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(`${target.role} ${target.path}: ${message.text()}`); });
        page.on('pageerror', (error) => consoleErrors.push(`${target.role} ${target.path}: ${error.message}`));
        await page.route('**/api/**', async (route) => {
          const request = route.request();
          const url = new URL(request.url());
          const result = apiResponse(url.pathname, request.method());
          await route.fulfill({ status: result.status, contentType: 'application/json', body: JSON.stringify(result.body) });
        });
        await page.addInitScript(() => {
          (window).__perfVitals = {};
          new PerformanceObserver((list) => { for (const item of list.getEntries()) if (item.entryType === 'largest-contentful-paint') (window).__perfVitals.lcp = item.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
        });
        if (profile.mobile) {
          const cdp = await context.newCDPSession(page);
          await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
          await cdp.send('Network.enable');
          await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 50, downloadThroughput: 500_000, uploadThroughput: 375_000, connectionType: 'cellular4g' });
          await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        }
        await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
        await page.locator('#login-email').fill(`perf-${target.role}@example.invalid`);
        await page.locator('#login-password').fill('perf-only-not-a-real-account');
        await page.getByRole('button', { name: /دخول|متابعة|تسجيل الدخول|دخول آمن/ }).click();
        await page.waitForURL((url) => url.pathname.startsWith('/admin') || url.pathname.startsWith('/assistant'), { timeout: 10_000 });
        const start = Date.now();
        await page.goto(new URL(target.path, baseUrl).href, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => {
          const main = document.querySelector('#dashboard-main');
          if (!main) return false;
          return Boolean(main.querySelector('h1, h2, [role="alert"]')) && !main.querySelector('.animate-pulse');
        }, { timeout: 15_000 }).catch(() => {});
        const visibleMs = Date.now() - start;
        const nav = await page.evaluate(() => performance.getEntriesByType('navigation')[0]);
        const vitals = await page.evaluate(() => ({ fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null, lcp: (window).__perfVitals.lcp ?? null }));
        const resources = await page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => /\.js(?:\?|$)/.test(entry.name)).map((entry) => entry.name));
        const jsFiles = [...new Set(resources.map((entry) => new URL(entry).pathname).filter((path) => path.startsWith('/assets/')))];
        const gzipJsBytes = jsFiles.reduce((sum, path) => { const file = resolve(root, 'dist', `.${path.replaceAll('/', sep)}`); return sum + (existsSync(file) ? gzipSync(readFileSync(file)).byteLength : 0); }, 0);
        const requestCount = await page.evaluate(() => performance.getEntriesByType('resource').length + performance.getEntriesByType('navigation').length);
        results.push({ profile: profile.name, role: target.role, route: target.path, label: target.label, ttfbMs: Math.round(nav?.responseStart ?? 0), fcpMs: vitals.fcp === null ? null : Math.round(vitals.fcp), lcpMs: vitals.lcp === null ? null : Math.round(vitals.lcp), contentMs: visibleMs, gzipJsKb: +(gzipJsBytes / 1024).toFixed(1), requests: requestCount });
        await context.close();
      }
      currentRole = 'admin';
      loggedIn = false;
      const navContext = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: profile.mobile ? 2 : 1, isMobile: profile.mobile, hasTouch: profile.mobile });
      const navPage = await navContext.newPage();
      navPage.on('pageerror', (error) => consoleErrors.push(`navigation ${profile.name}: ${error.message}`));
      await navPage.route('**/api/**', async (route) => {
        const request = route.request();
        const parsedUrl = new URL(request.url());
        const result = apiResponse(parsedUrl.pathname, request.method());
        await route.fulfill({ status: result.status, contentType: 'application/json', body: JSON.stringify(result.body) });
      });
      await navPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await navPage.locator('#login-email').fill('perf-admin@example.invalid');
      await navPage.locator('#login-password').fill('perf-only-not-a-real-account');
      await navPage.getByRole('button', { name: /دخول|متابعة|تسجيل الدخول|دخول آمن/ }).click();
      await navPage.waitForURL((url) => url.pathname.startsWith('/admin'), { timeout: 10_000 });
      await navPage.goto(new URL('/admin/courses', baseUrl).href, { waitUntil: 'domcontentloaded' });
      await navPage.waitForFunction(() => Boolean(document.querySelector('#dashboard-main h1, #dashboard-main h2')) && !document.querySelector('#dashboard-main .animate-pulse'), { timeout: 15_000 });
      const destination = navPage.locator('a[href="/admin/registrations"]').first();
      await destination.hover();
      await destination.focus();
      const transitionStart = Date.now();
      await destination.click();
      await navPage.screenshot({ path: resolve(screenshotDir, `route-change-admin-${profile.name}.png`), fullPage: false });
      await navPage.waitForFunction(() => Boolean(document.querySelector('#dashboard-main h1, #dashboard-main h2')) && !document.querySelector('#dashboard-main .animate-pulse'), { timeout: 15_000 });
      const transitionMs = Date.now() - transitionStart;
      console.log(`${profile.name} | admin | /admin/courses -> /admin/registrations (prefetched) | content ${transitionMs} ms`);
      await navContext.close();
    }
    console.log(`\n${label} — production preview metrics (all API responses are mocked in the browser; no backend/database data used)`);
    console.log('Profile | Role | Route | TTFB ms | FCP ms | LCP ms | Content ms | JS gzip KB | Requests');
    for (const item of results) console.log(`${item.profile} | ${item.role} | ${item.route} | ${item.ttfbMs} | ${item.fcpMs ?? 'n/a'} | ${item.lcpMs ?? 'n/a'} | ${item.contentMs} | ${item.gzipJsKb} | ${item.requests}`);
    if (consoleErrors.length) { console.error('\nBrowser console errors:', consoleErrors.join('\n')); process.exitCode = 1; }
  } finally {
    await browser.close();
    preview.kill();
  }
}
main().catch((error) => { console.error(`perf failed: ${error.message}`); preview.kill(); process.exitCode = 1; });
