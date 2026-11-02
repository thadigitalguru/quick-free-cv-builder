# Quick Free CV Builder Launch Checklist

Items marked *(e2e)* are checked on every push by CI and by `npm run test:e2e` / `npm run test:e2e:live`, in five browser setups: desktop Chrome, Firefox and Safari (WebKit), and phone-sized iPhone (WebKit) and Android (Chromium). These are emulated; the unticked items need a person, on real devices.

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
- [x] Desktop Chrome, Firefox and Safari engines: create, import, export, undo, privacy, accessibility *(e2e)*
- [ ] Desktop Firefox and Safari on a real machine: a quick look at the PDF in each
- [ ] Import three or four real CVs from different builders; check the review screen and what lands in "couldn't be placed"
- [ ] Each template (Classic, Modern, Compact, ATS) looks polished with a long, two-page CV
- [ ] Mobile edit / preview toggle and sidebar drag reorder by touch
- [ ] Share the live link in WhatsApp / LinkedIn / X and check the preview card

## Launch housekeeping
- [x] CI workflow (`.github/workflows/ci.yml`) on every push and pull request
- [ ] Optional: custom domain (then update the URLs listed in `docs/deployment.md`)
- [ ] Submit the sitemap in Google Search Console
