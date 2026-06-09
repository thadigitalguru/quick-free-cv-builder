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
        manualChunks(id) {
          for (const [match, chunkName] of heavyPdfChunks) {
            if (id.includes(`node_modules/${match}`)) return chunkName;
          }
        },
      },
    },
  },
});
