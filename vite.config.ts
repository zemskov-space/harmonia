import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: 'demo',
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@zemskov-space/harmonia/react': path.resolve(import.meta.dirname, 'src/react.ts'),
      '@zemskov-space/harmonia': path.resolve(import.meta.dirname, 'src/index.ts'),
    },
  },
});
