import test from 'node:test';
import assert from 'node:assert/strict';

// Stand-ins for the browser: a Web Audio context that records sources, and a small DOM for the encounter layer.
class Param{value=0;setValueAtTime(){}linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}}
class Source{buffer:unknown=null;playbackRate=new Param();frequency=new Param();type='';started=0;stopped=0;connected=true;onended:(()=>void)|null=null;
 connect(){}disconnect(){this.connected=false;}start(){this.started++;}stop(){this.stopped++;}}
class Ctx{state='running';currentTime=0;destination={};sources:Source[]=[];gains:{gain:Param}[]=[];
 async resume(){}async suspend(){}async close(){}async decodeAudioData(){return {duration:.4};}
 createBufferSource(){const s=new Source();this.sources.push(s);return s;}createOscillator(){const s=new Source();this.sources.push(s);return s;}
 createGain(){const g={gain:new Param(),connect(){},disconnect(){}};this.gains.push(g);return g;}}
const g=globalThis as Record<string,unknown>;
g.document={hidden:false,addEventListener(){},removeEventListener(){}};
g.window={addEventListener(){},removeEventListener(){}};
let ctx:Ctx;g.AudioContext=class extends Ctx{constructor(){super();ctx=this;}};
g.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
const {createResearchAudio}=await import('../src/audio');
const {mountMapEncounters}=await import('../src/map-encounters.js');
const settle=()=>new Promise(resolve=>setTimeout(resolve,5));

test('fight cues play at full level under a voice; other cues still wait for it',async()=>{
 const audio=createResearchAudio(()=>true);
 await audio.play('swing');await settle();const swing=ctx.sources.at(-1)!;
 audio.quiet(true);
 assert.equal(swing.stopped,0,'the voice starting does not cut the swing');
 await audio.play('hit1',true);await settle();const hit=ctx.sources.at(-1)!;
 assert.notEqual(hit,swing);assert.equal(hit.started,1,'the hit plays during the voice');
 assert.ok(ctx.gains.at(-1)!.gain.value>=.6*.7,'at least 70% of its level');
 const count=ctx.sources.length;
 await audio.play('tap');await audio.play('cardReveal',true);await settle();
 assert.equal(ctx.sources.length,count,'taps and card cues are not fight cues');
 audio.quiet(false);audio.destroy();
});

class El{ownerDocument:any;style={setProperty(){}};dataset:Record<string,string>={};hidden=false;textContent='';children:El[]=[];attrs:Record<string,string>={};
 listeners:Record<string,()=>void>={};clientWidth=800;clientHeight=600;isConnected=false;role='';type='';className='';innerHTML='';title='';
 classes=new Set<string>();classList={add:(c:string)=>this.classes.add(c),remove:(c:string)=>this.classes.delete(c),contains:(c:string)=>this.classes.has(c),
  toggle:(c:string,on:boolean)=>{if(on)this.classes.add(c);else this.classes.delete(c);return on;}};
 constructor(doc:any){this.ownerDocument=doc;}
 append(...n:El[]){this.children.push(...n);}remove(){}after(){}setAttribute(k:string,v:string){this.attrs[k]=v;}getAttribute(k:string){return this.attrs[k]??null;}
 addEventListener(t:string,fn:()=>void){this.listeners[t]=fn;}closest(){return null;}querySelector(){return null;}querySelectorAll(){return [];}contains(){return false;}
 getBoundingClientRect(){return {left:0,top:0,right:0,bottom:0,width:0,height:0};}getClientRects(){return [];}focus(){}}

test('a hit or exit line is held from the narration until 300 ms after the hit sound; a taunt is not',()=>{
 let clock=1000;const timers:{at:number;fn:()=>void}[]=[];
 const view={performance:{now:()=>clock},setTimeout:(fn:()=>void,ms:number)=>{timers.push({at:clock+ms,fn});return timers.length;},clearTimeout(){},addEventListener(){},HTMLElement:El,matchMedia:()=>({matches:false})};
 const doc:any={defaultView:view,hidden:false,activeElement:null,createElement:()=>new El(doc),createElementNS:()=>new El(doc),querySelector:()=>null,querySelectorAll:()=>[]};
 doc.head=new El(doc);
 const advance=(ms:number)=>{clock+=ms;for(const t of timers.splice(0).sort((a,b)=>a.at-b.at)){if(t.at<=clock)t.fn();else timers.push(t);}};
 const host=new El(doc),sounds:string[]=[];
 const map=mountMapEncounters({host:host as unknown as HTMLElement,stages:[{id:'0',name:'세면대',x:100,y:100,lines:['도발!'],hit:['하나!','둘!'],finish:'퇴장!'}],art:{left:'a.png'} as never,tone:kind=>sounds.push(kind)});
 const all=(el:El):El[]=>[el,...el.children.flatMap(all)];
 const bubble=all(host).find(el=>el.className==='map-encounter-say')!,live=all(host).find(el=>el.className==='map-encounter-sr')!;
 const attack=all(host).find(el=>el.listeners.click)!;
 const frame=()=>map.update({hero:{x:110,y:100},ally:null,project:(p:{x:number;y:number})=>p,scale:1,now:clock} as never);
 frame();
 assert.equal(bubble.textContent,'도발!');assert.equal(bubble.classList.contains('narration-wait'),false,'the taunt is read at once');
 for(let n=1;n<=3;n++){
  advance(3000);frame();sounds.length=0;attack.listeners.click();
  assert.equal(bubble.textContent,n===3?'퇴장!':['하나!','둘!'][n-1],'the bubble shows at once');
  assert.ok(bubble.classList.contains('narration-wait')&&live.classList.contains('narration-wait'),'the narration waits');
  advance(90);assert.ok(sounds.includes('swing')&&sounds.includes(n===3?'finish':'hit'),'the hit sound lands on the strike (90 ms)');
  advance(299);assert.ok(bubble.classList.contains('narration-wait'));
  advance(1);assert.equal(bubble.classList.contains('narration-wait')||live.classList.contains('narration-wait'),false,'read 300 ms after the hit sound');
 }
 map.destroy();
});
