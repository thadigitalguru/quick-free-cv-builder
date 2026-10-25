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
4. Keep `public/_redirects` (SPA routes, and a 404 for missing assets) and `public/_headers` (security policy and caching).

## After deploying, check the headers
```bash
curl -sI https://YOUR-DOMAIN/ | grep -iE 'content-security-policy|cache-control'
curl -sI https://YOUR-DOMAIN/assets/does-not-exist.js | head -1   # must be 404, not 200
```
The policy must include `connect-src 'self'`; that is what guarantees CV content never leaves the browser.

## Local verification
```bash
npm install
npm run build
npm run preview
```
