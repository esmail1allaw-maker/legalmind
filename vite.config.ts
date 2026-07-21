/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string };
const versionCode = String(Math.round(Number(pkg.version.split('.')[0]) * 100 + Number(pkg.version.split('.')[1] ?? 0) * 10 + Number(pkg.version.split('.')[2] ?? 0)));

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_APP_VERSION_CODE': JSON.stringify(versionCode)
  },
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor';
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (id.includes('node_modules/@tanstack/react-query')) return 'query';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (id.includes('html2pdf')) return 'pdfExport';
          if (id.includes('node_modules/xlsx')) return 'xlsx';
          if (id.includes('node_modules/jszip')) return 'jszip';
        }
      }
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
