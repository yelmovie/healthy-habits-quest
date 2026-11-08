import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const out=path.resolve('../.tmp/one-screen-20261108');
fs.mkdirSync(path.join(out,'tmp'),{recursive:true});
process.env.TMPDIR=path.join(out,'tmp');process.env.XDG_CACHE_HOME=out;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:[`--disk-cache-dir=${out}/chrome-cache`,`--crash-dumps-dir=${out}/crashes`,'--disable-breakpad','--disable-crash-reporter']});
const ctx=await browser.newContext({viewport:{width:1280,height:800},reducedMotion:'reduce'});
const p=await ctx.newPage();p.setDefaultTimeout(8000);const checks=[],errors=[];
p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:5342');
const key='invisible-traces-science-save-v1';
const state=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const click=async(action,id)=>p.locator(`[data-action="${action}"]${id?`[data-id="${id}"]`:''}`).first().click();
const auto=()=>p.locator('.playback-toggle').click();
const speed=value=>p.locator('[data-select=playback-speed]').selectOption(String(value));
async function seed(route,{sealed=false,apply=false}={}){
 await p.evaluate(async({route,sealed,apply,key})=>{
  const {fixtureFor,derive}=await import('/src/simulation/model.ts');
  const s=fixtureFor(route==='P01'?1:route==='P05'||route==='P06'?sealed?4:3:5,{sound:false,reduced:true,large:false});
  if(route==='P05'){s.timeline.tick=0;s.timeline.source='';s.timeline.intervention=null;}
  if(route==='P06'&&!sealed){s.timeline.source='book';s.timeline.intervention=1.5;s.labs.done=['contact'];s.labs.values={};s.labs.synthesis=[];}
  if(route==='P08'){s.experiment={action:'washHands',prediction:'unsure',tick:0,pinned:'',explanation:'',baselineSeen:true};}
  if(apply){s.strategy={asked:[],placements:[{site:'classroom',actionId:'ventilation'},{site:'cafeteria',actionId:'portionFood'},{site:'gym',actionId:'washHands'}],simulated:true};s.final.phase='apply';}
  derive(s);s.route=route;s.lastRoute=route;localStorage.setItem(key,JSON.stringify(s));
 },{route,sealed,apply,key});await p.reload();await p.locator('.page-content').waitFor();
}
const tick=()=>p.locator('[data-range=timeline]').inputValue().then(Number);
try{
 await seed('P01');await speed(2);await auto();
 await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).found.length===3,key);
 assert.equal((await state()).route,'P01');assert.deepEqual((await state()).clues,[]);
 checks.push('automatic scan records three observations and stops before evidence selection');

 await seed('P05');await speed(.5);await auto();await p.waitForTimeout(1050);await auto();
 const slow=await tick();await p.waitForTimeout(400);assert.equal(await tick(),slow);
 await speed(2);await auto();await p.waitForTimeout(1050);await auto();const fast=(await tick())-slow;
 assert(slow>.25&&slow<.8);assert(fast>slow*2.7,`fast ${fast}, slow ${slow}`);
 const paused=await state();assert.equal(paused.timeline.source,'');assert.equal(paused.timeline.intervention,null);
 checks.push('0.5x/2x speed, pause/resume, and no automatic source/intervention answer');
 await auto();await p.waitForTimeout(250);await click('settings');const atModal=await tick();await p.waitForTimeout(400);assert.equal(await tick(),atModal);await p.locator('[data-modal=close]').click();
 assert.equal(await p.locator('.playback-toggle').getAttribute('aria-pressed'),'false');
 checks.push('opening settings stops playback and keeps the pause state');

 await seed('P06');await click('lab','droplet');await speed(2);await auto();
 await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).labs.values.droplet===1,key);
 assert((await state()).labs.done.includes('droplet'));assert.deepEqual((await state()).labs.synthesis,[]);
 await click('lab','water');assert.equal(await p.locator('.playback-toggle').count(),0);assert.equal((await state()).labs.values.water,undefined);
 await click('lab','synthesis');assert.equal(await p.locator('.playback-toggle').count(),0);assert.deepEqual((await state()).labs.synthesis,[]);
 checks.push('lab demonstration completes observation; water and synthesis remain manual');

 await seed('P06');await click('lab','air');await speed(.5);await auto();await click('lab','water');await p.waitForTimeout(2200);assert.equal((await state()).labs.values.air,undefined);
 checks.push('switching experiments cancels pending automatic steps');

 await seed('P06',{sealed:true});await click('lab','droplet');const sealedBefore=await state();await speed(2);await auto();await p.waitForTimeout(1250);assert.deepEqual(await state(),sealedBefore);
 checks.push('automatic replay preserves completed research records');

 await seed('P08');await speed(2);await auto();await p.waitForFunction(()=>document.querySelector('[data-range=comparison]').value==='5');
 assert.equal((await state()).experiment.pinned,'');assert.equal((await state()).experiment.explanation,'');assert.equal((await state()).completed.includes('P08'),false);
 checks.push('comparison plays at the chosen speed and waits for the learner to mark/explain');

 await seed('P09');await click('questions');await p.locator('[data-modal=question]').first().click();
 assert.equal((await state()).strategy.asked.length,1);await p.locator('[data-modal=question]').first().click();assert.equal((await state()).strategy.asked.length,1);
 await p.locator('[data-modal=close]').click();assert.equal(await p.locator('[data-action=questions] b').textContent(),'2');
 checks.push('question dialog updates the remaining count and re-reading costs no extra question');

 await seed('P10',{apply:true});const plan=structuredClone((await state()).strategy.placements);await speed(2);await auto();
 await p.getByRole('heading',{name:'우리의 발견이 학교를 바꿨어요.'}).waitFor();
 assert.equal((await state()).final.applied.length,3);assert.deepEqual((await state()).strategy.placements,plan);assert.deepEqual((await state()).strategy.asked,[]);
 checks.push('automatic practice carries out only the chosen plan and reaches the ending');

 assert.equal(errors.length,0);console.log(JSON.stringify({pass:true,checks,errors},null,2));
}finally{fs.writeFileSync(path.join(out,'playback-results.json'),JSON.stringify({checks,errors},null,2));await browser.close();}
