import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const ctx=await browser.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();let errors=[];p.on('pageerror',e=>errors.push(String(e)));
await p.goto('http://127.0.0.1:5342');await p.waitForTimeout(500);
const key='invisible-traces-science-save-v1';
await p.locator('[data-action=teacher]').click();await p.locator('[data-modal=unlock]').click();await p.waitForTimeout(500);
const raw=await p.evaluate(k=>localStorage.getItem(k),key);
await p.locator('[data-action=stage][data-id="1"]').first().click();await p.waitForTimeout(2400);
await p.locator('[data-action=discover]').first().click();
await p.locator('[data-action=settings]').click();await p.locator('[data-setting=large]').check();await p.locator('[data-modal=close]').click();
if(await p.evaluate(k=>localStorage.getItem(k),key)!==raw)throw Error('Teacher demo changed persistent save');
await p.locator('[data-action=exit-replay]').click();
let screens=[];
for(const size of [{width:1280,height:800},{width:915,height:412},{width:390,height:844}]){
 await p.setViewportSize(size);
 for(let n=1;n<=5;n++)for(let offset=0;offset<2;offset++){
  await p.evaluate(async({n,offset,key})=>{const {fixtureFor}=await import('/src/simulation/model.ts');const s=fixtureFor(n,{sound:false,reduced:true,large:false});s.route='P'+String(n*2-1+offset).padStart(2,'0');s.lastRoute=s.route;localStorage.setItem(key,JSON.stringify(s));},{n,offset,key});
  await p.reload();await p.waitForTimeout(130);
  const dims=await p.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).length}));
  if(dims.sw>dims.w+1||dims.broken)throw Error(JSON.stringify({size,n,offset,dims}));
  screens.push({size,route:'P'+String(n*2-1+offset).padStart(2,'0'),...dims});
  if(n===4&&offset===0)await p.screenshot({path:`docs/reviews/series12-qa/p07-${size.width}.png`,fullPage:true});
 }
}
await p.evaluate(k=>localStorage.setItem(k,'{bad'),key);await p.reload();await p.waitForTimeout(300);
if(!await p.locator('.storage-warning').isVisible())throw Error('Missing persistent warning');
await p.locator('[data-action=start]').click();if(await p.evaluate(k=>localStorage.getItem(k),key)!=='{bad')throw Error('Corrupt save overwritten');
fs.writeFileSync('docs/reviews/series12-qa/results.json',JSON.stringify({teacherIsolation:true,corruptSaveProtected:true,screens,errors},null,2));
await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log('PASS teacher isolation, corrupt save protection, 30 responsive activity screens');
