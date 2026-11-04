import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from '@/app/router';
import { AppProviders } from '@/app/providers';
import { AppErrorBoundary } from '@/app/AppErrorBoundary';
import '@fontsource/inter/400.css';
import '@fontsource/inter/700.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@/styles/index.css';
import { captureAttribution } from '@/lib/attribution';

const CHUNK_RELOAD_KEY = 'passion:chunk-reload-at';
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
    if (lastReload && Date.now() - lastReload < 60_000) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    window.location.reload();
  } catch {
    // If browser storage is unavailable, let the app error boundary show its retry action.
  }
});
captureAttribution();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('The app root element is missing.');

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppErrorBoundary>
        <AppRouter />
      </AppErrorBoundary>
    </AppProviders>
  </StrictMode>,
);
