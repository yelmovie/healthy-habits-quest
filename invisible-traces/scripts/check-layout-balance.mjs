// 놀이 영역 비율·빈 배경 여백·화면별 조작 요소 목록을 세 뷰포트에서 잰다(2026-11-18 레이아웃 균형 점검).
// 사용: dev 서버를 띄운 뒤 PORT=<포트> OUT=<결과 폴더> node scripts/check-layout-balance.mjs <before|after>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const phase = process.argv[2] || 'after';
const root = path.resolve(process.env.OUT || '../.tmp/layout-balance-20261118');
const out = path.join(root, phase);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [`--disk-cache-dir=${root}/chrome-cache`, '--disable-breakpad', '--disable-crash-reporter'],
});
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
const base = `http://127.0.0.1:${process.env.PORT || 5412}/`;
const KEY = 'invisible-traces-science-save-v1';
await page.goto(base);

// P01~P10은 테스트용 저장 기록(fixtureFor)으로 바로 연다. 판정 로직은 그대로 쓴다.
const routes = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10'];
const states = await page.evaluate(async routes => {
  const { fixtureFor, derive } = await import('/src/simulation/model.ts');
  const { DATA } = await import('/src/data/game.ts');
  const make = (n, route) => { const s = fixtureFor(n, { sound: false, reduced: true, large: false }); return s; };
  const res = {};
  for (const route of routes) {
    const n = Number(route.slice(1));
    const s = make(Math.min(5, Math.ceil(n / 2) + (n % 2 === 0 ? 1 : 0)), route);
    if (n === 8) { const a = DATA.p07.actionPool.find(a => a.id === 'washHands'); s.experiment = { action: a.id, prediction: 'fewer', tick: 5, pinned: '', explanation: '', baselineSeen: true }; }
    if (n === 10) s.strategy = { asked: [], placements: [{ site: 'classroom', actionId: 'ventilation' }, { site: 'cafeteria', actionId: 'portionFood' }, { site: 'gym', actionId: 'washHands' }], simulated: true };
    derive(s); s.route = route; s.lastRoute = route;
    res[route] = s;
  }
  const map = fixtureFor(2, { sound: false, reduced: true, large: false }); derive(map); map.route = 'C01'; map.lastRoute = 'C01'; res.C01 = map;
  const home = fixtureFor(2, { sound: false, reduced: true, large: false }); derive(home); home.route = 'C00'; res.C00 = home;
  return res;
}, routes);

function measure() {
  const vw = innerWidth, vh = innerHeight;
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw && !el.closest('[inert]') && !el.closest('[aria-hidden="true"]'); };
  const box = r => r && ({ x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) });
  const clip = r => { const l = Math.max(0, r.left), t = Math.max(0, r.top), ri = Math.min(vw, r.right), b = Math.min(vh, r.bottom); return { left: l, top: t, right: ri, bottom: b, width: Math.max(0, ri - l), height: Math.max(0, b - t) }; };
  const pageEl = document.querySelector('.activity-layout') ? 'activity' : document.querySelector('.map-page') ? 'map' : 'home';
  let area = null, inner = null;
  if (pageEl === 'activity') {
    area = document.querySelector('.page-content');
    // 실제 놀이 내용: page-content 첫 자식 안의 보이는 큰 덩어리를 합친 상자
    const kids = [...(area.firstElementChild?.children || [])].filter(visible);
    const rs = kids.map(k => k.getBoundingClientRect()).filter(r => r.width * r.height > vw * vh * 0.01);
    if (rs.length) inner = { left: Math.min(...rs.map(r => r.left)), top: Math.min(...rs.map(r => r.top)), right: Math.max(...rs.map(r => r.right)), bottom: Math.max(...rs.map(r => r.bottom)) };
  } else if (pageEl === 'map') area = document.querySelector('#pixel-map canvas') || document.querySelector('#pixel-map');
  else area = document.querySelector('.title-world');
  const ar = area ? clip(area.getBoundingClientRect()) : null;
  const ir = inner ? clip({ left: inner.left, top: inner.top, right: inner.right, bottom: inner.bottom, width: inner.right - inner.left, height: inner.bottom - inner.top }) : ar;
  const pct = (a, b) => Math.round(1000 * a / b) / 10;
  const bands = {};
  for (const [k, sel] of [['topbar', '.topbar'], ['focus', '.learning-focus'], ['actionbar', '.actionbar']]) { const el = document.querySelector(sel); if (el && visible(el)) bands[k] = Math.round(el.getBoundingClientRect().height); }
  const metrics = ir && {
    areaBox: box(ar), innerBox: box(ir),
    heightPct: pct(ir.height, vh), areaPct: pct(ir.width * ir.height, vw * vh),
    gapLeftPct: pct(ir.left, vw), gapRightPct: pct(vw - ir.right, vw),
    gapTopPct: pct(ir.top, vh), gapBottomPct: pct(vh - ir.bottom, vh),
    centerOffsetXPct: pct((ir.left + ir.right) / 2 - vw / 2, vw),
  };
  const label = el => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);
  const controls = [...document.querySelectorAll('button, a[href], select, input:not([type="hidden"]), [role="button"], [draggable="true"], [tabindex="0"]')]
    .filter(visible)
    .map(el => ({ tag: el.tagName.toLowerCase(), action: el.dataset.action || el.dataset.mapDirection || el.dataset.select || '', id: el.dataset.id || '', label: label(el), cls: (el.className?.baseVal ?? el.className ?? '').toString().split(/\s+/).filter(c => /primary|secondary|small|selected|obs-next|next-target|choice/.test(c)).join(' '), disabled: !!el.disabled, box: box(el.getBoundingClientRect()) }));
  const small = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = walker.nextNode())) { const p = n.parentElement; if (!n.textContent.trim() || !p || !visible(p) || p.closest('svg')) continue; const fs = parseFloat(getComputedStyle(p).fontSize); if (fs < 17.5) small.push({ t: n.textContent.trim().slice(0, 30), fs }); }
  return { kind: pageEl, vw, vh, bands, metrics, controls, smallText: small.length, smallSamples: small.slice(0, 5) };
}

const sizes = [[1280, 800], [1024, 768], [1920, 1080]];
const results = [];
try {
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    for (const route of ['C00', 'C01', ...routes]) {
      await page.evaluate(([k, s]) => { localStorage.setItem(k, JSON.stringify(s)); }, [KEY, states[route]]);
      await page.goto(base);
      if (route === 'C00') await page.locator('.title-screen').waitFor();
      else if (route === 'C01') { if (await page.locator('.title-screen').count()) await page.locator('[data-action="start"]').click(); await page.locator('.map-page').waitFor(); await page.waitForTimeout(1200); }
      else { if (await page.locator('.title-screen').count()) await page.locator('[data-action="start"]').click(); await page.locator(`.activity-layout[data-page="${route}"]`).waitFor(); }
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
      await page.waitForTimeout(250);
      // 처음 들어올 때 뜨는 대화·안내가 있으면 그대로 기록하고 닫지 않는다(실제 첫 화면).
      const m = await page.evaluate(measure);
      m.modal = await page.evaluate(() => !!document.querySelector('.modal-backdrop, .npc-scene, dialog[open]'));
      results.push({ w, h, route, ...m });
      await page.screenshot({ path: path.join(out, `${w}x${h}-${route}.png`) });
    }
  }
} finally {
  fs.writeFileSync(path.join(out, 'layout.json'), JSON.stringify({ phase, errors, results }, null, 2));
  await browser.close();
}
const rows = results.map(r => `${r.w}x${r.h} ${r.route} ${r.kind} h=${r.metrics?.heightPct}% a=${r.metrics?.areaPct}% gapL/R=${r.metrics?.gapLeftPct}/${r.metrics?.gapRightPct} gapT/B=${r.metrics?.gapTopPct}/${r.metrics?.gapBottomPct} bands=${JSON.stringify(r.bands)} controls=${r.controls.length} small=${r.smallText}${r.modal ? ' MODAL' : ''}`);
console.log(rows.join('\n'));
console.log('errors', errors);
