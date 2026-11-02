# Quick Free CV Builder Launch Checklist

Items marked *(e2e)* are checked on every run of `npm run test:e2e` / `npm run test:e2e:live`, in desktop Chrome and WebKit as an iPhone. The unticked items need a person, on real devices.

## Done and verified
- [x] Deployed on Vercel with Git deploys from `main` (2026-11-02)
- [x] Security headers, SPA routes, asset 404s and caching verified on the live site
- [x] Autosave survives a reload *(e2e)*
- [x] Import shows a review before saving; damaged and password-protected PDFs are explained *(e2e)*
- [x] Exported PDF: accented names, clickable links, one copy of skills, page count matches *(e2e)*
- [x] Photo in Standard PDF, left out of ATS PDF *(e2e)*
- [x] Undo, two-tab conflicts, crash recovery, shared-computer mode *(e2e)*
- [x] No request leaves the app under the live security policy *(e2e)*
- [x] No axe accessibility violations on home, editor and preview *(e2e)*
- [x] Favicon, iOS home-screen icon, meta title / description, link-preview image, robots.txt, sitemap
- [x] README and docs current

## Real-device checks (manual)
- [ ] iPhone Safari: create a CV, export PDF, file saves to Files and opens correctly
- [ ] Android Chrome: create, export PDF, import a PDF
- [ ] Desktop Firefox and Safari: create, export, import (the automated suite covers Chrome and WebKit only)
- [ ] Import three or four real CVs from different builders; check the review screen and what lands in "couldn't be placed"
- [ ] Each template (Classic, Modern, Compact, ATS) looks polished with a long, two-page CV
- [ ] Mobile edit / preview toggle and sidebar drag reorder by touch
- [ ] Share the live link in WhatsApp / LinkedIn / X and check the preview card

## Launch housekeeping
- [ ] CI workflow (`.github/workflows/ci.yml`): needs a GitHub token with the `workflow` scope (`gh auth refresh -s workflow`)
- [ ] Optional: custom domain (then update the URLs listed in `docs/deployment.md`)
- [ ] Submit the sitemap in Google Search Console
