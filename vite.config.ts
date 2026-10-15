import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  base: '/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: 'archive-assets',
    target: 'es2022',
    sourcemap: false,
  },
});
