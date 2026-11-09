// 연구 기록 > 핵심 개념 세 장면 > 기침 예절 영상이 실제로 재생되는지 확인한다(헤드리스 Chrome은 webm 재생).
// 사용: dev 또는 preview 서버를 띄운 뒤 URL=http://127.0.0.1:5130/ OUT=<폴더> node scripts/check-concept-film.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const url = process.env.URL || 'http://127.0.0.1:5130/';
const out = path.resolve(process.env.OUT || '../.tmp/concept-film'); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const results = [];
for (const [w, h, reduced] of [[1280, 800, false], [1024, 768, false], [915, 412, false], [1920, 1080, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url);
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-action="records"]:visible').first().click();
  await page.locator('.science-recall summary').click();
  const video = page.locator('.science-recall-film video');
  await video.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const poster = await page.evaluate(async () => { const v = document.querySelector('.science-recall-film video'); const r = await fetch(v.poster); return { status: r.status, autoplay: v.autoplay, paused: v.paused }; });
  await page.screenshot({ path: path.join(out, `${w}x${h}-poster.png`) });
  const played = await page.evaluate(async () => {
    const v = document.querySelector('.science-recall-film video');
    await v.play();
    await new Promise(r => setTimeout(r, 1500));
    return { currentSrc: v.currentSrc.split('/').pop(), readyState: v.readyState, duration: +v.duration.toFixed(2), currentTime: +v.currentTime.toFixed(2), w: v.videoWidth, h: v.videoHeight, box: Math.round(v.getBoundingClientRect().width) };
  });
  const fig = await page.evaluate(() => { const f = document.querySelector('.science-recall-film figcaption'); return { font: parseFloat(getComputedStyle(f).fontSize), hOverflow: document.documentElement.scrollWidth > innerWidth + 2 }; });
  results.push({ w, h, reduced, poster, played, fig, errors });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'concept-film.json'), JSON.stringify(results, null, 1));
console.log(JSON.stringify(results));
const bad = results.filter(r => r.played.readyState < 3 || Math.abs(r.played.duration - 13.5) > 0.2 || r.poster.status !== 200 || r.errors.length || r.fig.hOverflow);
if (bad.length) { console.error('FAIL', bad.length); process.exitCode = 1; }
