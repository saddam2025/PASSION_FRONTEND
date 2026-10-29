import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouter } from '@/app/router';
import { AppProviders } from '@/app/providers';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@/styles/index.css';
import { captureAttribution } from '@/lib/attribution';

captureAttribution();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('The app root element is missing.');

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>,
);
