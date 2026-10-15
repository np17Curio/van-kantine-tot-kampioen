import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // Altijd dezelfde poort: de opslag (localStorage) hoort bij het adres, dus op 5174 zou je een andere carrière zien.
  // Is 5173 nog bezet (een oude dev-server), dan stopt Vite met een melding in plaats van stilletjes 5174 te kiezen.
  server: { port: 5173, strictPort: true, open: true },
  preview: { port: 4173, strictPort: true },
  // three.js (het 3D-veld) is een losse chunk van ruim 500 kB die pas laadt als je een wedstrijd speelt
  build: { chunkSizeWarningLimit: 750 },
});
