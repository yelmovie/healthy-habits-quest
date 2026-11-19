import test from 'node:test';
import assert from 'node:assert/strict';

// Stand-ins for the browser: a Web Audio context that records sources, and audio elements that record their state.
class Param{value=0;setValueAtTime(){}linearRampToValueAtTime(){}exponentialRampToValueAtTime(){}}
class Source{buffer:unknown=null;playbackRate=new Param();frequency=new Param();type='';started=0;stopped=0;onended:(()=>void)|null=null;
 connect(){}disconnect(){}start(){this.started++;}stop(){this.stopped++;}}
class Ctx{state='running';currentTime=0;destination={};sources:Source[]=[];gains:{gain:Param}[]=[];
 async resume(){}async suspend(){}async close(){}async decodeAudioData(){return {duration:.34};}
 createBufferSource(){const s=new Source();this.sources.push(s);return s;}createOscillator(){const s=new Source();this.sources.push(s);return s;}
 createGain(){const g={gain:new Param(),connect(){},disconnect(){}};this.gains.push(g);return g;}}
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

test('background music follows its own switch and size, and ducks to a quarter under a voice over 0.2 s',async()=>{
 const fade=()=>new Promise(resolve=>setTimeout(resolve,260));
 let on=true,size=.3;const music=createMusic(()=>on,'./',()=>size);
 assert.equal(players.length,0,'nothing plays before the first tap');
 for(const fn of listeners.pointerdown??[])fn({});
 const main=players[0];
 assert.ok(main.src.endsWith('main-theme.mp3'));assert.equal(main.paused,false);assert.equal(main.volume,.3,'30% is the size the theme had before');
 music.quiet(true);await new Promise(resolve=>setTimeout(resolve,90));
 assert.ok(main.volume<.3&&main.volume>.075,`halfway down, not a jump (${main.volume})`);
 await fade();assert.equal(main.volume,.075);assert.equal(main.paused,false,'ducked, not stopped');
 music.quiet(false);await fade();assert.equal(main.volume,.3);
 size=.6;music.sync();await fade();assert.equal(main.volume,.6);
 music.quiet(true);await fade();assert.equal(main.volume,.15);music.quiet(false);await fade();
 size=0;music.sync();assert.equal(main.paused,true,'size 0 rests the music');
 size=.3;music.sync();assert.equal(main.paused,false);assert.equal(main.volume,.3,'a track that starts takes its size at once');
 on=false;music.sync();assert.equal(main.paused,true,'the music switch stops it at once');
 on=true;music.sync();assert.equal(main.paused,false);assert.equal(main.volume,.3);
 music.destroy();
});

test('an interface cue cuts only the interface cue before it; fight, card and unlock cues layer up to four',async()=>{
 const audio=createResearchAudio(()=>true);
 await audio.play('success');await settle();const tap=ctx.sources.at(-1)!;
 await audio.play('swing');await settle();const swing=ctx.sources.at(-1)!;
 await audio.play('finish',true);await settle();const hit=ctx.sources.at(-1)!;
 assert.equal(tap.stopped,0,'a fight cue does not cut the chime');
 await audio.play('success');await settle();
 assert.equal(tap.stopped,1,'a new interface cue cuts the old one');
 assert.equal(swing.stopped+hit.stopped,0,'a tap never cuts the swing or the hit');
 await audio.play('bump');await settle();assert.equal(swing.stopped,0,'contact does not cut the spray');
 await audio.play('cardComplete',true);await settle();
 assert.ok(audio.ringing('cardComplete'),'the jingle is sounding');
 await audio.play('cardSlot',true);await settle();
 assert.equal(swing.stopped,1,'the fifth layered cue lets the oldest (the swing) go');
 assert.ok(audio.ringing('cardComplete'));
 const before=ctx.sources.length;await audio.play('unlock');await settle();
 assert.equal(ctx.sources.length,before+2,'unlock is a latch plus small bells');
 audio.destroy();
});

test('footsteps have their own channel: they cut nothing, nothing but the next step cuts them, half as loud under a voice',async()=>{
 let sfx=true;const audio=createResearchAudio(()=>sfx);
 await audio.play('cardReveal',true);await settle();const card=ctx.sources.at(-1)!;
 await audio.step();await settle();const first=ctx.sources.at(-1)!;const firstGain=ctx.gains.at(-1)!.gain.value;
 assert.notEqual(first,card);assert.equal(card.stopped,0,'a step does not cut the card cue');
 assert.ok(firstGain>=.12&&firstGain<=.18,`step level ${firstGain}`);
 await audio.play('success');await settle();assert.equal(first.stopped,0,'an interface cue does not cut the step');
 await audio.step();await settle();assert.equal(first.stopped,1,'the next step takes over');
 const rate=ctx.sources.at(-1)!.playbackRate.value;assert.ok(rate>=.94&&rate<=1.06,`rate ${rate}`);
 audio.quiet(true);await audio.step();await settle();
 assert.ok(Math.abs(ctx.gains.at(-1)!.gain.value-firstGain/2)<1e-9,'half under a voice');
 audio.quiet(false);
 sfx=false;audio.sync();const count=ctx.sources.length;await audio.step();await settle();
 assert.equal(ctx.sources.length,count,'effects off: no steps');
 audio.destroy();
});

test('after the final theme ends on the ending screen the main theme carries on at 0.45, and comes back to full size on leaving',async()=>{
 const fade=()=>new Promise(resolve=>setTimeout(resolve,260));
 players.length=0;const music=createMusic(()=>true,'./',()=>.3);
 for(const fn of listeners.pointerdown??[])fn({});
 music.scene('final');const final=players.find(p=>p.src.endsWith('final-theme.mp3'))!;
 assert.equal(final.paused,false);assert.equal(final.loop,false,'the final theme plays once');
 final.paused=true;final.onended!();
 const main=players.find(p=>p.src.endsWith('main-theme.mp3'))!;
 assert.equal(main.paused,false,'no silence after the final theme');assert.ok(Math.abs(main.volume-.3*.45)<1e-9,`main at 0.45 (${main.volume})`);
 music.scene('main');await fade();assert.equal(main.volume,.3);
 music.destroy();
});

test('the effects size multiplies every cue and footstep; 100% keeps the sizes from before, 0% is off',async()=>{
 let size=1;const audio=createResearchAudio(()=>true,'./',()=>size);
 await audio.play('success');await settle();assert.equal(ctx.gains.at(-1)!.gain.value,.5,'100%: the correct chime keeps its 0.5');
 await audio.step();await settle();assert.equal(ctx.gains.at(-1)!.gain.value,.18,'100%: a step keeps its 0.18');
 size=.4;
 await audio.play('finish',true);await settle();assert.ok(Math.abs(ctx.gains.at(-1)!.gain.value-.4)<1e-9,'40% of the heavy hit (1.0)');
 await audio.play('unlock');await settle();
 assert.ok(Math.abs(ctx.gains.at(-2)!.gain.value-.2)<1e-9&&Math.abs(ctx.gains.at(-1)!.gain.value-.16)<1e-9,'both unlock layers scale');
 await audio.step();await settle();assert.ok(Math.abs(ctx.gains.at(-1)!.gain.value-.072)<1e-9,'40% of a step');
 size=0;audio.sync();const count=ctx.sources.length;
 await audio.play('success');await audio.step();await settle();
 assert.equal(ctx.sources.length,count,'0%: nothing plays');assert.equal(audio.voiceWait(),0);
 audio.destroy();
});
