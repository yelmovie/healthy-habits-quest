import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.OUT || path.join('..', '.tmp/responsive-20261108'));
const phase = process.argv[2] || 'after';
const out = path.join(root, phase);
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
process.env.TMPDIR = path.join(root, 'tmp');
process.env.XDG_CACHE_HOME = root;
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [`--disk-cache-dir=${root}/chrome-cache`, `--crash-dumps-dir=${root}/crashes`, '--disable-breakpad', '--disable-crash-reporter'],
});
const errors = [];
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
page.on('pageerror', e => errors.push(e.message));
page.setDefaultTimeout(30000);
page.setDefaultNavigationTimeout(120000);
const seedURL = `http://127.0.0.1:${process.env.PORT || 5342}`;
const baseURL = process.env.BASE_URL || seedURL;
await page.goto(seedURL);
const sizes = phase === 'before'
  ? [[1280, 800], [915, 412], [390, 844]]
  : [[1920, 1080], [1366, 768], [1280, 800], [1280, 720], [1024, 768], [1024, 600], [768, 1024], [830, 515], [915, 412], [740, 360], [800, 270], [390, 844], [360, 740]];
const cases = Array.from({ length: 10 }, (_, i) => ({ route: `P${String(i + 1).padStart(2, '0')}` }));
cases.push({ route: 'P05', intervention: 1.5 }, { route: 'P05', intervention: 4.5 }, { route: 'P05', intervention: 1.5, tick: 0 });
for (const lab of ['droplet', 'air', 'water', 'saliva']) for (const value of [0, 1]) cases.push({ route: 'P06', lab, value });
for (const action of ['coughEtiquette', 'ventilation', 'personalItems', 'portionFood']) cases.push({ route: 'P08', action });
cases.push({ route: 'P10', apply: 'ventilation' }, { route: 'P10', apply: 'portionFood' }, { route: 'P10', apply: 'washHands' }, { route: 'P10', certificate: true });

function audit() {
  const issues = [];
  const within = r => r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity !== 0 && el.getClientRects().length; };
  const label = el => (el.getAttribute('aria-label') || el.textContent || el.className || '').trim().replace(/\s+/g, ' ').slice(0, 64);
  const canScroll = el => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/auto|scroll/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 2) return true;
    }
    return document.documentElement.scrollHeight > innerHeight + 2 && getComputedStyle(document.body).overflow !== 'hidden';
  };
  if (document.documentElement.scrollWidth > innerWidth + 2) issues.push({ type: 'horizontal-overflow', width: document.documentElement.scrollWidth });
  for (const img of document.images) if (img.complete && !img.naturalWidth) issues.push({ type: 'broken-image', label: img.src });
  for (const el of document.querySelectorAll('button,select,input[type="range"]')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 43 || r.height < 43) issues.push({ type: 'small-control', label: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    if ((r.left < -2 || r.right > innerWidth + 2 || r.top >= innerHeight || r.bottom <= 0) && !canScroll(el)) issues.push({ type: 'unreachable-control', label: label(el) });
    if (!within(r)) continue;
    const x = Math.max(1, Math.min(innerWidth - 1, r.x + r.width / 2));
    const y = Math.max(1, Math.min(innerHeight - 1, r.y + r.height / 2));
    const hit = document.elementFromPoint(x, y);
    if (hit && !el.contains(hit) && hit !== el && !el.disabled && !canScroll(el)) issues.push({ type: 'covered-control', label: label(el), by: label(hit) });
  }
  const walker = document.createTreeWalker(document.querySelector('.page-content'), NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.textContent.trim() || node.parentElement.closest('svg') || !visible(node.parentElement)) continue;
    // Visually hidden live regions are intentional, not clipped learner text.
    const textStyle = getComputedStyle(node.parentElement);
    const textBox = node.parentElement.getBoundingClientRect();
    if (node.parentElement.matches('.playback-state[role="status"]') && textStyle.clipPath === 'inset(50%)' && textBox.width <= 1 && textBox.height <= 1) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter(within);
    const button = node.parentElement.closest('button');
    if (button) {
      const br = button.getBoundingClientRect();
      for (const tr of rects) {
        if (tr.left < br.left - 2 || tr.right > br.right + 2 || tr.top < br.top - 2 || tr.bottom > br.bottom + 2) issues.push({ type: 'text-outside-control', label: node.textContent.trim().slice(0, 55) });
        for (const svg of button.querySelectorAll('svg')) {
          const sr = svg.getBoundingClientRect();
          if (!within(sr)) continue;
          if (Math.min(tr.right, sr.right) - Math.max(tr.left, sr.left) > 2 && Math.min(tr.bottom, sr.bottom) - Math.max(tr.top, sr.top) > 2) issues.push({ type: 'text-icon-overlap', label: node.textContent.trim().slice(0, 55) });
        }
      }
    }
    for (let parent = node.parentElement; parent && !parent.classList.contains('page-content'); parent = parent.parentElement) {
      const s = getComputedStyle(parent), pr = parent.getBoundingClientRect();
      if (['hidden', 'clip'].includes(s.overflowX) && rects.some(r => r.left < pr.left - 2 || r.right > pr.right + 2)) issues.push({ type: 'clipped-text-x', label: node.textContent.trim().slice(0, 55) });
      if (['hidden', 'clip'].includes(s.overflowY) && rects.some(r => r.top < pr.top - 2 || r.bottom > pr.bottom + 2)) issues.push({ type: 'clipped-text-y', label: node.textContent.trim().slice(0, 55) });
    }
  }
  return [...new Map(issues.map(i => [JSON.stringify(i), i])).values()];
}

const savedStates = await page.evaluate(async cases => {
  const { fixtureFor, derive, placementKey } = await import('/src/simulation/model.ts');
  const { DATA } = await import('/src/data/game.ts');
  return [false, true].map(large => cases.map(c => {

        const n = Number(c.route.slice(1));
        const s = fixtureFor(Math.min(5, Math.ceil(n / 2) + (n % 2 === 0 ? 1 : 0)), { sound: false, reduced: true, large });
        if (n === 8) {
          const a = DATA.p07.actionPool.find(a => a.id === (c.action || 'washHands'));
          s.experiment = { action: a.id, prediction: 'fewer', tick: 5, pinned: '', explanation: '', baselineSeen: true };
        }
        if (n === 10) {
          s.strategy = { asked: [], placements: [{ site: 'classroom', actionId: 'ventilation' }, { site: 'cafeteria', actionId: 'portionFood' }, { site: 'gym', actionId: 'washHands' }], simulated: true };
          if (c.apply) { s.final.phase = 'apply'; for (const p of s.strategy.placements) { if (p.actionId === c.apply) break; s.final.applied.push(placementKey(p)); } }
          if (c.certificate) { s.final.applied = s.strategy.placements.map(placementKey); s.final.phase = 'certificate'; }
        }
        if (c.lab) s.labs.values[c.lab] = c.value;
        if (c.intervention !== undefined) s.timeline = { tick: c.tick ?? 5, source: 'book', intervention: c.intervention };
        derive(s); s.route = c.route; s.lastRoute = c.route;
        return s;
  }));
}, cases);
await page.goto(baseURL);


const results = [];
try {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const large of phase === 'before' ? [false] : [false, true]) for (const [caseIndex, c] of cases.entries()) {
      await page.evaluate(s => localStorage.setItem('invisible-traces-science-save-v1', JSON.stringify(s)), savedStates[large ? 1 : 0][caseIndex]);
      await page.reload();
      await page.locator('.page-content').waitFor();
      if (c.lab) await page.locator(`[data-action="lab"][data-id="${c.lab}"]`).click();
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
      const topIssues = await page.evaluate(audit);
      await page.evaluate(() => {
        const content = document.querySelector('.page-content');
        content.scrollTop = content.scrollHeight;
        document.querySelector('.question-panel')?.scrollTo(0, 10000);
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      const bottomIssues = await page.evaluate(audit);
      const issues = [...new Map([...topIssues, ...bottomIssues].map(i => [JSON.stringify(i), i])).values()];
      await page.evaluate(() => { document.querySelector('.page-content').scrollTop = 0; window.scrollTo(0, 0); });
      const name = `${c.route}${c.lab ? `-${c.lab}-${c.value}` : ''}${c.action ? `-${c.action}` : ''}${c.apply ? `-${c.apply}` : ''}${c.certificate ? '-certificate' : ''}${c.intervention !== undefined ? `-shield-${c.intervention}-${c.tick ?? 5}` : ''}`;
      results.push({ width, height, large, name, issues });
      if (!large && (width === 1280 || width === 1024 || width === 390) && (!c.lab || c.value === 1)) await page.screenshot({ path: path.join(out, `${width}x${height}-${name}.png`), fullPage: true });
    }
    console.log(`${phase} ${width}x${height} done; ${results.reduce((n, r) => n + r.issues.length, 0)} issues so far`);
  }
} finally {
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ phase, errors, results }, null, 2));
  await browser.close();
}
const failed = results.filter(r => r.issues.length);
console.log(JSON.stringify({ screens: results.length, failures: failed.length, issues: failed.reduce((n, r) => n + r.issues.length, 0), errors, examples: failed.slice(0, 4) }, null, 2));
if (phase !== 'before' && (failed.length || errors.length)) process.exitCode = 1;
