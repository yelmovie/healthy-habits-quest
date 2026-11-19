import test from 'node:test';
import assert from 'node:assert/strict';

// Stand-ins for the browser: a Web Audio context that records sources, and audio elements that record their state.
class Param{value=0;setValueAtTime(){}linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}}
class Source{buffer:unknown=null;playbackRate=new Param();frequency=new Param();type='';started=0;stopped=0;onended:(()=>void)|null=null;
 connect(){}disconnect(){}start(){this.started++;}stop(){this.stopped++;}}
class Ctx{state='running';currentTime=0;destination={};sources:Source[]=[];
 async resume(){}async suspend(){}async close(){}async decodeAudioData(){return {duration:.34};}
 createBufferSource(){const s=new Source();this.sources.push(s);return s;}createOscillator(){const s=new Source();this.sources.push(s);return s;}
 createGain(){return {gain:new Param(),connect(){},disconnect(){}};}}
class Player{dataset:Record<string,string>={};preload='';loop=false;volume=1;paused=true;currentTime=0;onended:(()=>void)|null=null;
 constructor(public src:string){players.push(this);}
 play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}}
const players:Player[]=[];
const listeners:Record<string,((e:unknown)=>void)[]>={};
const g=globalThis as Record<string,unknown>;
g.document={hidden:false,addEventListener(type:string,fn:(e:unknown)=>void){(listeners[type]??=[]).push(fn);},removeEventListener(){}};
g.window={addEventListener(){},removeEventListener(){}};
let ctx:Ctx;g.AudioContext=class extends Ctx{constructor(){super();ctx=this;}};
g.Audio=Player;
g.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
const {createResearchAudio,createMusic}=await import('../src/audio');
const settle=()=>new Promise(resolve=>setTimeout(resolve,5));

test('the correct chime is not cut or dropped by the voice that follows, and holds that voice back',async()=>{
 let sfx=true;const audio=createResearchAudio(()=>sfx);
 assert.equal(audio.voiceWait(),0,'no chime, no wait');
 await audio.play('success');await settle();const chime=ctx.sources.at(-1)!;
 assert.equal(chime.started,1);
 const wait=audio.voiceWait();assert.ok(wait>200&&wait<=300,`the voice waits about 0.3 s (${wait})`);
 audio.quiet(true);assert.equal(chime.stopped,0,'the toast voice does not cut the chime');
 const count=ctx.sources.length;
 await audio.play('success');await settle();
 assert.equal(ctx.sources.length,count+1,'a chime asked for during a voice still plays');
 await audio.play('tap');await settle();
 assert.equal(ctx.sources.length,count+1,'a tap during a voice stays silent');
 audio.quiet(false);
 sfx=false;audio.sync();assert.equal(audio.voiceWait(),0,'effects off: nothing to wait for');
 await audio.play('success');await settle();assert.equal(ctx.sources.length,count+1,'effects off: no chime');
 audio.destroy();
});

test('background music follows its own switch and size, and ducks to a quarter under a voice',()=>{
 let on=true,size=.3;const music=createMusic(()=>on,'./',()=>size);
 assert.equal(players.length,0,'nothing plays before the first tap');
 for(const fn of listeners.pointerdown??[])fn({});
 const main=players[0];
 assert.ok(main.src.endsWith('main-theme.mp3'));assert.equal(main.paused,false);assert.equal(main.volume,.3,'30% is the size the theme had before');
 music.quiet(true);assert.equal(main.volume,.075);assert.equal(main.paused,false,'ducked, not stopped');
 music.quiet(false);assert.equal(main.volume,.3);
 size=.6;music.sync();assert.equal(main.volume,.6);
 music.quiet(true);assert.equal(main.volume,.15);music.quiet(false);
 size=0;music.sync();assert.equal(main.paused,true,'size 0 rests the music');
 size=.3;music.sync();assert.equal(main.paused,false);
 on=false;music.sync();assert.equal(main.paused,true,'the music switch stops it at once');
 on=true;music.sync();assert.equal(main.paused,false);assert.equal(main.volume,.3);
 music.destroy();
});
