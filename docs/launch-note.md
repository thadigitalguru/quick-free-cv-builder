# Quick Free CV Builder — Launch Note

Quick Free CV Builder is a free, privacy-first CV builder with no sign-up, no paywall, no watermark, and no backend. Live at https://quick-free-cv-builder.vercel.app

## What ships
- **Builder:** two-pane editor with live preview, drag-and-drop section order, show/hide sections, inline guidance and validation, and undo for deletes and clears.
- **Templates:** Classic, Modern and Compact, plus an ATS mode (monochrome, single column, selectable text).
- **Export:** searchable A4 PDFs with clickable links, accented names and a live page count that matches the file. Print / Save as PDF covers any script or emoji. JSON backups keep every field and the chosen template. PDFs save properly on iPhone and iPad.
- **Import:** PDF (including two-column and Chrome-printed CVs), DOCX, TXT and JSON, parsed on the device with a review step before anything is saved. Text that can't be placed is shown so it can be copied, and nothing is invented.
- **Saving:** autosave that warns if browser storage is full, protection against two tabs overwriting each other, crash and stale-deploy recovery, and a shared-computer mode that keeps the CV only in the tab.
- **Privacy:** enforced by the Content Security Policy (no request can leave the app), no analytics and no AI. "Import details" for bug reports contain structure only, never CV text.
- **Accessibility:** keyboard flows, reduced motion, phone layout, and automated axe checks.

## Quality gates
`npm run lint`, `npm test` (unit), `npm run test:e2e` (desktop Chrome and WebKit as an iPhone, against the production build), and `npm run test:e2e:live` against the deployment.

## Deployment
See `docs/deployment.md`. Final manual QA: `docs/launch-checklist.md`.
