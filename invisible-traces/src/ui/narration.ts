import lines from '../data/narration.json';
import {createNarrationPlayer} from '../narration';
import {icon} from './icons';
// Captions remain the source of truth. One replay control avoids moving activity cards.
export function mountNarration(options:{enabled:()=>boolean;quiet:(value:boolean)=>void;context:()=>string}){
 const base=import.meta.env.BASE_URL;
 let seen=new Set<string>(),context='',current:string|null=null,scheduled=false,pending:string|null=null,queue:string[]=[],button:HTMLButtonElement|null=null;
 const byId=new Map(lines.map(line=>[line.id,line]));
 const player=createNarrationPlayer({enabled:()=>options.enabled()&&!document.hidden,quiet:options.quiet,create:src=>new Audio(src),changed:paint,finished:next});
 function stop(){queue=[];player.stop();}
 function paint(){
  const scene=document.querySelector<HTMLElement>('.npc-stage-dialog[open] .npc-stage');
  if(scene){scene.dataset.speaking=String(player.playing&&scene.dataset.lineId===current);const change=scene.querySelector<HTMLButtonElement>('[data-npc-switch]');if(change)change.disabled=!!player.active;}
  if(!button?.isConnected)return;const active=!!player.active,label=active?'안내 목소리 멈추기':'안내 다시 듣기';
  if(button.getAttribute('aria-label')!==label){button.setAttribute('aria-label',label);button.title=label;button.innerHTML=icon(active?'pause':'sound',22);}
  button.setAttribute('aria-pressed',String(active));button.disabled=!current;
 }
 function visible(el:HTMLElement){return !(el.closest('details:not([open])')&&!el.closest('summary'))&&!el.closest('[hidden], [inert]')&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('#toast:not(.visible)');}
 function speak(id:string){current=id;void player.play(base+byId.get(id)!.src);paint();}
 function next(){const id=queue.shift();if(id)speak(id);}
 function scan(){scheduled=false;const overlay=document.querySelector('dialog[open], #modal-root .modal');const scope=overlay??document.querySelector('#app');if(!scope)return;
  const nextContext=options.context()+(overlay?'|dialog':'');const closing=context===nextContext+'|dialog';
  if(nextContext!==context){stop();seen.clear();current=null;context=nextContext;}
  const scopes=[scope,...(!overlay?[...document.querySelectorAll('#toast.visible')]:[])],found=new Set<string>();
  for(const area of scopes)for(const el of [area,...area.querySelectorAll('*')] as HTMLElement[]){if(el.closest('[data-narration-control]')||el.matches('script,style')||!visible(el))continue;
   const text=(el.textContent??'').replace(/\s+/g,' ').trim();for(const line of lines)if(text.includes(line.text)&&![...el.children].some(child=>(child.textContent??'').replace(/\s+/g,' ').includes(line.text)))found.add(line.id);
  }
  const added=[...found].filter(id=>!seen.has(id));if(pending&&found.has(pending)){const i=added.indexOf(pending);if(i>=0)added.splice(i,1);added.unshift(pending);}pending=null;if(current&&!found.has(current)){stop();current=null;}
  queue=queue.filter(id=>found.has(id));seen=found;
  const host=overlay?.querySelector('[data-narration-host]')??overlay??scope.querySelector('.tools');
  if(host&&found.size){if(!button?.isConnected||!host.contains(button)){button?.remove();button=document.createElement('button');button.type='button';button.dataset.narrationControl='';button.className=overlay?'btn small':'icon-btn';button.style.minWidth='48px';button.style.minHeight='48px';
    button.onclick=e=>{e.preventDefault();e.stopPropagation();if(player.active)stop();else if(current){queue=[];speak(current);}};
    host.append(button);
   }}else{button?.remove();button=null;}
  if(added.length&&!document.hidden&&!closing){stop();queue=added;next();}else if(!current&&found.size)current=[...found][0];paint();
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(scan);}}
 const observer=new MutationObserver(records=>{if(records.some(r=>!(r.target as Element).closest?.('[data-narration-control]')))schedule();});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','open','hidden','inert']});
 function hidden(){if(document.hidden)stop();}function setting(){queueMicrotask(()=>{if(!options.enabled())stop();});}
 document.addEventListener('visibilitychange',hidden);document.addEventListener('change',setting);window.addEventListener('pagehide',stop);schedule();
 return {stop,announce(text:string){pending=lines.find(line=>line.text===text)?.id??null;schedule();},isToastPlaying(){return !!player.active&&!!current&&!!document.querySelector('#toast.visible')?.textContent?.includes(byId.get(current)!.text);},sync(){if(!options.enabled())stop();},destroy(){observer.disconnect();stop();document.removeEventListener('visibilitychange',hidden);document.removeEventListener('change',setting);window.removeEventListener('pagehide',stop);button?.remove();}};
}
