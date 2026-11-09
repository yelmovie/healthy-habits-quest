import {chromium} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const ctx=await browser.newContext({viewport:{width:1180,height:820}});const p=await ctx.newPage();p.setDefaultTimeout(10000);const errors=[],routes=[];p.on('pageerror',e=>errors.push(String(e)));
const key='invisible-traces-science-save-v1';const state=()=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const click=async(a,id)=>{await p.locator(`[data-action="${a}"]${id===undefined?'':`[data-id="${id}"]`}`).first().click();};
const next=async()=>{routes.push((await state()).route);await click('next');};
try{
await p.goto(`http://127.0.0.1:${process.env.PORT||5342}`);assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),null);await click('start');await click('stage','1');await p.locator('[data-action=discover]').first().waitFor();
for(const id of ['classroom','cafeteria','gym'])await click('discover',id);await next();
for(const [site,ids]of [['classroom',['CL01','CL05']],['gym',['CL02','CL03']],['cafeteria',['CL04']]]){await click('site',site);for(const id of ids)await click('clue',id);}await next();
for(const [id,target]of [['CL01','shared-environment'],['CL05','respiratory'],['CL02','contact'],['CL03','contact'],['CL04','meal']]){await click('select-clue',id);await click('link-target',target);}await next();
for(const [id,target]of [['IM01','self'],['IM02','others'],['IM03','school']]){await click('select-effect',id);await click('impact-domain',target);}await next();
await click('source','book');await click('intervene','1.5');await next();
await click('lab','droplet');await click('lab-set','droplet');await click('lab','air');await p.locator('[data-action=lab-set][data-id=air][data-value="1"]').click();await click('lab','water');await click('water','1');await click('lab','saliva');await click('lab-set','saliva');await click('lab','synthesis');await click('synthesis','coughEtiquette');await click('synthesis','ventilation');await next();
await click('experiment-action','washHands');routes.push((await state()).route);await click('predict','unsure');await p.waitForFunction(()=>!document.querySelector('[data-action=difference]')?.disabled);await click('difference');await p.locator('[data-select=explanation]').selectOption('hand-object-contact');await next();
for(const [id,site]of [['ventilation','classroom'],['portionFood','cafeteria'],['washHands','gym']]){await click('strategy-action',id);await click('place',site);}await click('simulate');await next();
await click('begin-apply');await click('apply','classroom:ventilation');await p.waitForTimeout(850);await click('apply','cafeteria:portionFood');await p.waitForTimeout(850);for(const id of ['palm','back','fingers'])await click('hand-zone',id);
await p.getByRole('heading',{name:'우리의 발견이 학교를 바꿨어요.'}).waitFor();routes.push((await state()).route);assert.equal((await state()).completed.length,10);assert.equal((await state()).evidence.length,5);await click('certificate');await p.getByRole('heading',{name:'학교 과학 조사 인증서'}).waitFor();await p.screenshot({path:'docs/reviews/series12-qa/full-play-certificate.png',fullPage:true});
const before=await state();await p.reload();await p.getByRole('heading',{name:'학교 과학 조사 인증서'}).waitFor();assert.deepEqual(await state(),before);
await click('map');await click('stage','1');await p.locator('[data-action=discover]').first().waitFor();assert.deepEqual((await state()).completed,before.completed);await click('exit-replay');assert.deepEqual((await state()).completed,before.completed);
assert.equal(errors.length,0);fs.writeFileSync('docs/reviews/series12-qa/full-play-results.json',JSON.stringify({pass:true,routes,completed:before.completed,evidence:before.evidence,certificateReload:true,replayPreserves:true,errors},null,2));console.log('PASS fresh UI-only P01-P10, ending/certificate, reload, replay preservation');
}catch(e){await p.screenshot({path:'docs/reviews/series12-qa/full-play-failure.png',fullPage:true});console.log('state',await state());throw e;}finally{await browser.close();}
