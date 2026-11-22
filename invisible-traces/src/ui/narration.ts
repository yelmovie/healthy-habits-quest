import lines from '../data/narration.json';
import {createNarrationPlayer} from '../narration';
import {icon} from './icons';
// Captions remain the source of truth. One replay control avoids moving activity cards.
// Lines marked keep (map villain bubbles) finish even after their short-lived bubble hides.
// Text inside .narration-wait (a villain hit or exit line during its fight cue) is read once the class goes.
// `delay` (ms) holds a new line back while the feedback chime that triggered it starts (audio.ts voiceWait).
export function mountNarration(options:{enabled:()=>boolean;quiet:(value:boolean)=>void;context:()=>string;delay?:()=>number}){
 const base=import.meta.env.BASE_URL;
 let seen=new Set<string>(),context='',current:string|null=null,scheduled=false,pending:string|null=null,queue:string[]=[],button:HTMLButtonElement|null=null,hold:ReturnType<typeof setTimeout>|null=null;
 const byId=new Map(lines.map(line=>[line.id,line]));
 const player=createNarrationPlayer({enabled:()=>options.enabled()&&!document.hidden,quiet:options.quiet,create:src=>new Audio(src),changed:paint,finished:next});
 let deferred:ReturnType<typeof setTimeout>|null=null;
 // 설정의 「안내 목소리 듣기」처럼 화면에 글이 없는 줄을 직접 읽을 때, 다시 훑기가 그 줄을 멈추지 않게 표시한다.
 let forced:string|null=null;
 function stop(){forced=null;if(hold){clearTimeout(hold);hold=null;}if(deferred){clearTimeout(deferred);deferred=null;}queue=[];player.stop();}
 // 악당 반응 대사와 다른 인물 대사는 서로 끊지 않는다(최대 2초 기다림). 악당 대사가 그동안 화면에서 사라졌거나
 // 2초가 지나도 다른 대사가 이어지면 악당 대사는 건너뛰고, 안내 대사는 2초 뒤에 시작한다.
 const villain=(id:string)=>id.startsWith('villain-');
 function after(ids:string[],dropAtLimit:boolean){if(deferred)clearTimeout(deferred);const limit=performance.now()+2000;
  const tick=()=>{deferred=null;const left=ids.filter(id=>seen.has(id));if(!left.length||document.hidden)return;
   if(player.active&&performance.now()<limit){deferred=setTimeout(tick,100);return;}
   if(player.active&&dropAtLimit)return;stop();queue=left;start();};
  deferred=setTimeout(tick,100);}
 function paint(){
  const scene=document.querySelector<HTMLElement>('.npc-stage-dialog[open] .npc-stage');
  if(scene){scene.dataset.speaking=String(player.playing&&scene.dataset.lineId===current);const change=scene.querySelector<HTMLButtonElement>('[data-npc-switch]');if(change)change.disabled=!!player.active;}
  if(!button?.isConnected)return;const active=!!player.active,label=active?'안내 목소리 멈추기':'안내 다시 듣기';
  if(button.getAttribute('aria-label')!==label){button.setAttribute('aria-label',label);button.title=label;button.innerHTML=icon(active?'pause':'voice',22);}
  button.setAttribute('aria-pressed',String(active));button.disabled=!current;
 }
 function visible(el:HTMLElement){return !(el.closest('details:not([open])')&&!el.closest('summary'))&&!el.closest('[hidden], [inert], .narration-wait')&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden'&&!el.closest('#toast:not(.visible)');}
 // 첫 입력 전에는 브라우저가 소리를 막는다(새로고침 직후 포함). 그때 읽을 줄(타이틀 대사 등)은 재생을 시도하지 않고 미뤄 두며
 // 「읽은 줄」로 버리지 않는다. 첫 입력 0.4초 뒤 같은 화면에 그 줄이 남아 있고 다른 대사가 없을 때 한 번 읽는다.
 let retry:{ids:string[];context:string}|null=null,acted=false;
 const activated=()=>(navigator as Navigator&{userActivation?:{hasBeenActive:boolean}}).userActivation?.hasBeenActive??acted;
 function speak(id:string){current=id;const rest=[...queue];
  if(!activated()){retry={ids:[id,...rest],context};queue=[];paint();return;}
  void player.play(base+byId.get(id)!.src).then(ok=>{if(!ok&&current===id&&!activated())retry={ids:[id,...rest],context};});paint();}
 // 입력이 화면을 바꿨거나(시작 버튼 등) 대화창·다른 대사가 나왔으면 읽지 않는다.
 function firstInput(){acted=true;const pend=retry;if(!pend)return;retry=null;setTimeout(()=>{const left=pend.ids.filter(id=>seen.has(id));if(context===pend.context&&left.length&&!player.active&&!hold&&!document.hidden&&options.enabled()){queue=left;next();}},400);}
 function next(){const id=queue.shift();if(id)speak(id);}
 // While a line is held it already counts as the current one, so a rescan during the hold does not drop it.
 function start(){const wait=options.enabled()?options.delay?.()??0:0;if(wait>0&&queue.length){current=queue[0];hold=setTimeout(()=>{hold=null;next();},wait);}else next();}
 function scan(){scheduled=false;const overlay=document.querySelector('dialog[open], #modal-root .modal');const scope=overlay??document.querySelector('#app');if(!scope)return;
  // The achievement card holds the app inert without being one of the dialogs read here. Lines already read stay read,
  // so closing the card does not read the villain's exit line a second time.
  if(!overlay&&scope.matches('[inert]')){paint();return;}
  const nextContext=options.context()+(overlay?'|dialog':'');const closing=context===nextContext+'|dialog';
  if(nextContext!==context){stop();seen.clear();current=null;context=nextContext;}
  const scopes=[scope,...(!overlay?[...document.querySelectorAll('#toast.visible')]:[])],found=new Set<string>();
  for(const area of scopes)for(const el of [area,...area.querySelectorAll('*')] as HTMLElement[]){if(el.closest('[data-narration-control]')||el.matches('script,style')||!visible(el))continue;
   const text=(el.textContent??'').replace(/\s+/g,' ').trim();for(const line of lines)if(text.includes(line.text)&&![...el.children].some(child=>(child.textContent??'').replace(/\s+/g,' ').includes(line.text)))found.add(line.id);
  }
  const added=[...found].filter(id=>!seen.has(id));if(pending&&found.has(pending)){const i=added.indexOf(pending);if(i>=0)added.splice(i,1);added.unshift(pending);}pending=null;if(current&&!found.has(current)&&current!==forced&&!(byId.get(current) as {keep?:boolean}|undefined)?.keep){stop();current=null;}
  queue=queue.filter(id=>found.has(id));seen=found;
  const host=overlay?.querySelector('[data-narration-host]')??overlay??scope.querySelector('.tools');
  if(host&&found.size){if(!button?.isConnected||!host.contains(button)){button?.remove();button=document.createElement('button');button.type='button';button.dataset.narrationControl='';button.className=overlay?'btn small':'icon-btn';button.style.minWidth='48px';button.style.minHeight='48px';
    button.onclick=e=>{e.preventDefault();e.stopPropagation();if(player.active)stop();else if(current){stop();speak(current);}};
    host.append(button);
   }}else{button?.remove();button=null;}
  const speaking=player.active?current:null;
  if(added.length&&!document.hidden&&!closing){
   if(speaking&&!villain(speaking)&&added.every(villain))after(added,true);
   else if(speaking&&villain(speaking)&&!added.every(villain))after(added,false);
   else{stop();queue=added;start();}}else if(!current&&found.size)current=[...found][0];paint();
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(scan);}}
 const observer=new MutationObserver(records=>{if(records.some(r=>!(r.target as Element).closest?.('[data-narration-control]')))schedule();});
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','open','hidden','inert']});
 function hidden(){if(document.hidden)stop();}function setting(){queueMicrotask(()=>{if(!options.enabled())stop();});}
 document.addEventListener('visibilitychange',hidden);document.addEventListener('change',setting);window.addEventListener('pagehide',stop);schedule();
 document.addEventListener('pointerup',firstInput,{capture:true});document.addEventListener('keyup',firstInput,{capture:true});
 return {stop,/** Reads one line by id even when its text is not on screen. */
  say(id:string){if(!byId.has(id))return;stop();forced=id;queue=[];speak(id);},/** A voice line is sounding or about to start. */
  isSpeaking(){return !!player.active||!!hold;},announce(text:string){pending=lines.find(line=>line.text===text)?.id??null;schedule();},isToastPlaying(){return !!player.active&&!!current&&!!document.querySelector('#toast.visible')?.textContent?.includes(byId.get(current)!.text);},sync(){if(!options.enabled())stop();},destroy(){observer.disconnect();stop();document.removeEventListener('pointerup',firstInput,{capture:true});document.removeEventListener('keyup',firstInput,{capture:true});document.removeEventListener('visibilitychange',hidden);document.removeEventListener('change',setting);window.removeEventListener('pagehide',stop);button?.remove();}};
}
