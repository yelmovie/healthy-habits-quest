// 2026-11-22 16곳 맞추기: 설정 창·초기화 확인창·인증서·인증서 인쇄를 세 화면 크기로 찍고 동작을 잰다.
// 사용: dev 서버를 띄운 뒤 PORT=<포트> OUT=<결과 폴더> node scripts/check-unify.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fixtureFor, derive, placementKey } from '../src/simulation/model.ts';
const out = path.resolve(process.env.OUT || '../.tmp/unify-20261122'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: [`--disk-cache-dir=${out}/chrome-cache`, '--disable-breakpad', '--mute-audio'] });
console.error('step', 'const browser = await chromium.launch(', new Date().toISOString().slice(11,19));
const base = process.env.BASE || `http://127.0.0.1:${process.env.PORT || 5433}/`;
const KEY = 'invisible-traces-science-save-v1';
const report = [];
for (const [w, h] of [[1280, 800], [1024, 768], [1920, 1080]]) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
console.error('step', '  const context = await browser.newConte', new Date().toISOString().slice(11,19));
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const cert = (() => { const s = fixtureFor(5, { music: false, sfx: false, voice: false, reduced: true, large: false });
    s.strategy = { asked: [], placements: [{ site: 'classroom', actionId: 'ventilation' }, { site: 'cafeteria', actionId: 'portionFood' }, { site: 'gym', actionId: 'washHands' }], simulated: true };
    s.final.applied = s.strategy.placements.map(placementKey); s.final.hands = ['palm','back','fingers']; derive(s); s.final.phase = 'certificate'; s.route = 'P10'; s.lastRoute = 'P10'; return s; })();
  await page.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, cert]);
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30000 }); await page.waitForTimeout(1200);
console.error('step', "  await page.goto(base, { waitUntil: 'do", new Date().toISOString().slice(11,19));
  // 영상 창이 떠 있으면 닫는다
  if (await page.locator('.story-film-dialog').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(300); }
  const tag = `${w}x${h}`; const r = { tag };
  r.certHeading = await page.locator('.ending-card h2').textContent().catch(() => null);
  r.certDate = await page.locator('.cert-date').textContent().catch(() => null);
  r.certCredit = await page.locator('.cert-credit').textContent().catch(() => null);
  r.printBtn = await page.locator('[data-action="print"]').textContent().catch(() => null);
  // 제작 표기가 다른 글자와 겹치는지: 카드 안 다른 요소 사각형과 교차 검사
  r.creditOverlap = await page.evaluate(() => { const c = document.querySelector('.cert-credit'); if (!c) return 'none'; const a = c.getBoundingClientRect(); const card = document.querySelector('.ending-card').getBoundingClientRect();
    const hits = [...document.querySelectorAll('.ending-card > *:not(.cert-credit)')].filter(e => { const b = e.getBoundingClientRect(); return b.width && !(b.right <= a.left || b.left >= a.right || b.bottom <= a.top || b.top >= a.bottom); }).map(e => e.className);
    return { hits, inside: a.top >= card.top && a.bottom <= card.bottom && a.left >= card.left && a.right <= card.right }; });
  await page.screenshot({ path: `${out}/cert-${tag}.png` });
console.error('step', '  await page.screenshot({ path: `${out}/', new Date().toISOString().slice(11,19));
  await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: `${out}/cert-print-${tag}.png`, fullPage: true });
  r.printVisible = await page.evaluate(() => ({ actions: getComputedStyle(document.querySelector('.ending-actions')).display, credit: getComputedStyle(document.querySelector('.cert-credit')).display, date: getComputedStyle(document.querySelector('.cert-date')).display, bg: getComputedStyle(document.querySelector('.ending-background')).display }));
  if (tag === '1280x800') await page.pdf({ path: `${out}/cert-print.pdf`, format: 'A4', landscape: true, printBackground: true });
console.error('step', "  if (tag === '1280x800') await page.pdf", new Date().toISOString().slice(11,19));
  await page.emulateMedia({ media: 'screen' });
  // 설정 창
  await page.locator('[data-action="settings"]').first().click(); await page.waitForTimeout(400);
console.error('step', '  await page.locator(\'[data-action="sett', new Date().toISOString().slice(11,19));
  r.settingsX = await page.locator('.modal .modal-close').count();
  r.audioOrder = await page.locator('.science-settings-audio .setting-row > span:first-child').allTextContents();
  await page.screenshot({ path: `${out}/settings-${tag}.png` });
  await page.mouse.click(8, h - 8); await page.waitForTimeout(300); r.outsideClickKeepsOpen = await page.locator('[data-science-settings]').count() === 1;
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); r.escCloses = await page.locator('[data-science-settings]').count() === 0;
  r.focusBack = await page.evaluate(() => document.activeElement?.dataset?.action || document.activeElement?.tagName);
  // 초기화 확인창
  await page.locator('[data-action="settings"]').first().click(); await page.waitForTimeout(300);
  await page.locator('[data-modal="reset"]').click(); await page.waitForTimeout(300);
console.error('step', '  await page.locator(\'[data-modal="reset', new Date().toISOString().slice(11,19));
  r.resetButtons = await page.locator('.modal-actions .btn').allTextContents();
  r.resetFocus = await page.evaluate(() => document.activeElement?.textContent);
  r.dangerBg = await page.locator('.modal-actions .btn.danger').evaluate(e => getComputedStyle(e).backgroundColor).catch(() => null);
  await page.screenshot({ path: `${out}/reset-${tag}.png` });
  await page.keyboard.press('Escape');
  r.errors = errors; report.push(r); await context.close();
}
await browser.close();
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1)); console.log(JSON.stringify(report, null, 1));
