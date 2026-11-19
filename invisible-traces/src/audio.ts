// Original procedural research cues plus a few CC0 sample cues for map encounters and record completion
// (docs/AUDIO-PROVENANCE-20261109.md). No microphone or third-party requests.
export type Cue = 'tap' | 'success' | 'scan' | 'swing' | 'hit1' | 'hit2' | 'finish' | 'exit' | 'appear' | 'bump'
 | 'cardWhoosh' | 'cardReveal' | 'cardEpic' | 'cardSlot' | 'cardComplete' | 'unlock';
// Gentle hygiene sounds (spray, soap bubbles, clean chimes) instead of alarms or illness noises.
// `then` layers a second sample `at` seconds after the first (the unlock click, then its small bells).
const CUE_FILES:Partial<Record<Cue,{file:string;gain:number;rate?:number;then?:{file:string;gain:number;at:number}}>>={
 success:{file:'correct-01.mp3',gain:.5},swing:{file:'spray-hiss-03.mp3',gain:.35,rate:1.1},
 hit1:{file:'bubble-02.mp3',gain:.6},hit2:{file:'hit-light-02.mp3',gain:.7,rate:.92},
 finish:{file:'hit-heavy-02.mp3',gain:1},exit:{file:'villain-exit-04.mp3',gain:.4},
 appear:{file:'villain-appear-01.mp3',gain:.6},bump:{file:'hurt-bump-01.mp3',gain:.8},
 // Achievement card cues: fly in, reveal (the two rarest cards use the longer jingle), land in the slot, full set.
 cardWhoosh:{file:'wind-whoosh-03.mp3',gain:.45},cardReveal:{file:'reward-01.mp3',gain:.4},cardEpic:{file:'reward-03.mp3',gain:.4},
 cardSlot:{file:'pickup-01.mp3',gain:.55},cardComplete:{file:'victory-jingle-01.mp3',gain:.4},
 // A map place that has just opened: a soft latch, then clean small bells (2026-11-19).
 unlock:{file:'open-01.mp3',gain:.5,then:{file:'twinkle-03.mp3',gain:.4,at:.12}},
};
// Map villain fight cues keep playing under a character voice; a voice never mutes or drops them.
const COMBAT=new Set<Cue>(['swing','hit1','hit2','finish','exit','appear','bump']);
// Fight, card and unlock cues are one group: they layer (FX_MAX at once, the oldest gives way) and an interface cue
// (tap, scan, success) or a footstep never cuts them. A new interface cue only cuts the interface cue before it.
const FX=new Set<Cue>([...COMBAT,'cardWhoosh','cardReveal','cardEpic','cardSlot','cardComplete','unlock']);
const FX_MAX=4;
// The correct/record chime, the scan blip and the unlock chime answer the student's own progress: a voice that follows
// right away (the toast line, the next page's line) neither cuts nor drops them, and it starts VOICE_HOLD ms after them.
const FEEDBACK=new Set<Cue>(['success','scan','unlock']);
const VOICE_HOLD=300;
// Map footsteps: their own single channel, alternating two CC0 steps with a slightly different speed each time.
const STEP_FILES=['step-01.mp3','step-02.mp3'],STEP_GAIN=.18;
// Synth fallback when a sample cannot load or decode.
const NOTES:Record<Cue,number[]>={tap:[440],scan:[392,523.25],success:[523.25,659.25,783.99],swing:[659.25],hit1:[440],hit2:[523.25],finish:[523.25,783.99],exit:[783.99,659.25,523.25],appear:[392,523.25],bump:[329.63],
 cardWhoosh:[392,587.33],cardReveal:[659.25,987.77],cardEpic:[523.25,783.99,1046.5],cardSlot:[880],cardComplete:[523.25,659.25,783.99,1046.5],unlock:[659.25,987.77,1318.51]};
type Playing={src:AudioScheduledSourceNode;gain:GainNode;keep:boolean;fx:boolean;cue:Cue;id:number};
export function createResearchAudio(enabled:()=>boolean,base='./'){
 let context:AudioContext|null=null,quiet=false,request=0,uiRequest=0,plays=0,steps=0,feedbackAt=-Infinity;
 const nodes=new Set<Playing>();let footstep:{src:AudioScheduledSourceNode;gain:GainNode}|null=null;
 const bytes=new Map<string,Promise<ArrayBuffer|null>>(),buffers=new Map<string,Promise<AudioBuffer|null>>();
 const fetchFile=(file:string)=>{let p=bytes.get(file);if(!p){p=fetch(base+'assets/audio/sfx/'+file).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null);bytes.set(file,p);}return p;};
 function decode(ctx:AudioContext,file:string){let p=buffers.get(file);if(!p){p=fetchFile(file).then(data=>data?ctx.decodeAudioData(data.slice(0)):null).catch(()=>null);buffers.set(file,p);}return p;}
 function silence(node:{src:AudioScheduledSourceNode;gain:GainNode}){node.src.onended=null;try{node.src.stop();}catch{}node.src.disconnect();node.gain.disconnect();}
 function drop(node:Playing){silence(node);nodes.delete(node);}
 /** Everything, footsteps included: effects switched off, tab hidden, page left, map finale. */
 function stop(){request++;uiRequest++;for(const node of nodes)silence(node);nodes.clear();if(footstep){silence(footstep);footstep=null;}}
 /** Only the interface cue still sounding; fight, card and unlock cues and footsteps ring on. */
 function stopInterface(){uiRequest++;for(const node of nodes)if(!node.fx)drop(node);}
 function track(src:AudioScheduledSourceNode,gain:GainNode,cue:Cue,id:number){
  const node={src,gain,keep:COMBAT.has(cue)||FEEDBACK.has(cue),fx:FX.has(cue),cue,id};
  if(node.fx){const others=[...new Set([...nodes].filter(n=>n.fx&&n.id!==id).map(n=>n.id))];while(others.length>=FX_MAX){const oldest=others.shift();for(const n of nodes)if(n.id===oldest)drop(n);}}
  nodes.add(node);src.onended=()=>{nodes.delete(node);src.disconnect();gain.disconnect();};
 }
 const allowed=(ticket:{all:number;ui:number},keep:boolean,fx:boolean)=>ticket.all===request&&(fx||ticket.ui===uiRequest)&&enabled()&&(!quiet||keep)&&!document.hidden&&context?.state==='running';
 /** `layer` is kept for callers; fight, card and unlock cues always layer, an interface cue cuts the one before it. */
 async function play(kind:Cue='tap',layer=false){
  // `keep` marks every cue that rings on under a voice: the fight cues and the feedback chimes.
  const keep=COMBAT.has(kind)||FEEDBACK.has(kind),fx=FX.has(kind);
  if(quiet&&!keep)return;
  if(!fx&&!layer)stopInterface();if(!enabled()||document.hidden)return;
  if(FEEDBACK.has(kind))feedbackAt=performance.now();
  const ticket={all:request,ui:uiRequest},id=++plays;
  try{
   context??=new AudioContext();if(context.state==='suspended')await context.resume();
   if(!allowed(ticket,keep,fx))return;
   const sample=CUE_FILES[kind];
   if(sample?.file){
    const [buffer,extra]=await Promise.all([decode(context,sample.file),sample.then?decode(context,sample.then.file):null]);
    if(!allowed(ticket,keep,fx))return;
    if(buffer){
     const start=(data:AudioBuffer,level:number,rate=1,at=0)=>{const src=context!.createBufferSource(),gain=context!.createGain();
      src.buffer=data;if(rate!==1)src.playbackRate.value=rate;gain.gain.value=level;src.connect(gain);gain.connect(context!.destination);track(src,gain,kind,id);src.start(at);};
     start(buffer,sample.gain,sample.rate);if(extra&&sample.then)start(extra,sample.then.gain,1,context.currentTime+sample.then.at);return;
    }
   }
   // Gentle glass-like discovery; neutral scan, no alarm or illness sound.
   NOTES[kind].forEach((hz,i)=>{const osc=context!.createOscillator(),gain=context!.createGain(),t=context!.currentTime+i*.09;
    osc.type='sine';osc.frequency.setValueAtTime(hz,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.035,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);
    osc.connect(gain);gain.connect(context!.destination);track(osc,gain,kind,id);osc.start(t);osc.stop(t+.2);
   });
  }catch{/* Captions and visual feedback remain available. */}
 }
 /** One footstep on its own channel: it never cuts another cue and nothing but the next footstep cuts it. Half as loud under a voice. */
 async function step(){
  if(!enabled()||document.hidden)return;
  const ticket=request,file=STEP_FILES[steps++%STEP_FILES.length];
  try{
   context??=new AudioContext();if(context.state==='suspended')await context.resume();
   const buffer=await decode(context,file);
   if(!buffer||ticket!==request||!enabled()||document.hidden||context.state!=='running')return;
   if(footstep)silence(footstep);
   const src=context.createBufferSource(),gain=context.createGain(),node={src,gain};
   src.buffer=buffer;src.playbackRate.value=1+(Math.random()-.5)*.1;gain.gain.value=STEP_GAIN*(quiet?.5:1);
   src.connect(gain);gain.connect(context.destination);footstep=node;
   src.onended=()=>{if(footstep===node)footstep=null;src.disconnect();gain.disconnect();};src.start();
  }catch{/* Walking stays silent. */}
 }
 /** Fetch sample bytes ahead (no AudioContext before a gesture) so the first hit lands on time. */
 function preload(kinds:Cue[],withSteps=false){const files=kinds.flatMap(kind=>{const s=CUE_FILES[kind];return s?[s.file,...(s.then?[s.then.file]:[])]:[];});if(withSteps)files.push(...STEP_FILES);
  for(const file of files){if(context)void decode(context,file);else void fetchFile(file);}}
 function hidden(){if(document.hidden){stop();void context?.suspend().catch(()=>{});}}
 document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',stop);
 return {play,step,preload,stop,
  /** True while that cue is still sounding (the full-set jingle holds the map finale until it ends). */
  ringing(cue:Cue){for(const node of nodes)if(node.cue===cue)return true;return false;},
  /** Milliseconds a voice should still wait so the feedback chime that just started is heard first. */
  voiceWait(){return enabled()?Math.max(0,Math.ceil(feedbackAt+VOICE_HOLD-performance.now())):0;},
  // A voice starting stops interface cues but lets fight, card, unlock and feedback cues (and their pending loads) ring on.
  quiet(value:boolean){quiet=value;if(value)for(const node of nodes)if(!node.keep&&!node.fx)drop(node);},sync(){if(!enabled())stop();},destroy(){stop();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);void context?.close().catch(()=>{});}};
}
// Suno background music (references/suno). The main theme loops from the first tap; the final theme
// plays once on the ending/certificate and while the map finale dialog is open, then the main theme resumes.
export type Music='main'|'final';
/** Ducking under a voice and coming back take this long (ms). */
export const FADE=200;
const MUSIC_FILES:Record<Music,string>={main:'assets/audio/bgm/main-theme.mp3',final:'assets/audio/bgm/final-theme.mp3'};
/** `level` is the music size from the settings (0..1); 0.3 is the size the theme had before it became adjustable. */
export function createMusic(enabled:()=>boolean,base='./',level:()=>number=()=>.3){
 const players=new Map<Music,HTMLAudioElement>();
 // HTMLAudio volume has no ramp of its own: step it every 16 ms towards the target.
 let fading:{el:HTMLAudioElement;target:number;timer:ReturnType<typeof setTimeout>}|null=null;
 function stopFade(){if(fading)clearTimeout(fading.timer);fading=null;}
 function fade(el:HTMLAudioElement,target:number){
  if(fading?.el===el&&fading.target===target)return;
  stopFade();const from=el.volume,began=performance.now();
  const tick=()=>{const k=Math.min(1,(performance.now()-began)/FADE);el.volume=k>=1?target:Math.max(0,Math.min(1,from+(target-from)*k));fading=k<1?{el,target,timer:setTimeout(tick,16)}:null;};
  fading={el,target,timer:setTimeout(tick,0)};
 }
 let current:Music|null=null,started=false,quiet=false,scene:Music='main',mapFinale=false,finalDone=false;
 function player(name:Music){let a=players.get(name);if(!a){a=new Audio(base+MUSIC_FILES[name]);a.preload='auto';a.dataset.track=name;a.onended=()=>{if(name==='final'&&!mapFinale){finalDone=true;sync();}};players.set(name,a);}return a;}
 function sync(){
  // After the final theme has played once on the ending/certificate, the main theme carries on at 0.45 instead of silence.
  const tail=scene==='final'&&!mapFinale&&finalDone,want:Music=mapFinale?'final':tail?'main':scene,size=Math.max(0,Math.min(1,level()||0)),silent=!started||!enabled()||size<=0||document.hidden;
  for(const [name,a] of players)if(silent||name!==want)a.pause();
  if(silent){stopFade();return;}
  const a=player(want);if(current!==want){if(want==='final')a.currentTime=0;current=want;}
  a.loop=want==='main'||mapFinale;
  // Ducked to a quarter under character voices instead of stopping, over FADE ms; a track that starts takes its size at once.
  const target=size*(quiet?.25:1)*(tail?.45:1);
  if(a.paused||fading?.el!==a&&Math.abs(a.volume-target)<.001){stopFade();a.volume=target;}else fade(a,target);
  if(a.paused)void a.play().catch(()=>{});
 }
 function start(){if(started)return;started=true;sync();}
 const onFinale=(e:Event)=>{mapFinale=!!(e as CustomEvent<boolean>).detail;sync();};
 document.addEventListener('pointerdown',start,{once:true,capture:true});document.addEventListener('keydown',start,{once:true,capture:true});
 document.addEventListener('visibilitychange',sync);document.addEventListener('map-finale-music',onFinale);
 return {sync,
  scene(next:Music){if(next===scene)return;scene=next;if(next==='final')finalDone=false;sync();},
  quiet(value:boolean){if(value===quiet)return;quiet=value;sync();},
  get state(){const a=current?players.get(current):undefined;return {track:current,paused:a?.paused??true,time:a?.currentTime??0,volume:a?.volume??0,src:a?.src??''};},
  destroy(){stopFade();players.forEach(a=>a.pause());players.clear();document.removeEventListener('pointerdown',start,{capture:true});document.removeEventListener('keydown',start,{capture:true});document.removeEventListener('visibilitychange',sync);document.removeEventListener('map-finale-music',onFinale);}};
}
