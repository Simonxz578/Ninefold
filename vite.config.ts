import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  cacheDir: '.vite-cache',
  plugins: [react()],
  build: {
    target: 'es2022',
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    restoreMocks: true,
  },
});
