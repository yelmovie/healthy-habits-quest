import './ui/style.css';
import {DATA,PAGES,STAGES,LABS,SITES,EFFECTS} from './data/game';
import {fresh,derive,canEnter,fixtureFor,addPlacement,planResult,placementKey,contactAt,type State,type Route} from './simulation/model';
import {readSave,writeSave} from './state/storage';
import {icon,esc} from './ui/icons';
import {header,home,map,shell,pageContent,records,viewFresh,type View,btn} from './ui/render';
import type {MapHandle} from './game/pixel-map';
const root=document.querySelector<HTMLDivElement>('#app')!,modalRoot=document.querySelector<HTMLDivElement>('#modal-root')!,toastRoot=document.querySelector<HTMLDivElement>('#toast')!;
const loaded=readSave();let state=loaded.state,protectedSave=!!loaded.error;let archive:State|null=null;let view:View=viewFresh();let epoch=0,mapHandle:MapHandle|null=null;let timer:ReturnType<typeof setInterval>|null=null,toastTimer:ReturnType<typeof setTimeout>|null=null;let focusBefore:HTMLElement|null=null;let soundContext:AudioContext|null=null;let saveWarning=false;let transitioning=false;
function notify(text:string,tone=''){toastRoot.textContent=text;toastRoot.className=`visible ${tone}`;if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastRoot.className='',3700);}
function sound(kind:'tap'|'success'='tap'){if(!state.settings.sound)return;try{soundContext??=new AudioContext();void soundContext.resume();const o=soundContext.createOscillator(),g=soundContext.createGain();o.type='sine';o.frequency.value=kind==='success'?660:420;g.gain.setValueAtTime(.045,soundContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,soundContext.currentTime+.12);o.connect(g);g.connect(soundContext.destination);o.start();o.stop(soundContext.currentTime+.13);}catch{/* Visual feedback remains available. */}}
function persist(){if(archive||protectedSave)return;if(!writeSave(state)&&!saveWarning){saveWarning=true;notify('이 기기에 저장하지 못했어요. 지금 탐구는 계속할 수 있어요.');}}
function stop(){if(timer)clearInterval(timer);timer=null;view.playing=false;}
function update(fn:(s:State)=>void,redraw=true){const before=new Set(state.evidence);fn(state);derive(state);persist();if(state.evidence.some(e=>!before.has(e))){sound('success');notify('새 연구 기록이 자동으로 정리됐어요.','success');}if(redraw)render();}
function navigate(route:Route){if(!canEnter(state,route)){notify('앞선 조사 기록을 먼저 완성해 주세요.');return;}stop();state.route=route;if(route!=='C00'&&route!=='C01')state.lastRoute=route;view.clue='';view.effect='';view.replacement='';view.action='';derive(state);persist();render();}
function render(){stop();epoch++;mapHandle?.destroy();mapHandle=null;document.body.classList.toggle('reduced',state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches);document.body.classList.toggle('large-text',state.settings.large);
 if(state.route==='P06'&&state.completed.includes('P05')&&!state.labs.done.includes('contact')){state.labs.done.push('contact');derive(state);persist();}
 if(state.route==='P07'&&!state.experiment.baselineSeen){state.experiment.baselineSeen=true;persist();}
 root.innerHTML=header(state,!!archive)+(state.route==='C00'?home(state):state.route==='C01'?map(state,view):shell(state,view,pageContent(state,view)));
 if(state.route==='C01'){const currentEpoch=epoch;import('./game/pixel-map').then(async ({createMap})=>{if(epoch!==currentEpoch)return;const parent=document.getElementById('pixel-map');if(!parent)return;const available=view.teacher?5:Math.min(5,state.evidence.length+1);const h=await createMap(parent,available,state.evidence.length,state.settings.reduced,n=>void startStage(n));if(epoch!==currentEpoch)h.destroy();else mapHandle=h;}).catch(()=>{const parent=document.getElementById('pixel-map');if(parent)parent.innerHTML='<div class="map-fallback">지도를 읽지 못했어요.<br>오른쪽 미션 목록에서 바로 시작할 수 있어요.</div>';});}
 root.querySelectorAll<HTMLImageElement>('img').forEach(img=>{img.addEventListener('error',()=>{img.classList.add('failed-image');img.alt='배경 그림을 불러오지 못했어요.';const scene=img.parentElement;if(scene&&!scene.querySelector('.image-retry')){const button=document.createElement('button');button.className='image-retry btn small';button.textContent='그림 다시 읽기';button.onclick=()=>{img.classList.remove('failed-image');img.src=img.src;button.remove();};scene.append(button);}}, {once:true});});
}
async function startStage(n:number){if(transitioning)return;const unlocked=n===1||state.evidence.includes(`E${n-1}`);if(!unlocked&&!view.teacher)return;transitioning=true;view.mapBusy=true;const current=epoch;try{if(mapHandle)await mapHandle.travel(n);if(current!==epoch)return;
 const stage=STAGES[n-1];if(!unlocked||state.completed.includes(stage.pages[1])){if(!archive)archive=structuredClone(state);state=fixtureFor(n,state.settings);notify(!unlocked?'예시 기록을 사용하는 교사용 시연이에요.':'본편 기록을 보존하며 다시 실험해요.');}
 navigate(stage.pages[0] as Route);
 }finally{transitioning=false;view.mapBusy=false;}}
function closeModal(){modalRoot.innerHTML='';root.inert=false;focusBefore?.focus();focusBefore=null;}
function modal(content:string){stop();focusBefore=document.activeElement as HTMLElement;root.inert=true;modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="조사 안내"><button class="icon-btn modal-close" data-modal="close" aria-label="닫기">${icon('close')}</button>${content}</section></div>`;modalRoot.querySelector<HTMLButtonElement>('button')?.focus();}
function teacher(){modal(`<div class="eyebrow">TEACHER'S GUIDE</div><h2>관찰에서 실천으로 이어지는 과학</h2><p>5개 미션의 연구 기록을 모아 학교 대응안을 완성해요. 모형의 흔적은 실제 감염 여부나 감염 확률이 아니에요.</p><div class="guide-stages">${STAGES.map((s,i)=>`<div><b>0${i+1} ${s.name}</b><span>${['관찰하고 중요한 단서 고르기','관계를 설명하고 생활 영향 살피기','시간을 되감고 개입 시점 비교하기','다른 조건은 같게, 한 행동만 바꾸기','예산 안에서 계획하고 직접 적용하기'][i]}</span></div>`).join('')}</div><p>카드는 드래그하거나 선택 후 대상을 눌러 연결할 수 있어요. 입력과 기록은 자동 저장돼요. 같은 기기·같은 주소에서 이어갈 수 있어요.</p><div class="modal-actions"><button class="btn primary" data-modal="unlock">전 미션 시연 열기</button><button class="btn secondary" data-modal="reset">새 연구 시작</button></div><small>시연 기록은 학생 본편에 덮어쓰지 않아요. 실제 학교망·기기 동시 접속 검증은 별도로 필요해요.</small>`);}
function settings(){modal(`<div class="eyebrow">SETTINGS</div><h2>내게 편한 조사 환경</h2>${([['sound','소리 피드백'],['reduced','동작 줄이기'],['large','큰 글자']] as const).map(([key,label])=>`<label class="setting-row"><span>${label}</span><input type="checkbox" data-setting="${key}" ${state.settings[key]?'checked':''}></label>`).join('')}<p>소리를 꺼도 모든 조작과 학습 내용을 확인할 수 있어요.</p>`);}
function sealed():boolean{const route=state.route;if(route==='P10')return false;const i=PAGES.findIndex(p=>p.id===route);return i>=0&&state.evidence.includes(`E${Math.floor(i/2)+1}`);}
root.addEventListener('click',e=>{const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action]');if(!target||target.hasAttribute('disabled'))return;const a=target.dataset.action!,id=target.dataset.id??'';sound();
 if(['home','map','records','settings','sound','teacher','start','next','exit-replay','stage','print','certificate'].includes(a)){
 switch(a){case 'home':navigate('C00');return;case 'map':navigate('C01');return;case 'records':modal(records(state));return;case 'settings':settings();return;case 'teacher':teacher();return;
 case 'sound':state.settings.sound=!state.settings.sound;persist();render();return;
 case 'start':navigate(state.found.length?state.lastRoute:'C01');return;
 case 'exit-replay':if(archive){state=archive;archive=null;view.teacher=false;navigate('C01');}return;
 case 'stage':void startStage(Number(id));return;
 case 'next':if(state.completed.includes(state.route)){const p=PAGES.find(p=>p.id===state.route)!;navigate(p.next as Route);}return;
 case 'print':window.print();return;
 case 'certificate':update(s=>s.final.phase='certificate');return;}
 }
 if(sealed()&&!['site','lab','timeline-play','comparison-play','re-experiment','select-clue','select-effect'].includes(a)){notify('이 미션의 기록이 완성됐어요. 지도에서 다시 실험할 수 있어요.');return;}
 switch(a){
 case 'discover':if(state.found.includes(id)&&state.completed.includes('P01')){view.site=id;navigate('P02');return;}update(s=>{if(!s.found.includes(id))s.found.push(id);});notify('신호 위치를 기록했어요.');return;
 case 'site':view.site=id;view.replacement='';render();return;
 case 'clue':if(state.clues.includes(id)){update(s=>s.clues=s.clues.filter(x=>x!==id));return;}if(state.clues.length>=5){view.replacement=id;notify('바꿀 기존 단서를 골라주세요.');render();return;}update(s=>s.clues.push(id));return;
 case 'remove-clue':update(s=>{s.clues=s.clues.filter(x=>x!==id);if(view.replacement){s.clues.push(view.replacement);view.replacement='';}});return;
 case 'select-clue':view.clue=id;render();return;
 case 'link-target':if(!view.clue){notify('먼저 연결할 단서를 골라주세요.');return;}update(s=>{s.relations[view.clue]=id;view.clue='';});return;
 case 'select-effect':view.effect=id;render();return;
 case 'impact-domain':if(!view.effect){notify('먼저 영향 카드를 골라주세요.');return;}if(DATA.p04.links.find(x=>x.id===view.effect)?.domain!==id){notify('이 영향은 누구의 생활과 더 직접 이어질까요?');return;}update(s=>{s.impacts[id]=view.effect;view.effect='';});return;
 case 'source':update(s=>s.timeline.source=id);if(id!=='book')notify('시간을 처음으로 되감아 가장 먼저 빛난 물체를 살펴보세요.');return;
 case 'intervene':update(s=>{s.timeline.intervention=Number(id);s.timeline.tick=5;});return;
 case 'timeline-play':play('timeline');return;
 case 'comparison-play':play('comparison');return;
 case 'lab':view.lab=id;render();return;
 case 'contact-record':update(s=>{if(!s.labs.done.includes('contact'))s.labs.done.push('contact');});return;
 case 'lab-set':setLab(id,Number(target.dataset.value));return;
 case 'water':setLab('water',Number(id));return;
 case 'synthesis':if(id==='washHands'){notify('손 씻기도 중요해요. 지금은 기침과 닫힌 공간을 각각 바꾸는 행동을 생각해 보세요.');return;}update(s=>{if(s.labs.synthesis.includes(id))s.labs.synthesis=s.labs.synthesis.filter(x=>x!==id);else s.labs.synthesis.push(id);});return;
 case 'experiment-action':update(s=>{s.experiment.action=id;s.experiment.prediction='';s.experiment.tick=0;s.experiment.pinned='';s.experiment.explanation='';});return;
 case 'predict':if(!state.experiment.action)return;update(s=>{s.experiment.prediction=id;s.experiment.tick=0;},false);navigate('P08');play('comparison');return;
 case 'difference':{const action=DATA.p07.actionPool.find(x=>x.id===state.experiment.action)!;update(s=>s.experiment.pinned=action.differenceEvent);return;}
 case 're-experiment':if(state.evidence.includes('E4')){if(!archive)archive=structuredClone(state);state=fixtureFor(4,state.settings);}navigate('P07');return;
 case 'question':if(state.strategy.asked.includes(id))return;if(state.strategy.asked.length>=3){notify('질문권을 모두 썼어요. 연구 노트와 이미 들은 답을 살펴봐요.');return;}update(s=>s.strategy.asked.push(id));return;
 case 'strategy-action':view.action=id;render();return;
 case 'place':if(!view.action){notify('배치할 행동을 먼저 골라주세요.');return;}place(view.action,id);return;
 case 'remove-placement':update(s=>{s.strategy.placements=s.strategy.placements.filter(p=>placementKey(p)!==id);s.strategy.simulated=false;});return;
 case 'simulate':update(s=>s.strategy.simulated=true);if(planResult(state.strategy.placements).success)sound('success');return;
 case 'begin-apply':update(s=>s.final.phase='apply');return;
 case 'apply':apply();return;
 case 'hand-zone':update(s=>{if(!s.final.hands.includes(id))s.final.hands.push(id);},false);if(state.final.hands.length===3)apply();else render();return;
 }
});
function setLab(id:string,value:number){update(s=>{s.labs.values[id]=value;if(value===1&&!s.labs.done.includes(id))s.labs.done.push(id);});}
function place(actionId:string,site:string){let result='';update(s=>result=addPlacement(s,{actionId,site}));if(result==='budget')notify('에너지가 부족해요. 기존 행동을 빼거나 바꿔보세요.');if(result==='wrong-site')notify('이 행동과 관련된 장소에 놓아주세요.');if(result==='duplicate')notify('이미 이 장소에 배치한 행동이에요.');}
function apply(){update(s=>{const p=s.strategy.placements.find(p=>!s.final.applied.includes(placementKey(p)));if(p)s.final.applied.push(placementKey(p));s.final.hands=[];});sound('success');}
function paintTimeline(){const trace=contactAt(state.timeline.tick,state.timeline.intervention);root.querySelectorAll<HTMLElement>('[data-node]').forEach(el=>el.classList.toggle('has-trace',trace.has(el.dataset.node!)));const text=root.querySelector('#time-label');if(text)text.textContent=`사건 ${state.timeline.tick.toFixed(1)} / 5`;const range=root.querySelector<HTMLInputElement>('[data-range="timeline"]');if(range)range.value=String(state.timeline.tick);}
function play(which:'timeline'|'comparison'){if(timer){stop();render();return;}if(which==='timeline'&&state.timeline.tick>=5)state.timeline.tick=0;if(which==='comparison'&&state.experiment.tick>=5)state.experiment.tick=0;view.playing=true;const localEpoch=epoch;timer=setInterval(()=>{if(localEpoch!==epoch){stop();return;}if(which==='timeline'){state.timeline.tick=Math.min(5,state.timeline.tick+.2);paintTimeline();if(state.timeline.tick>=5){stop();persist();render();}}else{state.experiment.tick=Math.min(5,state.experiment.tick+.25);const playing=state.experiment.tick<5;stop();render();if(playing)play('comparison');else persist();}},240);}
root.addEventListener('input',e=>{const el=e.target as HTMLInputElement;if(el.dataset.range==='timeline'){stop();state.timeline.tick=Number(el.value);paintTimeline();}if(el.dataset.range==='comparison'){stop();state.experiment.tick=Number(el.value);const content=document.getElementById('page-content');if(content){const keep=el;const focused=document.activeElement===el;content.innerHTML=pageContent(state,view);if(focused){const range=content.querySelector<HTMLInputElement>('[data-range="comparison"]');range?.focus();}void keep;}persist();}if(el.dataset.range==='window'){const value=Number(el.value);state.labs.values.air=value;root.querySelector('.window-demo')?.classList.toggle('open',value===1);}});
root.addEventListener('change',e=>{const el=e.target as HTMLInputElement|HTMLSelectElement;if(el.dataset.range==='timeline'){persist();render();}if(el.dataset.range==='comparison'){persist();render();}if(el.dataset.range==='window')setLab('air',Number(el.value));if(el.dataset.select==='explanation'){const a=DATA.p07.actionPool.find(x=>x.id===state.experiment.action);if(a&&el.value!==a.metric){notify('이 행동과 직접 관련된 변화인지 두 장면을 다시 살펴봐요.');}update(s=>s.experiment.explanation=el.value);}});
modalRoot.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-modal]');if(!b)return;switch(b.dataset.modal){case 'close':closeModal();return;case 'unlock':view.teacher=true;closeModal();navigate('C01');notify('미션을 고르면 본편을 보존하는 예시 시연으로 열려요.');return;case 'reset':modal(`<h2>새 연구를 시작할까요?</h2><p>현재 기기에 저장된 본편 기록이 초기화돼요.</p><div class="modal-actions"><button class="btn secondary" data-modal="close">취소</button><button class="btn primary" data-modal="confirm-reset">새 연구 시작</button></div>`);return;case 'confirm-reset':{const settings=state.settings;state=fresh();state.settings=settings;archive=null;protectedSave=false;view=viewFresh();closeModal();navigate('C01');return;}}});
modalRoot.addEventListener('change',e=>{const input=e.target as HTMLInputElement;const key=input.dataset.setting as keyof State['settings']|undefined;if(key){state.settings[key]=input.checked;if(archive)archive.settings[key]=input.checked;persist();document.body.classList.toggle('large-text',state.settings.large);document.body.classList.toggle('reduced',state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches);}});
document.addEventListener('keydown',e=>{if(!modalRoot.firstChild)return;if(e.key==='Escape'){closeModal();return;}if(e.key==='Tab'){const focusable=Array.from(modalRoot.querySelectorAll<HTMLElement>('button,input,select,[tabindex="0"]')).filter(x=>!x.hasAttribute('disabled'));const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
let dragged:{kind:string;id:string}|null=null;
root.addEventListener('dragstart',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drag]');if(!el||sealed()){e.preventDefault();return;}dragged={kind:el.dataset.drag!,id:el.dataset.id!};e.dataTransfer?.setData('text/plain',el.dataset.id!);});
root.addEventListener('dragover',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drop]');if(el&&dragged?.kind===el.dataset.drop){e.preventDefault();el.classList.add('drop-hover');}});
root.addEventListener('dragleave',e=>(e.target as HTMLElement).closest('[data-drop]')?.classList.remove('drop-hover'));
root.addEventListener('drop',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drop]');if(!el||!dragged||sealed())return;e.preventDefault();el.classList.remove('drop-hover');if(el.dataset.drop!==dragged.kind)return;const d=dragged;dragged=null;if(d.kind==='relation'){view.clue=d.id;update(s=>{s.relations[d.id]=el.dataset.id!;view.clue='';});}if(d.kind==='impact'){view.effect=d.id;el.click();}if(d.kind==='strategy')place(d.id,el.dataset.id!);if(d.kind==='serving')setLab('saliva',1);if(d.kind==='final-serve')apply();});
root.addEventListener('dragend',()=>{dragged=null;root.querySelectorAll('.drop-hover').forEach(x=>x.classList.remove('drop-hover'));});
let gesture:{x:number;id:number;kind:string;epoch:number}|null=null;
root.addEventListener('pointerdown',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-gesture]');if(el&&!sealed()){gesture={x:e.clientX,id:e.pointerId,kind:el.dataset.gesture!,epoch};el.setPointerCapture(e.pointerId);}});
root.addEventListener('pointerup',e=>{if(gesture&&gesture.id===e.pointerId&&gesture.epoch===epoch){const g=gesture;gesture=null;if(e.clientX-g.x>40){if(g.kind==='final-window')apply();else setLab('air',1);}}});
root.addEventListener('pointercancel',()=>gesture=null);
function viewport(){document.documentElement.style.setProperty('--app-height',`${visualViewport?.height??innerHeight}px`);gesture=null;}
window.addEventListener('resize',viewport);visualViewport?.addEventListener('resize',viewport);document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();persist();}});
viewport();derive(state);render();if(loaded.error)setTimeout(()=>notify(`기존 기록을 보존했어요. ${loaded.error} 새 연구는 교사용 안내에서 시작할 수 있어요.`),400);
