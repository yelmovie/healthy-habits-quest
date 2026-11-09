// 최종점검 실측 묶음: 초기 로딩·오프라인·키보드·글자 하한·대비·터치 크기·텍스트 200%·새로고침 복원·손상 저장·해금 재계산.
// 사용: dev 서버(DEV, 기본 5130)와 build 후 preview 서버(PREVIEW, 기본 5131)를 띄운 뒤
//   OUT=<결과 폴더> node scripts/check-release.mjs
// 결과는 OUT/release.json 한 파일. 실패해도 측정값을 그대로 남기며, 판정은 보고서에서 한다.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const DEV = `http://127.0.0.1:${process.env.DEV || 5130}`;
const PREVIEW = `http://127.0.0.1:${process.env.PREVIEW || 5131}`;
const out = path.resolve(process.env.OUT || '../.tmp/release-check');
fs.mkdirSync(out, { recursive: true });
const KEY = 'invisible-traces-science-save-v1';
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [`--disk-cache-dir=${out}/chrome-cache`, '--disable-breakpad', '--disable-crash-reporter'],
});
const result = { at: new Date().toISOString(), errors: [] };
const ROUTES = ['C00', 'C01', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10'];

async function seed(page, route, settings = {}) {
  await page.evaluate(async ({ route, settings, KEY }) => {
    const { fixtureFor, derive } = await import('/src/simulation/model.ts');
    const n = route.startsWith('P') ? Number(route.slice(1)) : 1;
    const s = fixtureFor(Math.min(5, Math.ceil(n / 2) + (n % 2 === 0 ? 1 : 0)), { sound: false, reduced: true, large: false, ...settings });
    if (route === 'P10') s.strategy = { asked: [], placements: [{ site: 'classroom', actionId: 'ventilation' }, { site: 'cafeteria', actionId: 'portionFood' }, { site: 'gym', actionId: 'washHands' }], simulated: true };
    derive(s); s.route = route; s.lastRoute = route;
    localStorage.setItem(KEY, JSON.stringify(s));
  }, { route, settings, KEY });
  await page.reload();
  await page.waitForTimeout(route === 'C01' ? 1500 : 500);
  await page.evaluate(async () => { await document.fonts.ready; });
}

// 1) 초기 로딩: 캐시 없는 새 컨텍스트, 그대로 + 10Mbps/40ms 제한
async function load(throttle) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (throttle) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 10e6 / 8, uploadThroughput: 5e6 / 8 });
  let bytes = 0; const hosts = new Set();
  cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
  page.on('request', r => hosts.add(new URL(r.url()).host));
  const t0 = Date.now();
  await page.goto(PREVIEW + '/');
  await page.locator('[data-action="start"]').waitFor({ state: 'visible' });
  const startVisibleMs = Date.now() - t0;
  await page.waitForLoadState('load');
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  const fcp = await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null);
  const lazy = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name.split('/').pop()).filter(n => /^(phaser|pixel-map|school-map)/.test(n)));
  await ctx.close();
  return { throttle: !!throttle, startVisibleMs, loadMs, fcpMs: fcp && Math.round(fcp), transferKB: Math.round(bytes / 1024), hosts: [...hosts], lazyChunksOnHome: lazy };
}
result.load = [await load(false), await load(true)];

// 2) 오프라인 재방문: 서비스워커 설치 뒤 네트워크 끊고 첫 화면 + 아직 안 연 화면
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(PREVIEW + '/');
  await page.evaluate(async () => { await navigator.serviceWorker?.ready; });
  await page.waitForTimeout(2500);
  await page.reload(); await page.waitForTimeout(800);
  const controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller);
  await ctx.setOffline(true);
  await page.reload();
  const homeOk = await page.locator('[data-action="start"]').isVisible().catch(() => false);
  await page.locator('[data-action="start"]').click().catch(() => {});
  await page.waitForTimeout(2500);
  const mapOk = await page.evaluate(() => !!document.querySelector('canvas'));
  result.offline = { controlled, homeOk, mapOk };
  await ctx.close();
}

// 3) 화면별 측정(dev 서버): 글자 하한·대비·터치 크기·가로 넘침
function measure() {
  const visible = el => { const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && el.getClientRects().length; };
  const inView = r => r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
  const label = el => (el.getAttribute('aria-label') || el.textContent || el.className || '').trim().replace(/\s+/g, ' ').slice(0, 40);
  const rgb = c => { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  // 글자 뒤 배경: 불투명 배경색을 만날 때까지 올라간다. 그림·반투명 위 글자는 '판단 불가'로 따로 센다.
  const background = el => {
    for (let p = el; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) return null;
      const c = rgb(s.backgroundColor);
      if ((c[3] ?? 1) >= 0.9) return c;
      if ((c[3] ?? 1) > 0.05) return null;
    }
    return [255, 255, 255, 1];
  };
  const fonts = [], lowContrast = [], unknownContrast = new Set(), small = [], covered = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!node.textContent.trim() || !el || el.closest('svg,canvas,[aria-hidden="true"],.rotate-hint') || !visible(el)) continue;
    const s = getComputedStyle(el);
    if (s.clipPath === 'inset(50%)' || s.position === 'absolute' && el.getBoundingClientRect().width <= 1) continue;
    const range = document.createRange(); range.selectNodeContents(node);
    if (![...range.getClientRects()].some(inView)) continue;
    const size = parseFloat(s.fontSize);
    fonts.push({ size, text: node.textContent.trim().slice(0, 30) });
    const bg = background(el);
    if (!bg) { unknownContrast.add(node.textContent.trim().slice(0, 20)); continue; }
    const fg = rgb(s.color); const alpha = (fg[3] ?? 1) * +s.opacity;
    const mixed = fg.slice(0, 3).map((v, i) => v * alpha + bg[i] * (1 - alpha));
    const r = ratio(mixed, bg);
    const large = size >= 24 || (size >= 18.66 && +s.fontWeight >= 700);
    if (r < (large ? 3 : 4.5)) lowContrast.push({ text: node.textContent.trim().slice(0, 30), ratio: +r.toFixed(2), size });
  }
  for (const el of document.querySelectorAll('button,select,summary,input,a[href]')) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (!inView(r)) continue;
    if (r.width < 48 || r.height < 48) small.push({ label: label(el), w: Math.round(r.width), h: Math.round(r.height) });
    // 떠 있는 이름표·안내가 버튼을 덮는지: 버튼 중심을 눌렀을 때 그 버튼이 잡히는가
    const hit = document.elementFromPoint(Math.min(innerWidth - 1, r.x + r.width / 2), Math.min(innerHeight - 1, r.y + r.height / 2));
    if (hit && hit !== el && !el.contains(hit) && !el.disabled) covered.push({ label: label(el), by: label(hit) });
  }
  fonts.sort((a, b) => a.size - b.size);
  return { minFont: fonts[0] || null, smallestFonts: fonts.slice(0, 3), lowContrast, unknownContrastCount: unknownContrast.size, small, covered, hOverflow: document.documentElement.scrollWidth > innerWidth + 2 };
}
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  await page.goto(DEV + '/');
  result.screens = [];
  for (const [w, h] of [[1920, 1080], [1280, 800], [1024, 768]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const route of ROUTES) {
      await seed(page, route);
      result.screens.push({ w, h, route, ...(await page.evaluate(measure)) });
    }
  }
  // 텍스트 200%: 브라우저 기본 글자 크기를 두 배로 바꾼 것과 같은 조건(root font-size 200%)
  await page.setViewportSize({ width: 1280, height: 800 });
  result.text200 = [];
  for (const route of ROUTES) {
    await seed(page, route);
    await page.addStyleTag({ content: 'html{font-size:200% !important}' });
    await page.waitForTimeout(150);
    const r = await page.evaluate(() => {
      const cut = [];
      for (const el of document.querySelectorAll('button')) {
        const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden' || !el.getClientRects().length) continue;
        if (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) if (/hidden|clip/.test(s.overflow)) cut.push((el.getAttribute('aria-label') || el.textContent).trim().slice(0, 30));
      }
      return { hOverflow: document.documentElement.scrollWidth > innerWidth + 2, clippedButtons: cut };
    });
    result.text200.push({ route, ...r });
  }
  await ctx.close();
}

// 4) 키보드: 첫 화면 Tab 순서·포커스 표시, 기록 대화상자 Esc 닫힘·포커스 복귀
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(DEV + '/');
  await seed(page, 'C00');
  const order = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => { const el = document.activeElement; const s = getComputedStyle(el); return { label: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24), ring: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2 }; }));
  }
  await seed(page, 'P06');
  await page.locator('[data-action="records"]').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const opened = await page.evaluate(() => !!document.querySelector('#modal-root')?.firstChild);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const closed = await page.evaluate(() => !document.querySelector('#modal-root')?.firstChild);
  const focusBack = await page.evaluate(() => document.activeElement?.getAttribute('data-action'));
  result.keyboard = { order, recordsOpened: opened, escCloses: closed, focusBack };
  await ctx.close();
}

// 5) 새로고침 복원·손상 저장·해금 재계산·뒤로가기
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => result.errors.push(e.message));
  await page.goto(DEV + '/');
  await seed(page, 'P06');
  await page.locator('[data-action="lab"][data-id="droplet"]').click();
  await page.waitForTimeout(200);
  await page.reload(); await page.waitForTimeout(600);
  const afterReload = await page.evaluate(() => ({ title: document.querySelector('h1')?.textContent?.trim(), tab: document.querySelector('[data-action="lab"][aria-pressed="true"],[data-action="lab"][aria-selected="true"],[data-action="lab"].active')?.getAttribute('data-id') ?? null }));
  // 손상 저장
  await page.evaluate(k => localStorage.setItem(k, '{broken'), KEY);
  await page.reload(); await page.waitForTimeout(600);
  const damaged = await page.evaluate(k => ({ appUp: !!document.querySelector('[data-action="start"],.page-content'), raw: localStorage.getItem(k), notice: (document.body.innerText.match(/[^\n]*(손상|읽지 못|복구)[^\n]*/) || [''])[0].slice(0, 80) }), KEY);
  // 해금 플래그만 손으로 켜고 잠긴 화면으로 진입
  await page.evaluate(async k => { const { fresh } = await import('/src/simulation/model.ts'); const s = fresh(); s.completed = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09']; s.evidence = ['E1', 'E2', 'E3', 'E4', 'E5']; s.route = 'P10'; s.lastRoute = 'P10'; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
  await page.reload(); await page.waitForTimeout(800);
  const forged = await page.evaluate(() => ({ title: document.querySelector('h1')?.textContent?.trim() ?? null, onMap: document.body.classList.contains('on-map'), onHome: document.body.classList.contains('on-home') }));
  // 뒤로가기: 지도에서 미션으로 들어간 뒤 브라우저 뒤로가기
  await seed(page, 'C01');
  const before = page.url();
  await page.goBack().catch(() => {});
  await page.waitForTimeout(500);
  const back = { before, after: page.url() };
  result.state = { afterReload, damaged, forged, back };
  await ctx.close();
}

fs.writeFileSync(path.join(out, 'release.json'), JSON.stringify(result, null, 1));
await browser.close();
const fails = result.screens.filter(s => s.hOverflow).length;
console.log(JSON.stringify({ load: result.load, offline: result.offline, keyboard: { escCloses: result.keyboard.escCloses, focusBack: result.keyboard.focusBack }, hOverflowScreens: fails, errors: result.errors.length }, null, 1));
