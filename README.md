# Quick Free CV Builder

Quick Free CV Builder is a privacy-first, no-signup CV editor with live preview and PDF export.

## Features
- Landing page with free/trust messaging
- Builder with editable sections and live preview
- Local autosave in browser storage
- Reorder and hide/show sections
- Duplicate, clear, and reset sections
- Export / import JSON drafts
- ATS-friendly preview mode
- Profile photo upload
- Export to PDF via browser print flow

## Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Deploy
The app is configured for SPA hosting with:
- `vercel.json`
- `public/_redirects`

This supports direct refreshes on `/builder` and other client routes.
