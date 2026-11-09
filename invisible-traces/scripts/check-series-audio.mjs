import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {join,extname} from 'node:path';
import assert from 'node:assert/strict';
const root='/Volumes/T7 Shield/iscreammedia_sc34';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const results=[];
try{for(const folder of ['9 things','10 earthsea','11 sound','12 diseases/invisible-traces']){
 const server=createServer(async(req,res)=>{try{const path=join(root,folder,'dist',decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));const body=await readFile(path);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.m4a':'audio/mp4','.mp3':'audio/mpeg','.ogg':'audio/ogg','.json':'application/json'})[extname(path)]||'application/octet-stream');res.end(body);}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const page=await browser.newPage({serviceWorkers:'block',viewport:{width:1024,height:768}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
 await page.addInitScript(()=>{window.npcAudios=[];window.pendingNpc=[];window.deferNpc=false;const NativeAudio=window.Audio;window.Audio=function(src){const a=new NativeAudio(src);if(src?.includes('npc-welcome')){window.npcAudios.push(a);const play=a.play.bind(a);a.play=()=>play().then(()=>window.deferNpc?new Promise(resolve=>window.pendingNpc.push(resolve)):undefined);}return a;};});
 await page.goto(`http://127.0.0.1:${server.address().port}`,{waitUntil:'networkidle'});
 const nine=folder.startsWith('9 ');if(nine)await page.getByRole('button',{name:'공방으로 출발!'}).click();
 const trigger=page.getByRole('button',{name:nine?'안내 음성 듣기':'안내자 목소리 듣기',exact:true});await trigger.click();
 if(!nine)await page.getByRole('button',{name:'목소리 재생',exact:true}).click();
 await page.waitForTimeout(700);
 const audio=await page.evaluate(()=>({time:npcAudios.at(-1).currentTime,paused:npcAudios.at(-1).paused,duration:npcAudios.at(-1).duration}));assert(audio.time>0&&!audio.paused,JSON.stringify(audio));
 await page.getByRole('button',{name:nine?'안내 음성 멈추기':'목소리 멈추기',exact:true}).click();assert(await page.evaluate(()=>npcAudios.at(-1).paused));
 await page.getByRole('button',{name:nine?'안내 음성 듣기':'목소리 재생',exact:true}).click();
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});assert(await page.evaluate(()=>npcAudios.at(-1).paused));
 await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>false}));
 if(!nine){await page.getByRole('button',{name:'닫기',exact:true}).click();await trigger.click();await page.getByRole('button',{name:'목소리 재생',exact:true}).click();await page.getByRole('button',{name:'닫기',exact:true}).click();assert(await page.evaluate(()=>npcAudios.at(-1).paused));}
 if(nine){await page.evaluate(()=>window.deferNpc=true);await page.getByRole('button',{name:'안내 음성 듣기',exact:true}).click();await page.waitForTimeout(100);await page.getByRole('button',{name:'안내 음성 멈추기',exact:true}).click();await page.getByRole('button',{name:'안내 음성 듣기',exact:true}).click();await page.waitForTimeout(100);await page.evaluate(()=>window.pendingNpc[0]());await page.waitForTimeout(50);assert(!(await page.evaluate(()=>npcAudios.at(-1).paused)));await page.getByRole('button',{name:'안내 음성 멈추기',exact:true}).click();}
 assert.deepEqual(errors,[]);results.push({folder,audio,stop:true,hidden:true,close:!nine,deferredPlayStopPlay:nine,errors});
 }finally{await page.close();await new Promise(r=>server.close(r));}
}}finally{await browser.close();}
console.log(JSON.stringify(results,null,2));await writeFile(join(root,'12 diseases/invisible-traces/docs/reviews/audio-lifecycle-20261109.json'),JSON.stringify(results,null,2));
