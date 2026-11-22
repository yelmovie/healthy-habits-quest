// 인증서 디자인(2026-11-22) 확인: 세 화면 크기에서 종이 크기·한 화면 안·인쇄(손으로 쓸 빈칸 실제 크기)·PNG.
// 사용: 미리보기(또는 운영)를 띄운 뒤 BASE=<주소> OUT=<결과 폴더> node --import tsx scripts/check-cert.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fixtureFor, derive, placementKey } from '../src/simulation/model.ts';

const out = path.resolve(process.env.OUT || '../.tmp/cert-design-20261122/after'); fs.mkdirSync(out, { recursive: true });
const base = process.env.BASE || 'http://127.0.0.1:5433/';
const KEY = 'invisible-traces-science-save-v1';
const s = fixtureFor(5, { music: false, sfx: false, voice: false, reduced: true, large: false });
s.strategy = { asked: [], placements: [{ site: 'classroom', actionId: 'ventilation' }, { site: 'cafeteria', actionId: 'portionFood' }, { site: 'gym', actionId: 'washHands' }], simulated: true };
s.final.applied = s.strategy.placements.map(placementKey); s.final.hands = ['palm', 'back', 'fingers']; derive(s); s.final.phase = 'certificate'; s.route = 'P10'; s.lastRoute = 'P10';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--mute-audio', '--disable-breakpad'] });
const report = [];
for (const [w, h] of [[1280, 800], [1024, 768], [1920, 1080]]) {
  const tag = `${w}x${h}`; console.error('size', tag);
  const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', acceptDownloads: true });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [KEY, s]);
  await page.goto(base, { waitUntil: 'load', timeout: 30000 }); await page.waitForSelector('[data-cert-paper]', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);
  const geom = () => page.evaluate(() => {
    const p = document.querySelector('[data-cert-paper]').getBoundingClientRect(); const c = document.querySelector('.cert-content').getBoundingClientRect();
    const over = [...document.querySelectorAll('.cert-content *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < c.left - 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.bottom > c.bottom + 1 || e.scrollWidth > e.clientWidth + 1); }).map(e => e.className || e.tagName);
    const contrast = (() => { const lum = rgb => { const [r, g, b] = rgb.match(/\d+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
      const paperL = lum('rgb(255, 249, 232)'); return Object.fromEntries(['.cert-award', '.cert-kicker', '.cert-slot small', '.cert-foot small', '.cert-credit', '.cert-summary span'].map(sel => { const e = document.querySelector(sel); const cs = getComputedStyle(e); const bg = cs.backgroundColor === 'rgba(0, 0, 0, 0)' ? paperL : lum(cs.backgroundColor); const L = lum(cs.color); return [sel, +((Math.max(L, bg) + .05) / (Math.min(L, bg) + .05)).toFixed(2)]; })); })();
    return { paperW: Math.round(p.width), paperH: Math.round(p.height), widthShare: +(p.width / innerWidth).toFixed(2), inView: p.top >= 0 && p.left >= 0 && p.bottom <= innerHeight && p.right <= innerWidth, overflow: over, contrast, scrollY: document.scrollingElement.scrollHeight > innerHeight };
  });
  const r = { tag, empty: await geom() };
  await page.screenshot({ path: `${out}/cert-${tag}.png` });
  await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: `${out}/cert-print-${tag}.png`, fullPage: true });
  r.printPanelHidden = await page.evaluate(() => getComputedStyle(document.querySelector('.cert-panel')).display === 'none');
  // 인쇄 매체에서 종이는 297mm. 빈칸 밑줄 길이와 밑줄 위 높이를 cm로 잰다.
  r.blanksCm = await page.evaluate(() => { const p = document.querySelector('[data-cert-paper]').getBoundingClientRect(); const mm = p.width / 297;
    return Object.fromEntries([...document.querySelectorAll('.cert-slot')].map(s => { const b = s.querySelector('b').getBoundingClientRect(); return [s.className.split('cert-slot-')[1], { w: +(b.width / mm / 10).toFixed(2), h: +(b.height / mm / 10).toFixed(2) }]; })); });
  if (tag === '1280x800') { await page.pdf({ path: `${out}/cert-print.pdf`, preferCSSPageSize: true, printBackground: true }); }
  await page.emulateMedia({ media: 'screen' });
  if (tag === '1280x800') {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.click('[data-action="cert-png"]')]);
    const file = `${out}/cert-saved.png`; await dl.saveAs(file); r.png = { name: dl.suggestedFilename(), bytes: fs.statSync(file).size };
  }
  r.errors = errors; report.push(r); await context.close();
}
await browser.close();
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1)); console.log(JSON.stringify(report, null, 1));
