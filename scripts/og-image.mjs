// Renders the link-preview image (public/og-image.png, 1200×630) and the iOS home-screen icon
// (public/apple-touch-icon.png, 180×180). Social sites and iOS don't use SVG. Run after changing
// the brand or tagline: node scripts/og-image.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const font = (file) => readFileSync(new URL(`src/assets/fonts/${file}`, root)).toString('base64');
const logo = readFileSync(new URL('public/favicon.svg', root), 'utf8');

const page = `<!doctype html><html><head><style>
  @font-face { font-family: Noto; font-weight: 400; src: url(data:font/ttf;base64,${font('NotoSans-Regular.ttf')}); }
  @font-face { font-family: Noto; font-weight: 700; src: url(data:font/ttf;base64,${font('NotoSans-Bold.ttf')}); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; font-family: Noto; color: #0f172a; background: linear-gradient(135deg, #eff6ff 0%, #ffffff 55%, #dbeafe 100%); display: flex; align-items: center; padding: 0 88px; gap: 64px; }
  .copy { flex: 1; }
  .brand { display: flex; align-items: center; gap: 20px; font-size: 30px; font-weight: 700; color: #1e40af; }
  .brand svg { width: 72px; height: 72px; }
  h1 { margin-top: 36px; font-size: 68px; line-height: 1.08; font-weight: 700; letter-spacing: -1.5px; }
  p { margin-top: 28px; font-size: 30px; line-height: 1.4; color: #475569; }
  .chips { margin-top: 36px; display: flex; gap: 14px; }
  .chip { padding: 10px 22px; border-radius: 999px; background: #2563eb; color: #fff; font-size: 24px; font-weight: 700; }
  .cv { width: 300px; height: 400px; background: #fff; border-radius: 18px; box-shadow: 0 30px 70px rgba(15, 23, 42, 0.16); padding: 34px 30px; transform: rotate(3deg); }
  .bar { height: 12px; border-radius: 6px; background: #e2e8f0; margin-top: 14px; }
  .bar.title { height: 22px; width: 70%; background: #0f172a; margin-top: 0; }
  .bar.sub { width: 45%; background: #2563eb; }
  .bar.head { width: 38%; height: 14px; background: #1e40af; margin-top: 30px; }
</style></head><body>
  <div class="copy">
    <div class="brand">${logo}<span>Quick Free CV Builder</span></div>
    <h1>A polished CV in minutes.</h1>
    <p>Your CV stays in your browser. Searchable PDF export, live preview, ATS mode.</p>
    <div class="chips"><span class="chip">Free</span><span class="chip">No sign-up</span><span class="chip">No watermark</span></div>
  </div>
  <div class="cv">
    <div class="bar title"></div><div class="bar sub"></div>
    <div class="bar head"></div><div class="bar"></div><div class="bar" style="width:88%"></div><div class="bar" style="width:76%"></div>
    <div class="bar head"></div><div class="bar"></div><div class="bar" style="width:82%"></div>
    <div class="bar head"></div><div class="bar" style="width:64%"></div>
  </div>
</body></html>`;

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await tab.setContent(page);
await tab.evaluate(() => document.fonts.ready);
await tab.screenshot({ path: new URL('public/og-image.png', root).pathname });

await tab.setViewportSize({ width: 180, height: 180 });
// Full-bleed square: iOS applies its own rounded mask.
await tab.setContent(`<body style="margin:0;background:#2563eb">${logo.replace('rx="16"', 'rx="0"').replace('width="64" height="64"', 'width="180" height="180"')}</body>`);
await tab.screenshot({ path: new URL('public/apple-touch-icon.png', root).pathname });
await browser.close();
