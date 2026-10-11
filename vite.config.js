import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { open: true },
  // three.js (het 3D-veld) is een losse chunk van ruim 500 kB die pas laadt als je een wedstrijd speelt
  build: { chunkSizeWarningLimit: 750 },
});
