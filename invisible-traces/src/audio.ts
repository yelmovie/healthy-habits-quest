// Original procedural research cues. No recordings, microphone, or network requests.
export type Cue = 'tap' | 'success' | 'scan';
export function createResearchAudio(enabled:()=>boolean){
 let context:AudioContext|null=null,quiet=false,request=0;
 const nodes=new Set<{osc:OscillatorNode;gain:GainNode}>();
 function stop(){request++;for(const {osc,gain} of nodes){osc.onended=null;try{osc.stop();}catch{}osc.disconnect();gain.disconnect();}nodes.clear();}
 async function play(kind:Cue='tap'){
  stop();if(!enabled()||quiet||document.hidden)return;
  const ticket=request;
  try{
   context??=new AudioContext();if(context.state==='suspended')await context.resume();
   if(ticket!==request||!enabled()||quiet||document.hidden||context.state!=='running')return;
   // Gentle glass-like discovery; neutral scan, no alarm or illness sound.
   const notes=kind==='success'?[523.25,659.25,783.99]:kind==='scan'?[392,523.25]:[440];
   notes.forEach((hz,i)=>{const osc=context!.createOscillator(),gain=context!.createGain(),t=context!.currentTime+i*.09;
    osc.type='sine';osc.frequency.setValueAtTime(hz,t);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.035,t+.008);gain.gain.exponentialRampToValueAtTime(.0001,t+.18);
    osc.connect(gain);gain.connect(context!.destination);const node={osc,gain};nodes.add(node);osc.onended=()=>{nodes.delete(node);osc.disconnect();gain.disconnect();};osc.start(t);osc.stop(t+.2);
   });
  }catch{/* Captions and visual feedback remain available. */}
 }
 function hidden(){if(document.hidden){stop();void context?.suspend().catch(()=>{});}}
 document.addEventListener('visibilitychange',hidden);window.addEventListener('pagehide',stop);
 return {play,stop,quiet(value:boolean){quiet=value;if(value)stop();},sync(){if(!enabled())stop();},destroy(){stop();document.removeEventListener('visibilitychange',hidden);window.removeEventListener('pagehide',stop);void context?.close().catch(()=>{});}};
}
// Suno background music (references/suno). The main theme loops from the first tap; the final theme
// plays once on the ending/certificate and while the map finale dialog is open, then the main theme resumes.
export type Music='main'|'final';
const MUSIC_FILES:Record<Music,string>={main:'assets/audio/bgm/main-theme.mp3',final:'assets/audio/bgm/final-theme.mp3'};
export function createMusic(enabled:()=>boolean,base='./'){
 const players=new Map<Music,HTMLAudioElement>();
 let current:Music|null=null,started=false,quiet=false,scene:Music='main',mapFinale=false,finalDone=false;
 function player(name:Music){let a=players.get(name);if(!a){a=new Audio(base+MUSIC_FILES[name]);a.preload='auto';a.dataset.track=name;a.onended=()=>{if(name==='final'&&!mapFinale)finalDone=true;};players.set(name,a);}return a;}
 function sync(){
  const want:Music=mapFinale?'final':scene,silent=!started||!enabled()||document.hidden||want==='final'&&!mapFinale&&finalDone;
  for(const [name,a] of players)if(silent||name!==want)a.pause();
  if(silent)return;
  const a=player(want);if(current!==want){if(want==='final')a.currentTime=0;current=want;}
  a.loop=want==='main'||mapFinale;
  // Ducked to a quarter under character voices instead of stopping.
  a.volume=quiet?.075:.3;
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
