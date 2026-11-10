import {chromium} from 'playwright';
import fs from 'node:fs';
const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const p=await b.newPage({viewport:{width:915,height:412}});await p.goto('http://127.0.0.1:5488');
for(const route of ['P05','P09']){
 await p.evaluate(async route=>{const {fixtureFor,derive}=await import('/src/simulation/model.ts');const s=fixtureFor(5,{sound:false,reduced:true});derive(s);s.route=route;s.lastRoute=route;localStorage.setItem('invisible-traces-science-save-v1',JSON.stringify(s));},route);await p.reload();await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`docs/reviews/overnight-20261110/${process.argv[2]||'before'}-915-${route}.png`});
 if(route==='P09'){await p.locator('[data-action="strategy-action"][data-id="personalItems"]').click();await p.locator('[data-action=place][data-id=gym]').click();await p.locator('[data-action=simulate]').click();await p.waitForTimeout(2000);await p.screenshot({path:`docs/reviews/overnight-20261110/${process.argv[2]||'before'}-915-selected.png`});console.log(await p.locator('.strategy-selection-hint').evaluate(el=>({text:el.textContent,client:[el.clientWidth,el.clientHeight],scroll:[el.scrollWidth,el.scrollHeight],rect:el.getBoundingClientRect().toJSON()})));}
}
await b.close();
