// One owner for all character voices; injected audio makes race handling testable.
export interface VoiceAudio {play():Promise<void>;pause():void;currentTime:number;onended:((event:Event)=>void)|null;onerror:((event:Event)=>void)|null;}
export function createNarrationPlayer(options:{enabled:()=>boolean;create:(src:string)=>VoiceAudio;quiet:(value:boolean)=>void;changed?:()=>void;finished?:()=>void}){
 let audio:VoiceAudio|null=null,request=0,active:string|null=null;
 function stop(){request++;if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio.currentTime=0;audio=null;}active=null;options.quiet(false);options.changed?.();}
 async function play(src:string){stop();if(!options.enabled())return false;const ticket=request;const candidate=options.create(src);audio=candidate;active=src;options.quiet(true);options.changed?.();
 candidate.onended=()=>{if(ticket===request){stop();options.finished?.();}};candidate.onerror=()=>{if(ticket===request)stop();};
 try{await candidate.play();if(ticket!==request||!options.enabled()){candidate.pause();if(ticket===request)stop();return false;}return true;}catch{if(ticket===request)stop();return false;}}
 return {play,stop,sync(){if(!options.enabled())stop();},get active(){return active;}};
}
