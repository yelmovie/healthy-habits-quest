import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('..', '.tmp/one-screen-20261108');
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
page.setDefaultTimeout(10000);
await page.goto('http://127.0.0.1:5342');
const sizes = phase === 'target' ? [[1024,600],[915,412],[740,360],[800,270]] : phase === 'quick'
  ? [[1280, 800], [1024, 600], [915, 412], [390, 844]]
  : [[1920, 1080], [1366, 768], [1280, 800], [1024, 768], [1024, 600], [915, 412], [740, 360], [800, 270], [390, 844], [360, 740]];
const cases = Array.from({ length: 10 }, (_, i) => ({ route: `P${String(i + 1).padStart(2, '0')}` }));
for (const lab of ['droplet', 'air', 'water', 'saliva']) for (const value of [0, 1]) cases.push({ route: 'P06', lab, value });
for (const action of ['coughEtiquette', 'ventilation', 'personalItems', 'portionFood']) cases.push({ route: 'P08', action });
cases.push({ route: 'P10', apply: 'ventilation' }, { route: 'P10', apply: 'portionFood' }, { route: 'P10', apply: 'washHands' }, { route: 'P10', certificate: true });

cases.push({route:'P06',lab:'synthesis'},{route:'P02',focus:'tray'},{route:'P03',focus:'targets',choice:'CL02'},{route:'P04',focus:'domains',choice:'IM02'},{route:'P09',focus:'cafeteria'},{route:'P09',focus:'gym'});

function audit() {
  const issues = [];
  const content = document.querySelector('.page-content');
  if(content.scrollHeight>content.clientHeight+2)issues.push({type:'activity-scroll',h:content.clientHeight,sh:content.scrollHeight});
  if(document.documentElement.scrollHeight>innerHeight+2)issues.push({type:'document-scroll',height:document.documentElement.scrollHeight});
  for(const el of content.querySelectorAll('*')){const cs=getComputedStyle(el);if(el.clientHeight>0&&/auto|scroll/.test(cs.overflowY)&&el.scrollHeight>el.clientHeight+2)issues.push({type:'inner-scroll',label:el.className});}
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
    const cr=content.getBoundingClientRect();
    if(content.contains(el)&&(r.top<cr.top-2||r.bottom>cr.bottom+2||r.left<cr.left-2||r.right>cr.right+2))issues.push({type:'control-outside-activity',label:label(el),rect:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]});
    if (!within(r)) continue;
    const x = Math.max(1, Math.min(innerWidth - 1, r.x + r.width / 2));
    const y = Math.max(1, Math.min(innerHeight - 1, r.y + r.height / 2));
    const hit = document.elementFromPoint(x, y);
    if (hit && !el.contains(hit) && hit !== el && !el.disabled && !canScroll(el)) issues.push({ type: 'covered-control', label: label(el), by: label(hit) });
  }
  const walker = document.createTreeWalker(document.querySelector('.page-content'), NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.textContent.trim() || node.parentElement.closest('svg,.playback-state') || !visible(node.parentElement)) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    const rects = [...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
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

const results = [];
try {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const large of phase === 'quick' ? [false] : [false, true]) for (const c of cases) {
      await page.evaluate(async ({ c, large }) => {
        const { fixtureFor, derive, placementKey } = await import('/src/simulation/model.ts');
        const { DATA } = await import('/src/data/game.ts');
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
        if (c.lab && c.value!==undefined) s.labs.values[c.lab] = c.value;
        derive(s); s.route = c.route; s.lastRoute = c.route;
        localStorage.setItem('invisible-traces-science-save-v1', JSON.stringify(s));
      }, { c, large });
      await page.reload();
      await page.locator('.page-content').waitFor();
      if (c.lab) await page.locator(`[data-action="lab"][data-id="${c.lab}"]`).first().click();
      if(c.choice)await page.locator(`[data-action="${c.route==='P03'?'select-clue':'select-effect'}"][data-id="${c.choice}"]`).click();
      if(c.focus&&await page.locator(`[data-action=focus][data-id="${c.focus}"]`).isVisible())await page.locator(`[data-action=focus][data-id="${c.focus}"]`).click();
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
      const issues = await page.evaluate(audit);
      const name = `${c.route}${c.lab ? `-${c.lab}-${c.value}` : ''}${c.action ? `-${c.action}` : ''}${c.apply ? `-${c.apply}` : ''}${c.certificate ? '-certificate' : ''}${c.focus ? '-'+c.focus : ''}`;
      results.push({ width, height, large, name, issues });
      if ((!large || width === 800) && (width === 1280 || width === 390 || width === 915 || width === 800) && (!c.lab || c.value === 1)) await page.screenshot({ path: path.join(out, `${width}${large?"-large":""}-${name}.png`), fullPage: true });
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
