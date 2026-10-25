import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const heavyPdfChunks = new Map([
  ['html2pdf.js', 'pdf-export'],
  ['html2canvas', 'pdf-canvas'],
  ['jspdf', 'pdf-js'],
  ['pdfjs-dist', 'pdf-import'],
  ['mammoth', 'docx-import'],
]);

export default defineConfig({
  plugins: [react()],
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
