import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/preload/preload.ts',
      fileName: () => 'preload.js',
      formats: ['cjs'],
    },
    outDir: 'dist/preload',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron'],
    },
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
