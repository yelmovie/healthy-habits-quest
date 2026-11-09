import { mountNpcGuide } from './npc-guide';
let disposeNpc: (()=>void) | undefined;
import './ui/style.css';
import './ui/stages-observation.css';
import './ui/stages-tracing.css';
import './ui/stages-strategy.css';
import './ui/activity-fit.css';
import {DATA,PAGES,STAGES,LABS,SITES,EFFECTS} from './data/game';
import {fresh,derive,canEnter,fixtureFor,addPlacement,planResult,placementKey,contactAt,applyPlacement,type State,type Route} from './simulation/model';
import {demonstrationSteps,playbackDelay,playbackSpeed,type PlaybackKind,type DemoStep} from './simulation/playback';
import {readSave,writeSave,resetSave,saveError} from './state/storage';
import {icon,esc} from './ui/icons';
import {header,home,map,mapStatus,mapViewLabel,shell,pageContent,records,viewFresh,comparisonBoard,comparisonTasks,type View,btn} from './ui/render';
import type {MapHandle} from './game/pixel-map';
import {NODES,PLACES} from './game/school-map';
const root=document.querySelector<HTMLDivElement>('#app')!,modalRoot=document.querySelector<HTMLDivElement>('#modal-root')!,toastRoot=document.querySelector<HTMLDivElement>('#toast')!;
const loaded=readSave();let state=loaded.state,protectedSave=!!loaded.error;let archive:State|null=null;let view:View=viewFresh();let epoch=0,mapHandle:MapHandle|null=null;let timer:ReturnType<typeof setInterval>|null=null,toastTimer:ReturnType<typeof setTimeout>|null=null;let focusBefore:HTMLElement|null=null;let soundContext:AudioContext|null=null;let saveWarning=false;let transitioning=false;
function notify(text:string,tone=''){toastRoot.textContent=text;toastRoot.className=`visible ${tone}`;if(toastTimer)clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastRoot.className='',3700);}
function sound(kind:'tap'|'success'='tap'){if(!state.settings.sound)return;try{soundContext??=new AudioContext();void soundContext.resume();const o=soundContext.createOscillator(),g=soundContext.createGain();o.type='sine';o.frequency.value=kind==='success'?660:420;g.gain.setValueAtTime(.045,soundContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,soundContext.currentTime+.12);o.connect(g);g.connect(soundContext.destination);o.start();o.stop(soundContext.currentTime+.13);}catch{/* Visual feedback remains available. */}}
function persist(){if(archive||protectedSave)return;if(!writeSave(state)&&!saveWarning){saveWarning=true;notify(saveError()??'이 기기에 저장하지 못했어요. 창을 닫으면 기록이 사라질 수 있어요.');}}
let playbackSession:{kind:PlaybackKind;route:Route;steps:DemoStep[];index:number}|null=null;let playbackToken=0;
function stop(){if(timer)clearTimeout(timer);timer=null;view.playing=false;view.autoMode='';playbackToken++;}
function update(fn:(s:State)=>void,redraw=true){const before=new Set(state.evidence);fn(state);derive(state);persist();if(state.evidence.some(e=>!before.has(e))){sound('success');notify('새 연구 기록이 자동으로 정리됐어요.','success');}if(redraw)render();}
function navigate(route:Route){if(!canEnter(state,route)){notify('앞선 조사 기록을 먼저 완성해 주세요.');return;}stop();state.route=route;if(route!=='C00'&&route!=='C01')state.lastRoute=route;view.clue='';view.effect='';view.replacement='';view.action='';view.focus='';view.index=0;view.labPreview=null;view.demoStep=0;playbackSession=null;derive(state);persist();render();}
function render(keepTimer=false){disposeNpc?.();if(!keepTimer){stop();playbackSession=null;}epoch++;mapHandle?.destroy();mapHandle=null;document.body.classList.toggle('reduced',state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches);document.body.classList.toggle('large-text',state.settings.large);document.body.classList.toggle('on-map',state.route==='C01');document.body.classList.toggle('on-home',state.route==='C00');document.body.classList.toggle('on-activity',state.route.startsWith('P'));
 if(state.route==='P06'&&state.completed.includes('P05')&&!state.labs.done.includes('contact')){state.labs.done.push('contact');derive(state);persist();}
 if(state.route==='P07'&&!state.experiment.baselineSeen){state.experiment.baselineSeen=true;persist();}
 root.innerHTML=header(state,!!archive)+(state.route==='C00'?home(state):state.route==='C01'?map(state,view):shell(state,view,pageContent(state,view)));
 if(state.route==='C00')disposeNpc=mountNpcGuide(root.querySelector('.title-actions'),{src:import.meta.env.BASE_URL+'assets/audio/npc-welcome.m4a',text:'보이지 않는 흔적을 함께 찾아보자. 증거를 살펴 감염이 퍼지는 경로를 생각하고, 생활 속에서 실천할 예방 방법을 골라 보자.',enabled:()=>state.settings.sound});
 if(protectedSave||saveWarning){const warning=document.createElement('div');warning.className='storage-warning';warning.setAttribute('role','status');warning.textContent=saveError()??'현재 탐구는 임시 상태예요. 창을 닫기 전에 연구 기록을 확인해 주세요.';root.prepend(warning);}
 if(state.route==='C01')mountMap();
 root.querySelectorAll<HTMLImageElement>('img').forEach(img=>{img.addEventListener('error',()=>{img.classList.add('failed-image');img.alt='배경 그림을 불러오지 못했어요.';const scene=img.parentElement;if(scene&&!scene.querySelector('.image-retry')){const button=document.createElement('button');button.className='image-retry btn small';button.textContent='그림 다시 읽기';button.onclick=()=>{img.classList.remove('failed-image');img.src=img.src;button.remove();};scene.append(button);}}, {once:true});});
}
function mapHint(place:number){const {open,done}=mapStatus(state,view),status=root.querySelector('.map-status');if(!status)return;const p=PLACES[place];status.textContent=!p?'길을 눌러 걷거나, 끌어서 학교를 둘러봐요.':!open[place]?`${p.name}은 앞선 미션을 마치면 열려요.`:done[place]?`${p.name}: 이름표를 누르면 다시 실험해요.`:`${p.name}에 도착했어요.`;}
function mountMap(){const currentEpoch=epoch,{open,next}=mapStatus(state,view),last=PLACES[state.evidence.length-1];import('./game/pixel-map').then(async ({createMap})=>{if(epoch!==currentEpoch)return;const parent=document.getElementById('pixel-map');if(!parent)return;
 const h=await createMap(parent,{start:view.mapSpot??(last?NODES[last.node]:null),overview:view.mapOverview,reduced:state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches,open,next,onSelect:n=>void startStage(n),onMove:p=>{view.mapSpot=p;},onStop:mapHint,onView:mode=>{view.mapOverview=mode==='overview';const label=root.querySelector('[data-map-view-label]');if(label)label.textContent=mapViewLabel(mode);}});
 if(epoch!==currentEpoch)h.destroy();else mapHandle=h;}).catch(()=>{const parent=document.getElementById('pixel-map');if(parent)parent.innerHTML='<div class="map-fallback">지도를 읽지 못했어요.<br>오른쪽 아래 번호 버튼으로 바로 시작할 수 있어요.</div>';});}
async function startStage(n:number){if(transitioning)return;const unlocked=n===1||state.evidence.includes(`E${n-1}`);if(!unlocked&&!view.teacher)return;transitioning=true;const current=epoch;try{// 화면이 가려져 애니메이션이 멈춰도 잠금이 풀리도록 이동 연출은 최대 2.2초만 기다린다.
 if(mapHandle)await Promise.race([mapHandle.travel(n),new Promise(r=>setTimeout(r,2200))]);if(current!==epoch)return;
 const stage=STAGES[n-1];if(view.teacher||!unlocked||state.completed.includes(stage.pages[1])){if(!archive)archive=structuredClone(state);state=fixtureFor(n,state.settings);notify(view.teacher||!unlocked?'예시 기록을 사용하는 교사용 시연이에요.':'본편 기록을 보존하며 다시 실험해요.');}
 navigate(stage.pages[0] as Route);
 }finally{transitioning=false;}}
function closeModal(){modalRoot.innerHTML='';root.inert=false;focusBefore?.focus();focusBefore=null;}
function modal(content:string){stop();persist();paintPlaybackControls();if(!root.inert)focusBefore=document.activeElement as HTMLElement;root.inert=true;modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="조사 안내"><button class="icon-btn modal-close" data-modal="close" aria-label="닫기">${icon('close')}</button>${content}</section></div>`;modalRoot.querySelector<HTMLButtonElement>('button')?.focus();}
function confirmReset(){modal(`<h2>새 연구를 시작할까요?</h2><p>현재 기기의 본편 기록은 복구용 사본으로 보관한 뒤 새로 시작해요. 백업 공간이 부족하면 초기화하지 않아요.</p><div class="modal-actions"><button class="btn secondary" data-modal="close">취소</button><button class="btn primary" data-modal="confirm-reset">새 연구 시작</button></div>`);}
function teacher(){modal(`<div class="eyebrow">TEACHER'S GUIDE</div><h2>관찰에서 실천으로 이어지는 과학</h2><p>5개 미션의 연구 기록을 모아 학교 대응안을 완성해요. 모형의 흔적은 실제 감염 여부나 감염 확률이 아니에요.</p><div class="guide-stages">${STAGES.map((s,i)=>`<div><b>0${i+1} ${s.name}</b><span>${['관찰하고 중요한 단서 고르기','관계를 설명하고 생활 영향 살피기','시간을 되감고 개입 시점 비교하기','다른 조건은 같게, 한 행동만 바꾸기','예산 안에서 계획하고 직접 적용하기'][i]}</span></div>`).join('')}</div><p>카드는 드래그하거나 선택 후 대상을 눌러 연결할 수 있어요. 입력과 기록은 자동 저장돼요. 같은 기기·같은 주소에서 이어갈 수 있어요.</p><div class="modal-actions"><button class="btn primary" data-modal="unlock">전 미션 시연 열기</button><button class="btn secondary" data-modal="reset">새 연구 시작</button></div><small>시연 기록은 학생 본편에 덮어쓰지 않아요. 실제 학교망·기기 동시 접속 검증은 별도로 필요해요.</small>`);}
function settings(){modal(`<div class="eyebrow">SETTINGS</div><h2>내게 편한 조사 환경</h2>${([['sound','소리 피드백'],['reduced','동작 줄이기'],['large','큰 글자']] as const).map(([key,label])=>`<label class="setting-row"><span>${label}</span><span class="switch"><input type="checkbox" role="switch" data-setting="${key}" ${state.settings[key]?'checked':''}><b aria-hidden="true"></b></span></label>`).join('')}<p>소리를 꺼도 모든 조작과 학습 내용을 확인할 수 있어요.</p><div class="setting-info"><b>정보</b><p>이 프로그램에 사용된 이미지는 생성형 이미지를 사용하여 제작되었습니다.</p><p>기록은 이 기기의 브라우저에만 저장되고, 이름 같은 개인정보는 저장하지 않아요.</p></div><button class="btn secondary" data-modal="records">연구 기록 보기</button>`);}
function sealed():boolean{const route=state.route;if(route==='P10')return false;const i=PAGES.findIndex(p=>p.id===route);return i>=0&&state.evidence.includes(`E${Math.floor(i/2)+1}`);}
root.addEventListener('click',e=>{if(Date.now()<suppressClick)return;const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action]');if(!target||target.hasAttribute('disabled'))return;const a=target.dataset.action!,id=target.dataset.id??'';sound();
 if(['home','map','records','settings','sound','teacher','start','new-game','next','exit-replay','stage','print','certificate'].includes(a)){
 switch(a){case 'home':navigate('C00');return;case 'map':navigate('C01');return;case 'records':modal(records(state));return;case 'settings':settings();return;case 'teacher':teacher();return;case 'new-game':confirmReset();return;
 case 'sound':state.settings.sound=!state.settings.sound;persist();render();return;
 case 'start':navigate(state.found.length?state.lastRoute:'C01');return;
 case 'exit-replay':if(archive){state=archive;archive=null;view.teacher=false;navigate('C01');}return;
 case 'stage':void startStage(Number(id));return;
 case 'next':if(state.completed.includes(state.route)){const p=PAGES.find(p=>p.id===state.route)!;navigate(p.next as Route);}return;
 case 'print':window.print();return;
 case 'certificate':update(s=>s.final.phase='certificate');return;}
 }
 if(a==='auto-play'){play(target.dataset.kind as PlaybackKind);return;}
 if(a==='questions'){questions();return;}
 if(a==='model-info'){modal('<h2>학습 모형 안내</h2><p>보라색 흔적과 그림은 생활 속 연결을 관찰하는 모형이에요. 실제 입자 수나 감염 여부·확률을 나타내지 않아요.</p><p>자동재생은 실험 과정을 보여줘요. 단서·예측·해석·대응 계획은 직접 선택해요.</p>');return;}
 if(a==='focus'){view.focus=id;render();return;}
 if(a==='focus-index'){view.index=Math.max(0,Number(id)||0);render();return;}
 if(a==='site-preview'){view.site=id;render();return;}
 if(sealed()&&!['site','lab','timeline-play','comparison-play','re-experiment','select-clue','select-effect'].includes(a)){notify('이 미션의 기록이 완성됐어요. 지도에서 다시 실험할 수 있어요.');return;}
 switch(a){
 case 'discover':if(state.found.includes(id)&&state.completed.includes('P01')){view.site=id;navigate('P02');return;}update(s=>{if(!s.found.includes(id))s.found.push(id);});notify('신호 위치를 기록했어요.');return;
 case 'site':view.site=id;view.index=0;view.replacement='';view.focus='clues';render();return;
 case 'clue':if(state.clues.includes(id)){update(s=>s.clues=s.clues.filter(x=>x!==id));return;}if(state.clues.length>=5){view.replacement=id;view.focus='tray';notify('바꿀 기존 단서를 골라주세요.');render();return;}update(s=>s.clues.push(id));return;
 case 'remove-clue':update(s=>{s.clues=s.clues.filter(x=>x!==id);if(view.replacement){s.clues.push(view.replacement);view.replacement='';}});return;
 case 'select-clue':view.clue=id;view.focus='targets';render();return;
 case 'link-target':if(!view.clue){notify('먼저 연결할 단서를 골라주세요.');return;}update(s=>{s.relations[view.clue]=id;view.clue='';view.focus='';});return;
 case 'select-effect':view.effect=id;view.focus='domains';render();return;
 case 'impact-domain':linkImpact(id);return;
 case 'source':update(s=>s.timeline.source=id);if(id!=='book')notify('시간을 처음으로 되감아 가장 먼저 빛난 물체를 살펴보세요.');return;
 case 'intervene':update(s=>{s.timeline.intervention=Number(id);s.timeline.tick=5;});return;
 case 'timeline-play':play('timeline');return;
 case 'comparison-play':play('comparison');return;
 case 'lab':view.lab=id;view.labPreview=null;view.demoStep=0;render();return;
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
 case 'apply':if(Date.now()<applyLock)return;apply(id);return;
 case 'hand-zone':if(Date.now()<applyLock)return;update(s=>{if(!s.final.hands.includes(id))s.final.hands.push(id);},false);if(state.final.hands.length===3)apply(target.dataset.key??'');else render();return;
 }
});
function linkImpact(id:string){if(!view.effect){notify('먼저 영향 카드를 골라주세요.');return;}if(DATA.p04.links.find(x=>x.id===view.effect)?.domain!==id){notify('이 영향은 누구의 생활과 더 직접 이어질까요?');return;}update(s=>{s.impacts[id]=view.effect;view.effect='';view.focus='';});}
function setLab(id:string,value:number){view.labPreview=null;update(s=>{s.labs.values[id]=value;if(value===1&&!s.labs.done.includes(id))s.labs.done.push(id);});}
function place(actionId:string,site:string){let result='';update(s=>result=addPlacement(s,{actionId,site}));if(result==='budget')notify('에너지가 부족해요. 기존 행동을 빼거나 바꿔보세요.');if(result==='wrong-site')notify('이 행동과 관련된 장소에 놓아주세요.');if(result==='duplicate')notify('이미 이 장소에 배치한 행동이에요.');}
// 적용 직후 같은 자리에 다음 계획 버튼이 그려지므로, 연속 탭이 그 버튼까지 누르지 않게 잠깐 막는다.
let applyLock=0;
function apply(key:string){if(Date.now()<applyLock)return;let applied=false;update(s=>applied=applyPlacement(s,key));if(applied){applyLock=Date.now()+700;sound('success');notify('계획을 직접 실천했어요.','success');}}
function paintTimeline(){const trace=contactAt(state.timeline.tick,state.timeline.intervention);root.querySelectorAll<HTMLElement>('[data-node]').forEach(el=>el.classList.toggle('has-trace',trace.has(el.dataset.node!)));const text=root.querySelector('#time-label');if(text)text.textContent=`사건 ${state.timeline.tick.toFixed(1)} / 5`;const range=root.querySelector<HTMLInputElement>('[data-range="timeline"]');if(range)range.value=String(state.timeline.tick);}
function paintComparison(){const live=root.querySelector('.comparison-live'),tasks=root.querySelector('.comparison-tasks'),text=root.querySelector('#comparison-time'),range=root.querySelector<HTMLInputElement>('[data-range="comparison"]');if(live)live.innerHTML=comparisonBoard(state);const a=DATA.p07.actionPool.find(x=>x.id===state.experiment.action);const after=String(!!a&&state.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time);if(tasks instanceof HTMLElement&&tasks.dataset.after!==after){tasks.dataset.after=after;tasks.innerHTML=comparisonTasks(state);}if(text)text.textContent=`${state.experiment.tick.toFixed(1)} / 5`;if(range&&document.activeElement!==range)range.value=String(state.experiment.tick);}
function showPlay(action:string,label:string){const b=root.querySelector(`[data-action="${action}"]`);if(b){b.innerHTML=icon('play',20);b.setAttribute('aria-label',label);}}
function paintPlaybackControls(){
 root.querySelectorAll<HTMLElement>('.playback-toggle').forEach(b=>{const active=view.playing&&view.autoMode===b.dataset.kind;b.innerHTML=`${icon(active?'pause':'play',20)}<span>${active?'직접 해보기':'자동재생'}</span>`;b.setAttribute('aria-pressed',String(active));b.classList.toggle('selected',active);});
 root.querySelectorAll('.playback-state').forEach(el=>el.textContent=view.playing?'과정을 함께 관찰해요':'직접 조작할 수도 있어요');
}
function performDemo(step:DemoStep){
 if(step.type==='scan'){view.site=step.site;view.demoStep++;if(step.record&&!sealed()&&!state.found.includes(step.site))state.found.push(step.site);}
 if(step.type==='contact')view.demoStep=step.node;
 if(step.type==='lab'){view.labPreview=step.value;if(!sealed()){state.labs.values[step.lab]=step.value;if(step.value===1&&!state.labs.done.includes(step.lab))state.labs.done.push(step.lab);}}
 if(step.type==='apply'||step.type==='hand'){
  const current=state.strategy.placements.find(p=>!state.final.applied.includes(placementKey(p)));
  if(state.final.phase!=='apply'||!current||placementKey(current)!==step.key)return;
  if(step.type==='hand'){if(!state.final.hands.includes(step.zone))state.final.hands.push(step.zone);if(state.final.hands.length===3)applyPlacement(state,step.key);}
  else applyPlacement(state,step.key);
 }
 derive(state);persist();
}
function schedulePlayback(){
 const session=playbackSession;if(!session||!view.playing)return;
 const token=playbackToken;
 timer=setTimeout(()=>{
  timer=null;if(token!==playbackToken||!view.playing||state.route!==session.route||root.inert||document.hidden){stop();paintPlaybackControls();return;}
  if(session.kind==='timeline'||session.kind==='comparison'){
   const target=session.kind==='timeline'?state.timeline:state.experiment;
   target.tick=Math.min(5,Math.round((target.tick+.12*view.speed)*1000)/1000);
   if(session.kind==='timeline')paintTimeline();else paintComparison();
   if(target.tick>=5){stop();playbackSession=null;persist();render(true);return;}
  }else{
   const step=session.steps[session.index++];if(step)performDemo(step);
   if(session.index>=session.steps.length){stop();playbackSession=null;render(true);return;}
   render(true);
  }
  schedulePlayback();
 },session.kind==='timeline'||session.kind==='comparison'?120:playbackDelay(view.speed));
}
function play(which:PlaybackKind){
 if(!['scan','timeline','lab','comparison','apply'].includes(which))return;
 if(view.playing&&view.autoMode===which){stop();persist();render(true);return;}
 if(view.playing)stop();
 if(which==='lab'&&['water','synthesis'].includes(view.lab))return;
 if(which==='apply'&&state.final.phase!=='apply')return;
 const resumable=playbackSession?.kind===which&&playbackSession.route===state.route;
 if(!resumable){
  const steps=demonstrationSteps(state,which,view.lab);
  if(which!=='timeline'&&which!=='comparison'&&!steps.length)return;
  playbackSession={kind:which,route:state.route,steps,index:0};
  if(which==='timeline'&&state.timeline.tick>=5)state.timeline.tick=0;
  if(which==='comparison'&&state.experiment.tick>=5)state.experiment.tick=0;
  view.demoStep=0;
 }
 view.playing=true;view.autoMode=which;render(true);schedulePlayback();
}
function questions(){
 const remaining=root.querySelector('[data-action="questions"] b');if(remaining)remaining.textContent=String(3-state.strategy.asked.length);
 modal(`<h2>현장에 물어보기</h2><p>남은 질문 ${3-state.strategy.asked.length}회 · 들은 답은 다시 볼 수 있어요.</p><div class="guide-stages question-dialog">${DATA.p09.questions.map(q=>`<button class="btn secondary question-dialog-card" data-modal="question" data-id="${q.id}" ${!state.strategy.asked.includes(q.id)&&(state.strategy.asked.length>=3||sealed())?'disabled':''}><strong>${q.text}</strong>${state.strategy.asked.includes(q.id)?`<span>${q.answer}</span>`:''}</button>`).join('')}</div>`);
}
root.addEventListener('input',e=>{const el=e.target as HTMLInputElement;if(el.dataset.range==='timeline'){if(timer){stop();showPlay('timeline-play','재생');paintPlaybackControls();}state.timeline.tick=Number(el.value);paintTimeline();}if(el.dataset.range==='comparison'){if(timer){stop();showPlay('comparison-play','비교 재생');paintPlaybackControls();}state.experiment.tick=Number(el.value);paintComparison();}if(el.dataset.range==='window'&&!sealed()){root.querySelector('.window-demo')?.classList.toggle('open',el.value==='1');}});
root.addEventListener('change',e=>{const el=e.target as HTMLInputElement|HTMLSelectElement;if(el.dataset.select==='observation-site'){view.site=el.value;view.index=0;view.replacement='';view.focus='clues';render();return;}if(el.dataset.select==='playback-speed'){view.speed=playbackSpeed(Number(el.value));if(timer){clearTimeout(timer);timer=null;schedulePlayback();}return;}if(el.dataset.select==='intervention'){if(sealed())return;if(el.value!=='')update(s=>{s.timeline.intervention=Number(el.value);s.timeline.tick=5;});return;}if(el.dataset.range==='timeline'){persist();render();}if(el.dataset.range==='comparison'){persist();render();}if((el.dataset.range==='window'||el.dataset.select==='explanation')&&sealed()){notify('이 미션의 기록이 완성됐어요. 지도에서 다시 실험할 수 있어요.');render();return;}if(el.dataset.range==='window')setLab('air',Number(el.value));if(el.dataset.select==='explanation'){const a=DATA.p07.actionPool.find(x=>x.id===state.experiment.action);if(a&&el.value!==a.metric){notify('이 행동과 직접 관련된 변화인지 두 장면을 다시 살펴봐요.');}update(s=>s.experiment.explanation=el.value);}});
modalRoot.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-modal]');if(!b)return;switch(b.dataset.modal){case 'records':modal(records(state));return;case 'question':{const id=b.dataset.id!;if(!state.strategy.asked.includes(id)&&state.strategy.asked.length<3&&!sealed()){state.strategy.asked.push(id);derive(state);persist();}questions();return;}case 'close':closeModal();return;case 'unlock':if(!archive)archive=structuredClone(state);state=structuredClone(state);view.teacher=true;closeModal();navigate('C01');notify('미션을 고르면 본편을 보존하는 예시 시연으로 열려요.');return;case 'reset':confirmReset();return;case 'confirm-reset':{const next=fresh();next.settings={...state.settings};if(!resetSave(next)){notify(saveError()??'새 연구를 저장하지 못해 기존 기록을 유지했어요.');return;}state=next;archive=null;protectedSave=false;saveWarning=false;view=viewFresh();closeModal();navigate('C01');return;}}});
modalRoot.addEventListener('change',e=>{const input=e.target as HTMLInputElement;const key=input.dataset.setting as keyof State['settings']|undefined;if(key){state.settings[key]=input.checked;persist();document.body.classList.toggle('large-text',state.settings.large);document.body.classList.toggle('reduced',state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches);}});
document.addEventListener('keydown',e=>{if(!modalRoot.firstChild)return;if(e.key==='Escape'){closeModal();return;}if(e.key==='Tab'){const focusable=Array.from(modalRoot.querySelectorAll<HTMLElement>('button,input,select,[tabindex="0"]')).filter(x=>!x.hasAttribute('disabled'));const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
let dragged:{kind:string;id:string}|null=null;
root.addEventListener('dragstart',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drag]');if(!el||sealed()||touchDrag){e.preventDefault();return;}dragged={kind:el.dataset.drag!,id:el.dataset.id!};e.dataTransfer?.setData('text/plain',el.dataset.id!);});
root.addEventListener('dragover',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drop]');if(el&&dragged?.kind===el.dataset.drop){e.preventDefault();el.classList.add('drop-hover');}});
root.addEventListener('dragleave',e=>(e.target as HTMLElement).closest('[data-drop]')?.classList.remove('drop-hover'));
function dropOn(d:{kind:string;id:string},el:HTMLElement){if(d.kind==='relation'){view.clue=d.id;update(s=>{s.relations[d.id]=el.dataset.id!;view.clue='';});}if(d.kind==='impact'){view.effect=d.id;linkImpact(el.dataset.id!);}if(d.kind==='strategy')place(d.id,el.dataset.id!);if(d.kind==='serving')setLab('saliva',1);if(d.kind==='final-serve')apply(d.id);}
root.addEventListener('drop',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drop]');if(!el||!dragged||sealed())return;e.preventDefault();el.classList.remove('drop-hover');if(el.dataset.drop!==dragged.kind)return;const d=dragged;dragged=null;dropOn(d,el);});
root.addEventListener('dragend',()=>{dragged=null;root.querySelectorAll('.drop-hover').forEach(x=>x.classList.remove('drop-hover'));});
// 태블릿·전자칠판: HTML 드래그는 터치에서 동작하지 않아 손가락 끌기를 포인터 이벤트로 따로 처리한다.
let touchDrag:{kind:string;id:string;source:HTMLElement;x:number;y:number;pointer:number;ghost:HTMLElement|null;over:HTMLElement|null}|null=null,suppressClick=0;
root.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||touchDrag)return;const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drag]');if(!el||sealed())return;touchDrag={kind:el.dataset.drag!,id:el.dataset.id!,source:el,x:e.clientX,y:e.clientY,pointer:e.pointerId,ghost:null,over:null};});
window.addEventListener('pointermove',e=>{const t=touchDrag;if(!t||e.pointerId!==t.pointer)return;if(!t.ghost){if(Math.hypot(e.clientX-t.x,e.clientY-t.y)<12)return;const r=t.source.getBoundingClientRect();const ghost=t.source.cloneNode(true) as HTMLElement;ghost.classList.add('drag-ghost');ghost.setAttribute('aria-hidden','true');Object.assign(ghost.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});document.body.append(ghost);t.ghost=ghost;t.source.classList.add('dragging');}
 t.ghost.style.transform=`translate(${e.clientX-t.x}px,${e.clientY-t.y}px) rotate(-2deg)`;const under=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>('[data-drop]')??null;const target=under&&under.dataset.drop===t.kind?under:null;if(t.over!==target){t.over?.classList.remove('drop-hover');target?.classList.add('drop-hover');t.over=target;}});
function endTouchDrag(e:PointerEvent,cancel:boolean){const t=touchDrag;if(!t||e.pointerId!==t.pointer)return;touchDrag=null;if(!t.ghost)return;t.ghost.remove();t.source.classList.remove('dragging');t.over?.classList.remove('drop-hover');if(!cancel&&t.over&&!sealed())dropOn(t,t.over);suppressClick=Date.now()+450;}
window.addEventListener('pointerup',e=>endTouchDrag(e,false));window.addEventListener('pointercancel',e=>endTouchDrag(e,true));

let gesture:{x:number;id:number;kind:string;key:string;epoch:number}|null=null;
root.addEventListener('pointerdown',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-gesture]');if(el&&!sealed()){gesture={x:e.clientX,id:e.pointerId,kind:el.dataset.gesture!,key:el.dataset.id??'',epoch};el.setPointerCapture(e.pointerId);}});
root.addEventListener('pointerup',e=>{if(gesture&&gesture.id===e.pointerId&&gesture.epoch===epoch){const g=gesture;gesture=null;if(e.clientX-g.x>40){if(g.kind==='final-window')apply(g.key);else setLab('air',1);}}});
root.addEventListener('pointercancel',()=>gesture=null);
function viewport(){document.documentElement.style.setProperty('--app-height',`${visualViewport?.height??innerHeight}px`);gesture=null;}
window.addEventListener('resize',viewport);visualViewport?.addEventListener('resize',viewport);document.addEventListener('visibilitychange',()=>{if(document.hidden){const was=!!timer;stop();persist();if(was)render();}});
if(import.meta.env.PROD&&'serviceWorker' in navigator)addEventListener('load',()=>void navigator.serviceWorker.register('./sw.js').catch(()=>{/* 오프라인 캐시 없이도 앱은 동작한다. */}));
viewport();derive(state);render();if(loaded.error)setTimeout(()=>notify(`기존 기록을 보존했어요. ${loaded.error} 새 연구는 교사용 안내에서 시작할 수 있어요.`),400);
