# Quick Free CV Builder

A free, privacy-first CV builder with no login, no paywall, no watermark, autosave, live preview, and PDF/JSON export.

## Overview
Quick Free CV Builder lets you create, edit, preview, import, and export CVs entirely in the browser. All data stays local in the browser storage unless you choose to download a file.

## What it includes
- Landing page with trust-first messaging
- Two-pane builder workspace with live preview
- Section reordering with drag-and-drop, keyboard shortcuts, and show/hide controls
- Autosave to localStorage
- Profile photo upload and preview
- Import support for JSON, TXT, PDF, DOCX, and image files
- Export support for JSON drafts and PDFs
- Classic, Modern, and Compact templates
- Standard and ATS preview modes
- Optional sections for certifications, volunteer work, awards, interests, and references

## Suggested final builds
If you want to ship a clean final release, the best build targets are:
1. **Classic Standard** — safest default for general users and printed CVs.
2. **ATS Mode** — monochrome, keyword-friendly export for recruiter systems.
3. **Compact Template** — best for longer CVs that need tighter spacing.
4. **Modern Template** — polished showcase view for portfolio-style presentation.

## Run locally
```bash
npm install
npm run dev
```

## Validate the production build
```bash
npm run build
npm run preview
```

## Deploy
This app is already configured for SPA deployment:
- `vercel.json`
- `public/_redirects`

Hosting settings:
- Build command: `npm run build`
- Output directory: `dist`

## Release notes and docs
- Launch note: `docs/launch-note.md`
- Launch checklist: `docs/launch-checklist.md`
- Deployment guide: `docs/deployment.md`

## GitHub
Repository: https://github.com/thadigitalguru/quick-free-cv-builder
