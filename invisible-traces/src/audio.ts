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
