// 실제 버튼만 눌러 새 기록에서 메인→지도→P01~P10→인증서까지 완주한다. 안 눌리는 버튼·막힌 흐름을 찾는다.
// 사용: dev 서버를 띄운 뒤 PORT=<포트> OUT=<결과 폴더> node scripts/check-flow.mjs [너비] [높이]
//       운영 주소는 URL=<주소> 로 같은 완주를 돌린다.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve(process.env.OUT || '../.tmp/flow-check');
fs.mkdirSync(out, { recursive: true });
const [width, height] = [Number(process.argv[2] || 1280), Number(process.argv[3] || 800)];
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: [`--disk-cache-dir=${out}/chrome-cache`, '--disable-breakpad', '--disable-crash-reporter'],
});
const touch = process.env.TOUCH === '1';
const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text()); });
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
page.setDefaultTimeout(15000);
const steps = [];
const KEY = 'invisible-traces-science-save-v1';
const save = () => page.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), KEY);
const click = async (selector, note = selector) => {
  const target = page.locator(selector).first();
  if (touch) await target.tap(); else await target.click();
  steps.push(note); await page.waitForTimeout(120);
};
const point = (x, y) => touch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y);
// 작은 화면은 장소·단서를 하나씩 보여 준다. 대상이 안 보이면 화면에 있는 탭을 먼저 눌러 꺼낸다.
const visible = sel => page.locator(sel).first().isVisible();
async function reveal(target, ...tabs) { if (await visible(target)) return; for (const tab of tabs) { if (await visible(tab)) { await click(tab, `tab ${tab}`); if (await visible(target)) return; } } }
const shot = name => page.screenshot({ path: path.join(out, `${width}x${height}-${name}.png`) });
async function next(route) {
  await page.locator('.actionbar [data-action="next"]:not([disabled])').click();
  await page.locator(`.activity-layout[data-page="${route}"]`).waitFor();
  steps.push(`→ ${route}`);
}
let failed = '';
try {
  await page.goto(process.env.URL || `http://127.0.0.1:${process.env.PORT || 5175}/`);
  await page.evaluate(k => { localStorage.clear(); localStorage.setItem('flow-check', '1'); }, KEY);
  await page.reload();
  await click('[data-action="settings"]', 'settings');
  for (const key of ['music', 'sfx', 'voice']) await page.locator(`[data-setting="${key}"]`).uncheck();
  await click('[data-modal="close"]', 'close settings');
  await click('[data-action="start"]', 'start');
  await page.locator('.story-film-skip').click();
  await page.locator('.map-next-cue').waitFor();
  await page.waitForTimeout(1500);
  await click('.map-next-cue', 'map next mission');
  await page.locator('.activity-layout[data-page="P01"]').waitFor({ timeout: 20000 });

  for (const site of ['classroom', 'cafeteria', 'gym']) { await reveal(`[data-action="discover"][data-id="${site}"]`, `[data-action="site-preview"][data-id="${site}"]`); const spot = { classroom: [30, 52], cafeteria: [50, 80], gym: [46, 72] }[site];
    const box = await page.locator(`.obs-site-visual[data-scan="${site}"]`).boundingBox();
    // 돋보기 탐색: 흔적 자리 밖을 누르면 찾지 못하고, 흔적 자리를 누르면 찾는다.
    await point(box.x + box.width * .9, box.y + box.height * .12); steps.push(`P01 miss ${site}`); await page.waitForTimeout(120);
    if ((await save()).found?.includes(site)) throw new Error(`P01 found ${site} without reaching the hidden trace`);
    await point(box.x + box.width * spot[0] / 100, box.y + box.height * spot[1] / 100); steps.push(`P01 ${site}`); await page.waitForTimeout(150); }
  await shot('P01'); await next('P02');

  for (const [site, clues] of [['classroom', ['CL01', 'CL05', 'CL06']], ['cafeteria', ['CL04']], ['gym', ['CL02', 'CL03']]]) {
    if (await visible(`.obs-site-tabs [data-action="site"][data-id="${site}"]`)) await click(`.obs-site-tabs [data-action="site"][data-id="${site}"]`, `P02 ${site}`);
    else { await reveal('.obs-site-picker select', '[data-action="focus"][data-id="clues"]'); await page.locator('.obs-site-picker select').selectOption(site); steps.push(`P02 pick ${site}`); await page.waitForTimeout(150); }
    for (const c of clues) await click(`.clue-scene [data-action="clue"][data-id="${c}"]`, `P02 ${c}`);
  }
  if ((await save()).completed.includes('P02')) throw new Error('P02 accepted the unrelated clock clue');
  await click('[data-action="remove-clue"][data-id="CL06"]', 'P02 replace unrelated clock');
  await page.locator('.clue-field-note').getByText('간식 먹기 전').waitFor();
  await shot('P02-evidence');
  await page.reload();
  await page.locator('.activity-layout[data-page="P02"]').waitFor();
  const evidence = (await save()).clues;
  if (!evidence.includes('CL03') || evidence.includes('CL06') || evidence.length !== 5) throw new Error('P02 clue replacement failed to persist');
  await shot('P02'); await next('P03');

  for (const [clue, target] of [['CL02', 'contact'], ['CL03', 'contact'], ['CL01', 'shared-environment'], ['CL05', 'respiratory']]) {
    await reveal(`[data-action="select-clue"][data-id="${clue}"]`, '[data-action="focus"][data-id="sources"]');
    await click(`[data-action="select-clue"][data-id="${clue}"]`, `P03 ${clue}`);
    await reveal(`[data-action="link-target"][data-id="${target}"]`, '[data-action="focus"][data-id="targets"]');
    await click(`[data-action="link-target"][data-id="${target}"]`, `P03 → ${target}`);
  }
  await shot('P03'); await next('P04');

  for (const [effect, domain] of [['IM01', 'self'], ['IM02', 'others'], ['IM03', 'school']]) {
    await click(`[data-action="impact-domain"][data-id="${domain}"]`, `P04 → ${domain}`);
    if ((await save()).impacts[domain] !== effect) throw new Error(`P04 failed to connect ${effect} to ${domain}`);
  }
  await shot('P04'); await next('P05');

  await click('[data-action="source"][data-id="book"]', 'P05 book');
  await click('[data-action="intervene"][data-id="1.5"]', 'P05 early wash');
  if ((await save()).completed.includes('P05')) throw new Error('P05 finished after a single wash timing');
  await click('[data-action="intervene"][data-id="4.5"]', 'P05 late wash');
  await shot('P05'); await next('P06');

  for (const lab of ['droplet', 'air', 'saliva']) {
    await click(`.lab-tabs [data-action="lab"][data-id="${lab}"]`, `P06 tab ${lab}`);
    // 기침하는 인물, 창문, 개인 접시 그림을 각각 누른다.
    const picture = `.tracing-device [data-action="lab-set"][data-id="${lab}"]`;
    if (lab === 'air' && !touch) {
      // Keyboard activation must work on the same window and preserve focus after the image changes.
      await page.locator(picture).focus(); await page.keyboard.press('Enter'); steps.push('P06 window Enter');
      if (!await page.locator(`${picture}[data-value="0"]`).evaluate(el => el === document.activeElement)) throw new Error('P06 window lost keyboard focus');
      await page.keyboard.press('Space'); steps.push('P06 window Space');
      if ((await save()).labs.values.air !== 0) throw new Error('P06 window could not be closed from the same picture');
    }
    await click(`${picture}[data-value="1"]`, `P06 ${lab}`);
  }
  await click('.lab-tabs [data-action="lab"][data-id="water"]', 'P06 tab water');
  await click('[data-action="water"][data-id="1"]', 'P06 water');
  await click('.lab-tabs [data-action="lab"][data-id="synthesis"]', 'P06 tab synthesis');
  for (const id of ['coughEtiquette', 'ventilation']) await click(`[data-action="synthesis"][data-id="${id}"]`, `P06 ${id}`);
  await shot('P06'); await next('P07');

  await click('[data-action="experiment-action"][data-id="washHands"]', 'P07 wash hands');
  await click('[data-action="predict"][data-id="fewer"]', 'P07 predict');
  await page.locator('.activity-layout[data-page="P08"]').waitFor();
  const difference = '.experiment-picture [data-action="difference"]';
  await page.locator(difference).waitFor({ timeout: 20000 });
  await click(difference, 'P08 mark the hand in picture B');
  await click('[data-action="explain"][data-id="hand-object-contact"]', 'P08 explain');
  await click('[data-action="reflect"][data-id="matched"]', 'P08 reflect without grading');
  await shot('P08'); await next('P09');

  for (const [action, site] of [['ventilation', 'classroom'], ['portionFood', 'cafeteria'], ['washHands', 'gym']]) {
    await click(`[data-action="strategy-action"][data-id="${action}"]`, `P09 ${action}`);
    await reveal(`[data-action="place"][data-id="${site}"]`, `.strategy-place-tabs [data-action="focus"][data-id="${site}"]`);
    await click(`[data-action="place"][data-id="${site}"]`, `P09 → ${site}`);
  }
  await click('[data-action="simulate"]', 'P09 simulate');
  await shot('P09'); await next('P10');

  await click('.strategy-apply [data-action="apply"]', 'P10 window');
  await page.waitForTimeout(1500);
  await click('.final-serving .personal-plate', 'P10 plate');
  await page.waitForTimeout(1500);
  for (const zone of ['palm', 'back', 'fingers']) for (let i = 0; i < 3; i++) await click(`[data-action="hand-zone"][data-id="${zone}"]`, `P10 ${zone}`);
  await page.locator('.ending-card').waitFor({ timeout: 5000 });
  await shot('P10-ending');
  const outro = page.locator('.story-film-skip');
  if (await outro.isVisible()) await outro.click();
  await click('[data-action="certificate"]', 'certificate');
  await page.locator('.strategy-ending.certificate').waitFor();
  const s = await save();
  if (!s.completed?.includes('P10') || s.evidence?.length !== 5) throw new Error(`incomplete record: ${JSON.stringify(s.completed)}`);
} catch (e) {
  failed = e.message.split('\n')[0];
  await page.screenshot({ path: path.join(out, `${width}x${height}-failure.png`) }).catch(() => {});
}
const result = { width, height, ok: !failed && !errors.length, failed, errors, clicks: steps.length, steps };
fs.writeFileSync(path.join(out, `flow-${width}x${height}.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ width, height, ok: result.ok, failed, errors: errors.slice(0, 5), clicks: steps.length, last: steps.slice(-3) }));
await browser.close();
if (!result.ok) process.exitCode = 1;
