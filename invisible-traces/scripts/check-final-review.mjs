// 로컬 전용 회귀 재현. 실기기 검증을 대신하지 않는다.
// BASE=http://127.0.0.1:5433/ OUT=.tmp/final-review-20261123 node --import tsx scripts/check-final-review.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {DATA} from '../src/data/game.ts';
import {fixtureFor,derive,placementKey,fresh} from '../src/simulation/model.ts';
const base=process.env.BASE||'http://127.0.0.1:5433/';
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('이 회귀 도구는 로컬 미리보기만 허용합니다.');
const out=path.resolve(process.env.OUT||'.tmp/final-review-20261123');fs.mkdirSync(out,{recursive:true});
const KEY='invisible-traces-science-save-v1',settings={music:false,sfx:false,voice:false,reduced:true,large:false};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--mute-audio','--disable-breakpad']});
const results=[];
async function run(name,seed,fn,{size=[1024,768],large=false,failedVideo=false}={}){
 const context=await browser.newContext({viewport:{width:size[0],height:size[1]},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'});
 seed.settings={...settings,large};const page=await context.newPage();const errors=[];
 page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(([k,s])=>{if(!localStorage.getItem(k))localStorage.setItem(k,JSON.stringify(s));},[KEY,seed]);
 if(failedVideo)await page.route('**/assets/story/*.mp4',r=>r.abort());
 const save=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
 const tap=async(selector)=>{await page.locator(selector).first().tap();};
 const shot=async(tag='')=>page.screenshot({path:path.join(out,name+(tag?'-'+tag:'')+'.png')});
 try{await page.goto(base,{waitUntil:'load'});await fn({page,save,tap,shot});assert.deepEqual(errors,[]);results.push({name,ok:true,viewport:size,large,touchEmulation:true,errors});}
 catch(e){await shot('failure').catch(()=>{});results.push({name,ok:false,error:e.message,errors});}
 finally{await context.close();}
 console.log(JSON.stringify(results.at(-1)));
}
function stage(n,route){const s=fixtureFor(n,settings);s.route=route;s.lastRoute=route;if(route==='P06'){s.timeline.source='book';s.timeline.intervention=1.5;s.timeline.tried=[4.5,1.5];derive(s);}return s;}
function finalSeed(){const s=stage(5,'P10');s.strategy={asked:[],placements:[{site:'classroom',actionId:'ventilation'},{site:'cafeteria',actionId:'portionFood'},{site:'gym',actionId:'washHands'}],simulated:true};s.final.applied=s.strategy.placements.slice(0,2).map(placementKey);s.final.hands=['palm','back'];s.final.phase='apply';return derive(s);}
async function finish({page}){await page.locator('[data-action="hand-zone"][data-id="fingers"]').focus();await page.keyboard.press('Enter');await page.locator('.ending-card').waitFor();}
async function certificateStays({page,save,shot}){await page.locator('[data-cert-paper]').waitFor();await page.waitForTimeout(1900);assert.equal(await page.locator('.story-film-dialog').count(),0);assert.equal((await save()).final.phase,'certificate');assert.equal((await save()).evidence.length,5);assert.ok((await save()).completed.includes('P10'));await shot();}
try{
 await run('p01-touch-scene',stage(1,'P01'),async({page,save,shot})=>{
  assert.match(await page.locator('.trace-model-notice').innerText(),/모형에서 옮겨 가는 흔적/);
  for(const [id,x,y] of [['classroom',.30,.52],['cafeteria',.50,.80],['gym',.46,.72]]){
   const box=await page.locator(`[data-scan="${id}"]`).boundingBox();
   await page.touchscreen.tap(box.x+x*box.width,box.y+y*box.height);
  }
  assert.ok((await save()).completed.includes('P01'));await shot();
 });
 const clues=stage(2,'P02');clues.clues=[...DATA.p02.requiredClues.slice(0,4),'CL06'];derive(clues);
 await run('p02-review-all-candidates',clues,async({page,save,tap,shot})=>{
  assert.equal(await page.locator('.reviewing .evidence-slot.filled').count(),5);
  assert.equal(await page.locator('.needs-recheck').count(),0);
  await tap('[data-action="clue"][data-id="CL05"]');assert.deepEqual((await save()).clues,clues.clues);
  await tap('[data-action="remove-clue"][data-id="CL06"]');assert.deepEqual(new Set((await save()).clues),new Set(DATA.p02.requiredClues));assert.ok((await save()).completed.includes('P02'));await shot();
 });
 await run('p03-condition-and-retry',stage(2,'P03'),async({page,save,tap,shot})=>{
  await tap('[data-action="model-info"]');
  assert.match(await page.locator('.guide-goal').innerText(),/같은 변화/);
  await tap('[data-modal="close"]');
  await tap('[data-action="select-clue"][data-id="CL01"]');await tap('[data-action="link-target"][data-id="contact"]');assert.equal((await save()).relations.CL01,undefined);
  await tap('[data-action="link-target"][data-id="shared-environment"]');assert.equal((await save()).relations.CL01,'shared-environment');await shot();
 });
 await run('p06-overlap-and-clear-water',stage(3,'P06'),async({page,save,tap,shot})=>{
  await tap('[data-action="model-info"]');
  await page.getByText('그림을 읽는 약속').click();
  assert.match(await page.locator('.activity-guide .modal').innerText(),/비말과 공기 중 작은 입자는 함께/);
  await tap('[data-modal="close"]');
  assert.equal(await page.locator('.lab-tabs [data-id="contact"]').count(),0);
  await tap('.lab-tabs [data-id="water"]');await tap('[data-action="water"][data-id="2"]');assert.match(await page.locator('.tracing-device-result').innerText(),/투명해도 안전한지/);assert.ok(!(await save()).labs.done.includes('water'));
  await tap('[data-action="water"][data-id="1"]');assert.ok((await save()).labs.done.includes('water'));await shot();
 });
 for(const prediction of ['fewer','same','unsure'])await run(`p08-prediction-${prediction}`,stage(4,'P07'),async({page,save,tap,shot})=>{
  await tap('[data-action="experiment-action"][data-id="washHands"]');await tap(`[data-action="predict"][data-id="${prediction}"]`);
  await page.locator('[data-range="comparison"]').focus();await page.keyboard.press('End');assert.equal(await page.locator('[data-action="difference"]').count(),3);
  await tap('[data-action="difference"][data-id="center"]');assert.equal((await save()).experiment.pinned,'');
  await tap('[data-action="difference"][data-id="left"]');
  assert.equal((await save()).experiment.prediction,prediction);assert.match(await page.locator('.prediction-record').innerText(),/내 예상/);
  await tap('[data-action="explain"][data-id="shared-cup-contact"]');assert.equal((await save()).experiment.explanation,'');
  await tap('[data-action="explain"][data-id="hand-object-contact"]');assert.equal(await page.locator('.actionbar [data-action="next"]').count(),0);
  await tap('[data-action="reflect"][data-id="different"]');assert.ok((await save()).completed.includes('P08'));assert.equal((await save()).experiment.prediction,prediction);
  await page.reload();assert.equal((await save()).experiment.reflection,'different');await shot();
 });
 await run('p09-one-scene-hint',stage(5,'P09'),async({page,save,tap,shot})=>{
  await tap('[data-action="strategy-action"][data-id="portionFood"]');await tap('[data-action="place"][data-id="cafeteria"]');const before=(await save()).strategy.placements;
  await tap('[data-action="strategy-action"][data-id="ventilation"]');await tap('[data-action="place"][data-id="gym"]');assert.deepEqual((await save()).strategy.placements,before);assert.match(await page.locator('#toast').innerText(),/음식을 먹기 전의 손/);
  await tap('[data-action="strategy-action"][data-id="ventilation"]');
  await tap('[data-action="simulate"]');assert.match(await page.locator('.next-instruction').innerText(),/남은 연결/);
  await tap('[data-action="strategy-action"][data-id="ventilation"]');await tap('[data-action="place"][data-id="classroom"]');await tap('[data-action="strategy-action"][data-id="washHands"]');await tap('[data-action="place"][data-id="gym"]');await tap('[data-action="simulate"]');assert.ok((await save()).completed.includes('P09'));await shot();
 });
 await run('certificate-immediate',finalSeed(),async(ctx)=>{assert.match(await ctx.page.locator('.wash-practice-note').innerText(),/게임에서는 세 부위/);assert.match(await ctx.page.locator('.wash-real-guide').innerText(),/흐르는 물과 비누로 30초 이상/);await ctx.shot('wash-guide');await finish(ctx);await ctx.tap('[data-action="certificate"]');await certificateStays(ctx);await ctx.page.reload();await ctx.page.locator('[data-cert-paper]').waitFor();assert.equal((await ctx.save()).final.phase,'certificate');});
 await run('certificate-after-1600ms',finalSeed(),async(ctx)=>{await finish(ctx);await ctx.page.locator('.story-film-dialog').waitFor();assert.equal(await ctx.page.locator('.story-film-dialog video').evaluate(v=>v.muted),true);await ctx.tap('.story-film-certificate');await certificateStays(ctx);});
 await run('certificate-after-skip',finalSeed(),async(ctx)=>{await finish(ctx);await ctx.page.locator('.story-film-dialog').waitFor();await ctx.tap('.story-film-skip');await ctx.tap('[data-action="certificate"]');await certificateStays(ctx);});
 await run('certificate-video-failure',finalSeed(),async(ctx)=>{await finish(ctx);await ctx.page.locator('.story-film-dialog [role="status"]').filter({hasText:'지금은 영상을'}).waitFor();await ctx.tap('.story-film-certificate');await certificateStays(ctx);},{failedVideo:true});
 await run('intro-video-failure-muted',fresh(),async({page,tap,shot})=>{await tap('[data-action="start"]');await page.locator('.story-film-dialog [role="status"]').filter({hasText:'지금은 영상을'}).waitFor();assert.equal(await page.locator('.story-film-dialog video').evaluate(v=>v.muted),true);await tap('.story-film-skip');await page.locator('.map-next-cue').waitFor();await shot();},{failedVideo:true});
 for(const [w,h,large] of [[1280,800,false],[1024,768,true],[915,412,false],[390,844,false]])await run(`wash-layout-${w}x${h}${large?'-large':''}`,finalSeed(),async({page,shot})=>{
  await page.locator('.wash-real-guide').scrollIntoViewIfNeeded();assert.ok(await page.locator('.wash-real-guide').isVisible());
  const geometry=await page.locator('.wash-steps').evaluate(el=>{const parent=el.getBoundingClientRect(),guide=el.querySelector('.wash-real-guide').getBoundingClientRect(),note=el.querySelector('.wash-practice-note').getBoundingClientRect();return {wide:guide.width>=parent.width*.9,ordered:guide.top>note.bottom};});assert.deepEqual(geometry,{wide:true,ordered:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  const small=await page.locator('.hand-zone').evaluateAll(es=>es.map(e=>e.getBoundingClientRect()).some(r=>r.width<48||r.height<48));assert.equal(small,false);await shot();
 },{size:[w,h],large});
}finally{await browser.close();fs.writeFileSync(path.join(out,'regression.json'),JSON.stringify({base,physicalDevice:false,results},null,2));}
if(results.some(r=>!r.ok))process.exitCode=1;
