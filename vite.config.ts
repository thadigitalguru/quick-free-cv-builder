import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `vite preview` sends the production security headers from vercel.json, so local runs and the
// end-to-end tests exercise the real Content Security Policy.
const productionHeaders = Object.fromEntries(
  (JSON.parse(readFileSync(new URL('./vercel.json', import.meta.url), 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] }).headers
    .find((rule) => rule.source === '/(.*)')!
    .headers.map(({ key, value }) => [key, value]),
);

const heavyPdfChunks = new Map([
  ['html2pdf.js', 'pdf-export'],
  ['html2canvas', 'pdf-canvas'],
  ['jspdf', 'pdf-js'],
  ['pdfjs-dist', 'pdf-import'],
  ['mammoth', 'docx-import'],
]);

export default defineConfig({
  plugins: [react()],
  preview: { headers: productionHeaders },
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            // Vite's tiny dynamic-import helper is shared by every chunk. Grouped with jsPDF (as
            // manualChunks did), it made each first visit download the 400 kB PDF library up front.
            { name: 'preload-helper', test: /vite\/preload-helper/, priority: 20 },
            ...[...heavyPdfChunks].map(([match, name]) => ({ name, test: new RegExp(`node_modules[\\\\/]${match.replace('.', '\\.')}[\\\\/]`), priority: 10 })),
          ],
        },
      },
    },
  },
});
