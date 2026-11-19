// Original procedural research cues plus a few CC0 sample cues for map encounters and record completion
// (docs/AUDIO-PROVENANCE-20261109.md). No microphone or third-party requests.
export type Cue = 'tap' | 'success' | 'scan' | 'swing' | 'hit1' | 'hit2' | 'finish' | 'exit' | 'appear' | 'bump'
 | 'cardWhoosh' | 'cardReveal' | 'cardEpic' | 'cardSlot' | 'cardComplete';
// Gentle hygiene sounds (spray, soap bubbles, clean chimes) instead of alarms or illness noises.
const CUE_FILES:Partial<Record<Cue,{file:string;gain:number;rate?:number}>>={
 success:{file:'correct-01.mp3',gain:.5},swing:{file:'spray-hiss-03.mp3',gain:.35,rate:1.1},
 hit1:{file:'bubble-02.mp3',gain:.6},hit2:{file:'hit-light-02.mp3',gain:.7,rate:.92},
 finish:{file:'hit-heavy-02.mp3',gain:1},exit:{file:'villain-exit-04.mp3',gain:.4},
 appear:{file:'villain-appear-01.mp3',gain:.6},bump:{file:'hurt-bump-01.mp3',gain:.8},
 // Achievement card cues: fly in, reveal (the two rarest cards use the longer jingle), land in the slot, full set.
 cardWhoosh:{file:'wind-whoosh-03.mp3',gain:.45},cardReveal:{file:'reward-01.mp3',gain:.4},cardEpic:{file:'reward-03.mp3',gain:.4},
 cardSlot:{file:'pickup-01.mp3',gain:.55},cardComplete:{file:'victory-jingle-01.mp3',gain:.4},
};
// Map villain fight cues keep playing under a character voice; a voice never mutes or drops them. Card cues are not here.
const COMBAT=new Set<Cue>(['swing','hit1','hit2','finish','exit','appear','bump']);
// The correct/record chime and the scan blip answer the student's own action: a voice that follows right away
// (the toast line, the next page's line) neither cuts nor drops them, and it starts VOICE_HOLD ms after them.
const FEEDBACK=new Set<Cue>(['success','scan']);
const VOICE_HOLD=300;
// Synth fallback when a sample cannot load or decode.
const NOTES:Record<Cue,number[]>={tap:[440],scan:[392,523.25],success:[523.25,659.25,783.99],swing:[659.25],hit1:[440],hit2:[523.25],finish:[523.25,783.99],exit:[783.99,659.25,523.25],appear:[392,523.25],bump:[329.63],
 cardWhoosh:[392,587.33],cardReveal:[659.25,987.77],cardEpic:[523.25,783.99,1046.5],cardSlot:[880],cardComplete:[523.25,659.25,783.99,1046.5]};
export function createResearchAudio(enabled:()=>boolean,base='./'){
 let context:AudioContext|null=null,quiet=false,request=0,feedbackAt=-Infinity;
 const nodes=new Set<{src:AudioScheduledSourceNode;gain:GainNode;keep:boolean}>();
 const bytes=new Map<string,Promise<ArrayBuffer|null>>(),buffers=new Map<string,Promise<AudioBuffer|null>>();
 const fetchFile=(file:string)=>{let p=bytes.get(file);if(!p){p=fetch(base+'assets/audio/sfx/'+file).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null);bytes.set(file,p);}return p;};
 function decode(ctx:AudioContext,file:string){let p=buffers.get(file);if(!p){p=fetchFile(file).then(data=>data?ctx.decodeAudioData(data.slice(0)):null).catch(()=>null);buffers.set(file,p);}return p;}
 function silence(node:{src:AudioScheduledSourceNode;gain:GainNode}){node.src.onended=null;try{node.src.stop();}catch{}node.src.disconnect();node.gain.disconnect();}
 function stop(){request++;for(const node of nodes)silence(node);nodes.clear();}
 function track(src:AudioScheduledSourceNode,gain:GainNode,keep:boolean){const node={src,gain,keep};nodes.add(node);src.onended=()=>{nodes.delete(node);src.disconnect();gain.disconnect();};}
 const allowed=(ticket:number,keep=false)=>ticket===request&&enabled()&&(!quiet||keep)&&!document.hidden&&context?.state==='running';
 /** layer=true keeps the cue already sounding (the swing under its hit, the hit under the exit). */
 async function play(kind:Cue='tap',layer=false){
  // `keep` marks every cue that rings on under a voice: the fight cues and the feedback chime.
  const keep=COMBAT.has(kind)||FEEDBACK.has(kind);
  if(quiet&&!keep)return;
  if(!layer)stop();if(!enabled()||document.hidden)return;
  if(FEEDBACK.has(kind))feedbackAt=performance.now();
  const ticket=request;
  try{
   context??=new AudioContext();if(context.state==='suspended')await context.resume();
   if(!allowed(ticket,keep))return;
   const sample=CUE_FILES[kind];
   if(sample?.file){
    const buffer=await decode(context,sample.file);
    if(!allowed(ticket,keep))return;
    if(buffer){
     const src=context.createBufferSource(),gain=context.createGain();
     src.buffer=buffer;if(sample.rate)src.playbackRate.value=sample.rate;gain.gain.value=sample.gain;
     src.connect(gain);gain.connect(context.destination);track(src,gain,keep);src.start();return;
    }
   }
   // Gentle glass-like discovery; neutral scan, no alarm or illness sound.
   NOTES[kind].forEach((hz,i)=>{const osc=context!.createOscillator(),gain=context!.createGain(),t=context!.currentTime+i*.09;
    osc.type='sine';osc.frequency.setValueAtTime(hz,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.035,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);
    osc.connect(gain);gain.connect(context!.destination);track(osc,gain,keep);osc.start(t);osc.stop(t+.2);
   });
  }catch{/* Captions and visual feedback remain available. */}
 }
 /** Fetch sample bytes ahead (no AudioContext before a gesture) so the first hit lands on time. */
 function preload(kinds:Cue[]){for(const kind of kinds){const file=CUE_FILES[kind]?.file;if(file){if(context)void decode(context,file);else void fetchFile(file);}}}
 function hidden(){if(document.hidden){stop();void context?.suspend().catch(()=>{});}}
 document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',stop);
 return {play,preload,stop,
  /** Milliseconds a voice should still wait so the feedback chime that just started is heard first. */
  voiceWait(){return enabled()?Math.max(0,Math.ceil(feedbackAt+VOICE_HOLD-performance.now())):0;},
  // A voice starting stops interface and card cues but lets fight and feedback cues (and their pending loads) ring on.
  quiet(value:boolean){quiet=value;if(value)for(const node of nodes)if(!node.keep){silence(node);nodes.delete(node);}},sync(){if(!enabled())stop();},destroy(){stop();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);void context?.close().catch(()=>{});}};
}
// Suno background music (references/suno). The main theme loops from the first tap; the final theme
// plays once on the ending/certificate and while the map finale dialog is open, then the main theme resumes.
export type Music='main'|'final';
const MUSIC_FILES:Record<Music,string>={main:'assets/audio/bgm/main-theme.mp3',final:'assets/audio/bgm/final-theme.mp3'};
/** `level` is the music size from the settings (0..1); 0.3 is the size the theme had before it became adjustable. */
export function createMusic(enabled:()=>boolean,base='./',level:()=>number=()=>.3){
 const players=new Map<Music,HTMLAudioElement>();
 let current:Music|null=null,started=false,quiet=false,scene:Music='main',mapFinale=false,finalDone=false;
 function player(name:Music){let a=players.get(name);if(!a){a=new Audio(base+MUSIC_FILES[name]);a.preload='auto';a.dataset.track=name;a.onended=()=>{if(name==='final'&&!mapFinale)finalDone=true;};players.set(name,a);}return a;}
 function sync(){
  const want:Music=mapFinale?'final':scene,size=Math.max(0,Math.min(1,level()||0)),silent=!started||!enabled()||size<=0||document.hidden||want==='final'&&!mapFinale&&finalDone;
  for(const [name,a] of players)if(silent||name!==want)a.pause();
  if(silent)return;
  const a=player(want);if(current!==want){if(want==='final')a.currentTime=0;current=want;}
  a.loop=want==='main'||mapFinale;
  // Ducked to a quarter under character voices instead of stopping.
  a.volume=size*(quiet?.25:1);
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
  destroy(){players.forEach(a=>a.pause());players.clear();document.removeEventListener('pointerdown',start,{capture:true});document.removeEventListener('keydown',start,{capture:true});document.removeEventListener('visibilitychange',sync);document.removeEventListener('map-finale-music',onFinale);}};
}
