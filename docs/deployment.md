# Deployment Guide

## Vercel
1. Import the GitHub repo.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy.

## Netlify
1. Import the GitHub repo.
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Keep `public/_redirects` to support SPA routes.

## Local verification
```bash
npm install
npm run build
npm run preview
```
