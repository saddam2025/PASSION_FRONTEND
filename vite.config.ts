import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  return {
    plugins: [react(), visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, open: false })],
    build: {
      manifest: true,
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
            if (id.includes('node_modules/react-router')) return 'vendor-router';
            if (id.includes('node_modules/@tanstack')) return 'vendor-query';
            if (id.includes('node_modules/@radix-ui')) return 'vendor-radix';
            if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
            // Keep charting dependencies in the lazily loaded overview chart route,
            // rather than promoting them into the application entry chunk.
            if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror')) return 'vendor-editor';
            if (id.includes('node_modules/@dnd-kit')) return 'vendor-dnd';
            if (id.includes('node_modules/date-fns') || id.includes('node_modules/react-day-picker')) return 'vendor-dates';
          },
        },
      },
    },
    resolve: { alias: { '@': resolve(rootDir, 'src') } },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  };
});
