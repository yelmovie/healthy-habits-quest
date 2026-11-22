import {mountWindowRestoration} from './ui/window-restoration';
import './ui/window-restoration.css';
import { createResearchAudio, createMusic, type Cue } from './audio';
import { mountNarration } from './ui/narration';
import { mountNpcGuide } from './npc-guide';
import {openStoryFilm} from './story-film.js';
import {saveCertificatePng} from './ui/cert-png';
let disposeNpc: (()=>void) | undefined;
import './ui/style.css';
import './ui/stages-observation.css';
import './ui/stages-tracing.css';
import './ui/stages-strategy.css';
import './ui/certificate.css';
import './ui/activity-fit.css';
import './ui/scenery-surfaces.css';
import './ui/learning-guidance.css';
import './ui/flow-upgrade.css';
import './reward-cards.css';
import './reward-card-set.css';
import {learningGuide,curriculumGuide,nextInstruction} from './ui/learning-guidance';
import {DATA,PAGES,STAGES,LABS,SITES,EFFECTS,asset} from './data/game';
const STAGE_BACKDROPS:Record<string,string>={S1:'bg-plaza-20261116',S2:'bg-gym-20261116',S3:'bg-classroom-20261116',S4:'bg-cafeteria-20261116',S5:'bg-field-20261116'};
import {fresh,derive,canEnter,tryIntervention,timingCompared,EARLY_WASH,fixtureFor,addPlacement,planResult,placementKey,contactAt,applyPlacement,type State,type Route} from './simulation/model';
import {demonstrationSteps,playbackDelay,playbackSpeed,type PlaybackKind,type DemoStep} from './simulation/playback';
import {readSave,writeSave,resetSave,saveError} from './state/storage';
import {icon,esc} from './ui/icons';
import {header,home,map,mapStatus,mapViewLabel,shell,pageContent,records,viewFresh,comparisonBoard,comparisonTasks,gateHint,soundOn,type View,btn,CREDIT} from './ui/render';
import type {MapHandle} from './game/pixel-map';
import {NODES,PLACES} from './game/school-map';
import {SIGNAL_SPOTS} from './ui/stages-observation';
import {rewardSlotsHtml,wonRewardCards,winRewardCard,rewardCardDue,bindRewardSound} from './reward-card-set';
const root=document.querySelector<HTMLDivElement>('#app')!,modalRoot=document.querySelector<HTMLDivElement>('#modal-root')!,toastRoot=document.querySelector<HTMLDivElement>('#toast')!;
const loaded=readSave();let state=loaded.state,protectedSave=!!loaded.error;let archive:State|null=null;let view:View={...viewFresh(),lab:state.labs.active};let epoch=0,mapHandle:MapHandle|null=null;let travelRequest=0,travellingStage=0;let timer:ReturnType<typeof setInterval>|null=null,toastTimer:ReturnType<typeof setTimeout>|null=null;let focusBefore:HTMLElement|null=null;let saveWarning=false;
function hideToast(){toastRoot.className='';if(toastTimer)clearTimeout(toastTimer);toastTimer=null;}
function notify(text:string,tone=''){toastRoot.textContent=text;toastRoot.className=`visible ${tone}`;narration.announce(text);if(toastTimer)clearTimeout(toastTimer);const finish=()=>{if(narration.isToastPlaying())toastTimer=setTimeout(finish,250);else toastRoot.className='';};toastTimer=setTimeout(finish,3700);}
// 설정의 「효과음」은 효과음과 안내 목소리를, 「배경 음악」과 그 크기는 배경 음악만 맡는다. 머리글 소리 버튼은 둘을 함께 켜고 끈다.
// 효과음 크기(기본 100%)는 효과음 갈래 전체(UI·전투·보상·발자국)에 곱한다.
const researchAudio=createResearchAudio(()=>state.settings.sfx,import.meta.env.BASE_URL,()=>state.settings.sfxVolume/100);
// 이야기 영상(인트로·파이널)의 소리 트랙은 대사뿐이다. 배경 음악은 게임 음악이 설정대로 이어지고, 대사가 들릴 때만 낮춘다.
const music=createMusic(()=>state.settings.music,import.meta.env.BASE_URL,()=>state.settings.musicVolume/100);
// 정답·기록 효과음이 막 났으면 이어지는 대사는 그 소리가 끝날 즈음 시작한다(voiceWait).
// 목소리(인물 대사·안내·악당 말풍선 음성)는 자기 스위치를 따른다. 꺼도 글·말풍선은 그대로 보인다.
const narration=mountNarration({enabled:()=>state.settings.voice,quiet:v=>{researchAudio.quiet(v);music.quiet(v);},context:()=>state.route,delay:()=>researchAudio.voiceWait()});
function syncSound(){researchAudio.sync();music.sync();narration.sync();const on=soundOn(state),button=root.querySelector('[data-action="sound"]');if(button&&button.getAttribute('aria-pressed')!==String(on)){button.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');button.setAttribute('aria-pressed',String(on));button.innerHTML=icon(on?'sound':'mute');}}
function sound(kind:Cue='tap'){void researchAudio.play(kind);}
// 성취 카드 소리는 앞 소리(악당 퇴장, 카드 등장)를 끊지 않고 겹쳐 낸다. 지도 파이널은 완성 징글이 끝난 뒤에 열리고(encounterHold),
// 열릴 때 남은 효과음을 정리해 파이널 음악과 겹치지 않게 한다.
bindRewardSound(cue=>void researchAudio.play(cue,true));
document.addEventListener('map-finale-music',e=>{if((e as CustomEvent<boolean>).detail)researchAudio.stop();});
function persist(){if(archive||protectedSave)return;if(!writeSave(state)&&!saveWarning){saveWarning=true;notify(saveError()??'이 기기에 저장하지 못했어요. 창을 닫으면 기록이 사라질 수 있어요.');}}
let pendingMapRestore:number[]=[];
let pendingMapEncounter:number|null=null;
function queueMapEncounter(previous:Set<string>){if(!archive)for(const [i,stage] of STAGES.entries())if(state.completed.includes(stage.pages[1])&&!previous.has(stage.pages[1]))pendingMapEncounter=i;}
let mapRequest:AbortController|null=null;
let playbackSession:{kind:PlaybackKind;route:Route;steps:DemoStep[];index:number}|null=null;let playbackToken=0;
function stop(){if(timer)clearTimeout(timer);timer=null;view.playing=false;view.autoMode='';playbackToken++;}
function update(fn:(s:State)=>void,redraw=true){const before=new Set(state.evidence),pages=new Set(state.completed);fn(state);derive(state);persist();const newEvidence=state.evidence.filter(e=>!before.has(e)),evidence=newEvidence.length>0;
 if(!archive){pendingMapRestore.push(...newEvidence.map(e=>Number(e.slice(1))-1));if(state.completed.includes('P10')&&!pages.has('P10')){pendingMapRestore.push(5);setTimeout(()=>{if(state.route==='P10')playFilm('outro');},1600);}}
 queueMapEncounter(pages);// 활동을 마친 순간에도 기록 완성과 같은 성공 소리를 한 번만 낸다.
 if(evidence||state.completed.some(p=>!pages.has(p)))sound('success');if(evidence)notify('새 연구 기록이 자동으로 정리됐어요.','success');if(redraw)render();}
// 브라우저 뒤로 가기: 화면 단계(시작 0·지도 1·활동 2)를 history 칸으로 둬서 앱 안의 앞 화면으로 간다.
// 시작 화면에서 한 번 더 누르면 평소처럼 앱을 나간다. 앱 안 버튼으로 위 단계로 갈 때는 그만큼 history 를 되감는다.
const depthOf=(r:Route)=>r==='C00'?0:r==='C01'?1:2;let historyDepth=0,historyQuiet=0;
function syncHistory(route:Route){const want=depthOf(route);if(want>historyDepth){for(let d=historyDepth+1;d<=want;d++)history.pushState({it:d},'');}else if(want<historyDepth){historyQuiet++;history.go(want-historyDepth);}historyDepth=want;}
// 처음 조사를 시작할 때 인트로, 학교 대응안을 처음 완성했을 때 아웃트로를 한 번 보여 준다(건너뛸 수 있음).
function playFilm(kind:'intro'|'outro',after?:()=>void){const base=`${import.meta.env.BASE_URL}assets/story/${kind}-film`;
 // 목소리가 꺼져 있으면 영상 속 대사도 끈다(자막은 영상 안에 남는다). 그때 배경 음악은 평소 크기 그대로.
 const voiced=state.settings.voice;
 const opened=openStoryFilm(document,{src:`${base}.mp4`,poster:`${base}-poster.jpg`,label:kind==='intro'?'인트로 영상: 우리 학교에 남은 흔적':'파이널 영상: 우리의 발견이 학교를 바꿨어요',
  muted:!voiced,autoplay:!(state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches),
  onClose:()=>{if(voiced)music.quiet(false);after?.();}});
 if(opened){narration.stop();researchAudio.stop();if(voiced)music.quiet(true);}
 return opened;}
function navigate(route:Route,fromHistory=false){if(!canEnter(state,route)){notify('앞선 조사 기록을 먼저 완성해 주세요.');return;}if(!fromHistory)syncHistory(route);narration.stop();stop();if(route!==state.route)hideToast();state.route=route;if(route!=='C00'&&route!=='C01')state.lastRoute=route;view.clue='';view.effect='';view.replacement='';view.action='';view.focus='';view.index=0;view.lab=state.labs.active;view.labPreview=null;view.demoStep=0;playbackSession=null;derive(state);persist();render();}
function render(keepTimer=false){disposeNpc?.();if(!keepTimer){stop();playbackSession=null;}epoch++;travelRequest++;travellingStage=0;mapRequest?.abort();mapRequest=null;mapHandle?.destroy();mapHandle=null;document.body.classList.toggle('reduced',state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches);document.body.classList.toggle('large-text',state.settings.large);document.body.classList.toggle('on-map',state.route==='C01');document.body.classList.toggle('on-home',state.route==='C00');document.body.classList.toggle('on-activity',state.route.startsWith('P'));
 music.scene(state.route==='P10'&&['restored','ending','certificate'].includes(state.final.phase)?'final':'main');
 // 미션마다 지도 속 장소 그림을 활동 화면 뒤에 깐다(신호 광장·체육관·본관 교실·급식실·운동장).
 {const stage=PAGES.find(p=>p.id===state.route)?.stage;const bg=stage?STAGE_BACKDROPS[stage]:'';// CSS 변수 속 상대 주소는 스타일 파일 위치 기준으로 풀리므로 문서 기준 절대 주소로 바꿔 넣는다.
 if(bg)document.body.style.setProperty('--stage-bg',`url("${new URL(asset(bg),document.baseURI).href}")`);else document.body.style.removeProperty('--stage-bg');document.body.classList.toggle('has-stage-bg',!!bg);}
 if(state.route==='P06'&&state.completed.includes('P05')&&!state.labs.done.includes('contact')){state.labs.done.push('contact');derive(state);persist();}
 if(state.route==='P06'&&view.lab==='contact'){view.lab=LABS.find(l=>l.id!=='contact'&&!state.labs.done.includes(l.id))?.id??'synthesis';}
 if(state.route==='P07'&&!state.experiment.baselineSeen){state.experiment.baselineSeen=true;persist();}
 // P09에서 방금 본 계획을 다시 보여 주는 확인 화면은 건너뛰고 바로 실천한다.
 if(state.route==='P10'&&state.final.phase==='report'&&state.completed.includes('P09')){state.final.phase='apply';persist();}
 const body=state.route==='C00'?home(state):state.route==='C01'?map(state,view):shell(state,view,pageContent(state,view));
 root.innerHTML=header(state,!!archive,state.route==='C01'?rewardSlotsHtml((archive??state).mapHits):'',body.match(/<aside class="learning-focus[\s\S]*?<\/aside>/)?.[0]??'')+body;
 if(state.route==='C00')disposeNpc=mountNpcGuide(root.querySelector('.title-actions'),{text:'보이지 않는 흔적을 함께 찾아보자. 증거를 살펴 감염이 퍼지는 경로를 생각하고, 생활 속에서 실천할 예방 방법을 골라 보자.',stop:()=>narration.stop(),reduced:()=>state.settings.reduced});
 if(protectedSave||saveWarning){const warning=document.createElement('div');warning.className='storage-warning';warning.setAttribute('role','status');warning.textContent=saveError()??'현재 탐구는 임시 상태예요. 창을 닫기 전에 연구 기록을 확인해 주세요.';root.prepend(warning);}
 if(state.route==='C01'){void mountMap();mountWindowRestoration(root.querySelector('.map-page')!,state,persist,()=>sound('success'));}
 root.querySelectorAll<HTMLImageElement>('img').forEach(img=>{img.addEventListener('error',()=>{img.classList.add('failed-image');img.alt='배경 그림을 불러오지 못했어요.';const scene=img.parentElement;if(scene&&!scene.querySelector('.image-retry')){const button=document.createElement('button');button.className='image-retry btn small';button.textContent='그림 다시 읽기';button.onclick=()=>{img.classList.remove('failed-image');img.src=img.src;button.remove();};scene.append(button);}}, {once:true});});
}
function mapHint(place:number){const {open,done}=mapStatus(state,view),status=root.querySelector('.map-status');if(!status)return;const p=PLACES[place];status.textContent=p&&!open[place]?`${p.name}은 앞선 미션을 마치면 열려요.`:p&&done[place]?`${p.name}: 이름표를 누르면 다시 실험해요.`:'';}
async function mountMap(){const currentEpoch=epoch,{open,next,done}=mapStatus(state,view),newly=[...pendingMapRestore],newEncounter=pendingMapEncounter,last=PLACES[state.evidence.length-1];
 const request=mapRequest=new AbortController(),{signal}=request;
 let loadingCode=true,timer:ReturnType<typeof setTimeout>|undefined;
 const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{reject(Error('map timeout'));request.abort();},10000);});
 researchAudio.preload(['swing','hit1','hit2','finish','exit','appear','bump','cardWhoosh','cardReveal','cardEpic','cardSlot','cardComplete','unlock'],true);
 const load=async()=>{const {createMap}=await import('./game/pixel-map');if(signal.aborted||epoch!==currentEpoch)return null;loadingCode=false;const parent=document.getElementById('pixel-map');if(!parent)return null;
 return createMap(parent,{signal,start:view.mapSpot??(last?NODES[last.node]:null),overview:view.mapOverview,mapHits:state.mapHits,encountersEnabled:!archive,encounterHold:()=>rewardCardDue()||researchAudio.ringing('cardComplete'),onStep:mapStep,onEncounterSave:patch=>{const won=wonRewardCards(state.mapHits,patch);state.mapHits={...state.mapHits,...patch};persist();won.forEach(awardCard);},onEncounterSound:(kind,hits)=>void researchAudio.play(kind==='hit'?(hits===2?'hit2':'hit1'):kind==='contact'?'bump':kind,kind==='hit'||kind==='finish'||kind==='exit'),newEncounter,reduced:state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches,open,next,done,newly,celebration:state.completed.includes('P10'),onSelect:n=>void startStage(n),onMove:p=>{view.mapSpot=p;},onStop:mapHint,onView:mode=>{view.mapOverview=mode==='overview';const button=root.querySelector('[data-action=map-view]');if(button){const label=mapViewLabel(mode);button.setAttribute('aria-label',label);button.setAttribute('title',label);}}});
 };
 try{const h=await Promise.race([load(),deadline]);if(!h)return null;
 if(epoch!==currentEpoch){h.destroy();return null;}pendingMapRestore=pendingMapRestore.filter(i=>!newly.includes(i));
 // 방금 마친 미션의 건물이 되살아나고 다음 장소가 열리는 순간 한 번(메모리의 대기 목록이라 다시 그리거나 새로고침해도 다시 나지 않는다).
 if(newly.length)void researchAudio.play('unlock');if(pendingMapEncounter===newEncounter)pendingMapEncounter=null;mapHandle=h;return h;
 }catch{
  if(epoch===currentEpoch){
   const parent=document.getElementById('pixel-map');
   if(parent){
    parent.innerHTML='<div class="map-fallback" role="status"><p>지도를 읽지 못했어요. 기록은 그대로예요.</p><button class="btn secondary" type="button">다시 열기</button></div>';
    parent.querySelector('button')!.onclick=()=>loadingCode?location.reload():render();
   }
  }
  return null;
 }finally{clearTimeout(timer);}
}
// 지도 발자국: 대화창·안내창·카드·파이널 창·창문 복구 패널이 떠 있는 동안에는 내지 않는다.
function mapStep(){if(root.inert||modalRoot.firstChild||document.querySelector('dialog[open], .rc-layer')||root.querySelector('.window-restoration[open]'))return;void researchAudio.step();}
// 악당의 세 번째 타격이 저장되면 퇴장 연출 뒤 성취 카드를 연다. 카드가 열려 있는 동안 #app이 inert라서
// 걷기·악당·전체 격퇴 파이널이 카드를 닫을 때까지 기다린다. 그 사이 지도를 떠났으면 칸만 채운다.
// 퇴장 대사가 나오는 동안에는 카드 소리가 나지 않으므로 대사가 끝난 뒤 카드를 연다. 대사가 끝나지 않아도 9초 뒤에는 연다.
function awardCard(index:number){
 const voiceLimit=performance.now()+9000;
 void winRewardCard(index,{delay:state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches?520:760,hits:()=>(archive??state).mapHits,
  state:()=>state.route!=='C01'||archive?'gone':document.hidden||modalRoot.firstChild||document.querySelector('dialog[open]')||(narration.isSpeaking()&&performance.now()<voiceLimit)?'wait':'open',
  origin:()=>{const spot=document.querySelector(`#pixel-map [data-encounter="${index}"]`)?.getClientRects()[0];return spot?{x:spot.left,y:spot.top-30}:undefined;}});
}
function cancelMapTravel(){travelRequest++;travellingStage=0;mapHandle?.cancel();const b=root.querySelector<HTMLButtonElement>('.map-next-cue');if(b){b.disabled=false;b.removeAttribute('aria-busy');}}
async function startStage(n:number){
 const stage=STAGES[n-1],unlocked=n===1||state.evidence.includes(`E${n-1}`);
 if(!stage||state.route!=='C01'||(!unlocked&&!view.teacher)||travellingStage===n)return;
 cancelMapTravel();travellingStage=n;const request=travelRequest,current=epoch,button=root.querySelector<HTMLButtonElement>('.map-next-cue');
 if(button){button.disabled=true;button.setAttribute('aria-busy','true');}
 try{
 const map=mapHandle;
 if(current!==epoch||request!==travelRequest||root.inert)return;
 if(map&&!await map.travel(n))return;
 if(current!==epoch||request!==travelRequest||root.inert)return;
 let notice='';if(view.teacher||!unlocked||state.completed.includes(stage.pages[1])){if(!archive)archive=structuredClone(state);state=fixtureFor(n,state.settings);notice=view.teacher||!unlocked?'예시 기록을 사용하는 교사용 시연이에요.':'본편 기록을 보존하며 다시 실험해요.';}
 navigate(stage.pages[0] as Route);if(notice)notify(notice);
 }finally{if(request===travelRequest)cancelMapTravel();}}
function exitReplay(){if(!archive)return;state=archive;archive=null;view.teacher=false;navigate('C01');}
function closeModal(){narration.stop();modalRoot.innerHTML='';root.inert=false;focusBefore?.focus();focusBefore=null;}
function modal(content:string,closeX=true){if(state.route==='C01')cancelMapTravel();narration.stop();stop();persist();paintPlaybackControls();if(!root.inert)focusBefore=document.activeElement as HTMLElement;root.inert=true;modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="조사 안내">${closeX?`<button class="icon-btn modal-close" data-modal="close" aria-label="닫기">${icon('close')}</button>`:''}${content}</section></div>`;modalRoot.querySelector<HTMLButtonElement>('button')?.focus();}
function confirmReset(){modal(`<h2>새 연구를 시작할까요?</h2><p>현재 기기의 본편 기록은 복구용 사본으로 보관한 뒤 새로 시작해요. 백업 공간이 부족하면 초기화하지 않아요.</p><div class="modal-actions"><button class="btn secondary" data-modal="close">취소</button><button class="btn danger" data-modal="confirm-reset">기록 지우기</button></div>`);modalRoot.querySelector<HTMLButtonElement>('.modal-actions [data-modal="close"]')?.focus();}
function teacher(fromSettings=false){modal(`<div class="eyebrow">TEACHER'S GUIDE</div><h2>관찰에서 실천으로 이어지는 과학</h2><p>5개 미션의 연구 기록을 모아 학교 대응안을 완성해요. 모형의 흔적은 실제 감염 여부나 감염 확률이 아니에요.</p><div class="guide-stages">${STAGES.map((s,i)=>`<div><b>0${i+1} ${s.name}</b><span>${['관찰하고 중요한 단서 고르기','관계를 설명하고 생활 영향 살피기','시간을 되감고 개입 시점 비교하기','다른 조건은 같게, 한 행동만 바꾸기','장소별 예방을 계획하고 생활에서 실천하기'][i]}</span></div>`).join('')}</div>${curriculumGuide()}<p>카드는 드래그하거나 선택 후 대상을 눌러 연결할 수 있어요. 입력과 기록은 자동 저장돼요. 같은 기기·같은 주소에서 이어 갈 수 있어요.</p><div class="modal-actions"><button class="btn primary" data-modal="unlock">전 미션 시연 열기</button><button class="btn secondary" data-modal="reset">새 연구 시작</button>${fromSettings?'<button class="btn secondary" data-modal="settings">설정으로 돌아가기</button>':''}</div><small>시연 기록은 학생 본편에 덮어쓰지 않아요. 실제 학교망·기기 동시 접속 검증은 별도로 필요해요.</small>`);}
function btnForReplay(){return `<button class="btn secondary" data-modal="exit-replay">${icon('undo',20)} 본편 복귀</button>`;}
// 배경 음악 크기·효과음 크기 막대(0~100%, 5% 단위). 스위치가 꺼져 있으면 막대도 쉰다.
const VOLUME_KEY={music:'musicVolume',sfx:'sfxVolume'} as const;
function volumeRow(key:'music'|'sfx'){const value=state.settings[VOLUME_KEY[key]];return `<label class="setting-row setting-volume"><span>${key==='music'?'배경 음악 크기':'효과음 크기'}</span><input type="range" data-setting-volume="${key}" min="0" max="100" step="5" value="${value}" ${state.settings[key]?'':'disabled'}><output>${value}%</output></label>`;}
function settings(){modal(`<div data-science-settings><h2>설정</h2><div class="science-settings-body"><div class="science-settings-audio">${([['music','배경 음악'],['sfx','효과음'],['voice','목소리'],['reduced','동작 줄이기'],['large','큰 글자']] as const).map(([key,label])=>`<label class="setting-row"><span>${label}</span><span class="switch"><input type="checkbox" role="switch" data-setting="${key}" ${state.settings[key]?'checked':''}><b aria-hidden="true"></b></span></label>${key==='music'||key==='sfx'?volumeRow(key):''}`).join('')}</div>
 <div class="science-settings-actions">${archive&&state.route==='C01'?btnForReplay():''}<button class="btn secondary" data-modal="records">연구 기록 보기</button></div>
 <details><summary>앱 정보 · 배움과 보상</summary><p><b>탐구 목적</b> 학교에서 발견한 보이지 않는 흔적을 관찰하고, 근거를 비교해 대응 방법을 골라요.</p><p><b>미션 보상</b> 다섯 연구 기록을 모아 학교 대응안을 완성해요.</p><p><b>남는 배움</b> 예상과 달라진 결과를 기록하고, 장소에 맞는 실천을 설명할 수 있어요.</p><p>같은 기기와 브라우저에서 이어 할 수 있어요. 이름 같은 개인정보는 저장하지 않아요.</p><p class="film-replay"><button type="button" class="btn secondary" data-modal="film" data-id="intro">인트로 영상 다시 보기</button>${state.completed.includes('P10')?'<button type="button" class="btn secondary" data-modal="film" data-id="outro">파이널 영상 다시 보기</button>':''}</p><p>${CREDIT}</p></details>
 <details><summary>학생용 가이드</summary><p>신호를 찾고 단서를 비교해 관찰 기록을 남겨요. 카드로 한 번에 한 조건을 바꿔 보고 결과를 비교해요.</p><p>지도에서 방해하는 악당에게 가까이 가면 원형 버튼이나 스페이스바로 공격해요.</p><p>효과음과 목소리는 따로 켜고 끌 수 있어요. 목소리를 꺼도 화면의 안내와 말풍선, 기록을 읽을 수 있어요.</p></details>
 <details><summary>교사용 가이드</summary><p>화면에 나타나는 모형의 흔적은 실제 감염 여부나 감염 확률이 아니에요. 연구 기록으로 학생이 설명한 근거를 확인해 주세요.</p><button class="btn secondary" data-modal="teacher">성취기준과 교사용 도구 보기</button></details>
 <details><summary>이미지·소리·저작권 고지</summary><p>이 프로그램의 이미지는 생성형 이미지로 만든 학습용 장면이에요. 실제 관찰 사진이나 실측 자료가 아니에요.</p></details>
 </div><footer class="science-settings-footer"><button class="btn secondary" data-modal="reset">탐험 기록 초기화</button><button class="btn primary" data-modal="close">닫기</button></footer></div>`,false);
 // 낮은 화면에서는 첫 버튼에 초점이 가면서 목록이 밀려 올라가 맨 위 스위치가 잘린다. 처음에는 맨 위부터 보인다.
 modalRoot.querySelector('.science-settings-body')?.scrollTo(0,0);}

function sealed():boolean{const route=state.route;if(route==='P10')return false;const i=PAGES.findIndex(p=>p.id===route);return i>=0&&state.evidence.includes(`E${Math.floor(i/2)+1}`);}
root.addEventListener('click',e=>{if(Date.now()<suppressClick)return;const target=(e.target as HTMLElement).closest<HTMLElement>('[data-action]');if(!target||target.hasAttribute('disabled'))return;const a=target.dataset.action!,id=target.dataset.id??'';sound(['simulate','observe','scan'].includes(a)?'scan':'tap');
 if(['home','map','records','settings','sound','teacher','start','new-game','next','exit-replay','stage','print','certificate','film','cert-png'].includes(a)){
 switch(a){case 'home':navigate('C00');return;case 'map':navigate('C01');return;case 'records':modal(records(state));return;case 'settings':settings();return;case 'teacher':teacher();return;case 'new-game':confirmReset();return;
 case 'sound':{const on=!soundOn(state);state.settings.music=on;state.settings.sfx=on;state.settings.voice=on;syncSound();persist();render();return;}
 case 'start':{const target=state.found.length?state.lastRoute:'C01';if(!state.found.length&&!state.completed.length&&playFilm('intro',()=>navigate(target)))return;navigate(target);return;}
 case 'exit-replay':exitReplay();return;
 case 'stage':void startStage(Number(id));return;
 case 'film':playFilm(id==='outro'?'outro':'intro');return;
 case 'next':if(state.completed.includes(state.route)){const p=PAGES.find(p=>p.id===state.route)!;navigate(p.next as Route);}return;
 case 'print':window.print();return;
 case 'cert-png':{const paper=root.querySelector<HTMLElement>('[data-cert-paper]');if(paper)void saveCertificatePng(paper,'학교-과학-조사-인증서.png').then(()=>notify('인증서를 PNG로 저장했어요.','success')).catch(()=>notify('PNG를 만들지 못했어요. 「인증서 인쇄 / PDF 저장」을 써 주세요.'));return;}
 case 'certificate':update(s=>s.final.phase='certificate');sound('success');return;}
 }
 if(a==='auto-play'){play(target.dataset.kind as PlaybackKind);return;}
 if(a==='questions'){questions();return;}
 if(a==='model-info'){modal(learningGuide(state,view));return;}
 if(a==='focus'){view.focus=id;render();return;}
 if(a==='focus-index'){view.index=Math.max(0,Number(id)||0);render();return;}
 if(a==='site-preview'){view.site=id;render();return;}
 if(sealed()&&!['site','lab','timeline-play','comparison-play','re-experiment','select-clue','select-effect'].includes(a)){notify('이 미션의 기록이 완성됐어요. 지도에서 다시 실험할 수 있어요.');return;}
 switch(a){
 case 'discover':{// 돋보기로 찾은 그 손짓의 클릭이 바로 현장 이동으로 이어지지 않게 한다(그 그림만, 잠깐).
 if(scanGrace.id===id&&Date.now()<scanGrace.until)return;if(state.found.includes(id)&&state.completed.includes('P01')){view.site=id;navigate('P02');return;}if(state.found.includes(id))return;const me=e as MouseEvent,vis=target.querySelector<HTMLElement>('.obs-site-visual');if(me.detail!==0&&vis&&!scanAt(vis,id,me.clientX,me.clientY)){notify('보라 빛이 새어 나오는 곳으로 돋보기를 옮겨 봐요.');return;}discover(id);return;}
 case 'site':view.site=id;view.index=0;view.replacement='';view.focus='clues';render();return;
 case 'clue':if(state.clues.includes(id)){update(s=>s.clues=s.clues.filter(x=>x!==id));return;}if(state.clues.length>=5){view.replacement=id;view.focus='tray';notify('바꿀 기존 단서를 골라주세요.');render();return;}update(s=>s.clues.push(id));cluesHint();return;
 case 'remove-clue':update(s=>{s.clues=s.clues.filter(x=>x!==id);if(view.replacement){s.clues.push(view.replacement);view.replacement='';}});cluesHint();return;
 case 'select-clue':view.clue=id;view.focus='targets';render();return;
 case 'link-target':if(!view.clue){notify('먼저 연결할 단서를 골라주세요.');return;}linkRelation(view.clue,id);return;
 case 'select-effect':view.effect=id;view.focus='domains';render();return;
 case 'impact-domain':linkImpact(id);return;
 case 'source':update(s=>s.timeline.source=id);if(id!=='book')notify('시간을 처음으로 되감아 가장 먼저 빛난 물체를 살펴보세요.');return;
 case 'intervene':{const was=state.completed.includes('P05');update(s=>tryIntervention(s,Number(id)));washFeedback(was);}return;
 case 'timeline-play':play('timeline');return;
 case 'comparison-play':play('comparison');return;
 case 'lab':view.lab=id;view.labPreview=null;view.demoStep=0;state.labs.active=id;persist();render();return;
 case 'contact-record':update(s=>{if(!s.labs.done.includes('contact'))s.labs.done.push('contact');});return;
 case 'lab-set':setLab(id,Number(target.dataset.value));return;
 case 'water':setLab('water',Number(id));return;
 case 'synthesis':if(id==='washHands'){notify('손 씻기도 중요해요. 지금은 기침과 닫힌 공간을 각각 바꾸는 행동을 생각해 보세요.');return;}update(s=>{if(s.labs.synthesis.includes(id))s.labs.synthesis=s.labs.synthesis.filter(x=>x!==id);else s.labs.synthesis.push(id);});return;
 case 'experiment-action':update(s=>{s.experiment.action=id;s.experiment.prediction='';s.experiment.tick=0;s.experiment.pinned='';s.experiment.explanation='';});return;
 case 'predict':if(!state.experiment.action)return;update(s=>{s.experiment.prediction=id;s.experiment.tick=0;},false);navigate('P08');play('comparison');return;
 case 'difference':{const action=DATA.p07.actionPool.find(x=>x.id===state.experiment.action)!;update(s=>s.experiment.pinned=action.differenceEvent);return;}
 case 're-experiment':if(state.evidence.includes('E4')){if(!archive)archive=structuredClone(state);state=fixtureFor(4,state.settings);}navigate('P07');return;
 case 'explain':{const a=DATA.p07.actionPool.find(x=>x.id===state.experiment.action);if(!state.experiment.pinned)return;if(a&&id!==a.metric){notify('이 행동과 직접 관련된 변화인지 두 장면을 다시 살펴봐요.');return;}update(s=>s.experiment.explanation=id);return;}
 case 'question':if(state.strategy.asked.includes(id))return;if(state.strategy.asked.length>=3){notify('질문권을 모두 썼어요. 연구 노트와 이미 들은 답을 살펴봐요.');return;}update(s=>s.strategy.asked.push(id));return;
 case 'strategy-action':view.action=id;render();return;
 case 'place':if(!view.action){notify('배치할 행동을 먼저 골라주세요.');return;}place(view.action,id);return;
 case 'remove-placement':update(s=>{s.strategy.placements=s.strategy.placements.filter(p=>placementKey(p)!==id);s.strategy.simulated=false;});return;
 case 'simulate':update(s=>s.strategy.simulated=true);if(planResult(state.strategy.placements).success)notify('대응안 완성! 에너지는 계획 놀이의 규칙이에요. 생활에서는 기침 예절과 개인 물품 사용도 함께 지켜요.','success');return;
 case 'begin-apply':update(s=>s.final.phase='apply');return;
 case 'apply':applyWithReveal(id);return;
 case 'hand-zone':if(Date.now()<applyLock||state.final.hands.includes(id))return;if((e as MouseEvent).detail===0||addRub(target,id,34))finishZone(id,target.dataset.key??'');return;
 }
});
// 단서와 생활 상황은 근거가 맞을 때만 잇는다. 틀린 연결에 완료 표시가 붙어 오개념이 남지 않게 한다.
function linkRelation(clue:string,target:string){if(!DATA.p03.acceptedBranches.some(b=>b.requiresAll.some(([from,to])=>from===clue&&to===target))){view.clue=clue;notify('이 단서와 더 직접 이어지는 생활 상황을 다시 골라 봐요.');render();return;}update(s=>{s.relations[clue]=target;view.clue='';view.focus='';});}
// 손 씻는 때를 한 번만 넣으면 비교가 되지 않는다. 다음에 무엇을 해 볼지 짧게 알려 준다.
function washFeedback(wasDone=true){if(state.route!=='P05')return;if(state.completed.includes('P05')){if(!wasDone)notify('일찍 씻을수록 다른 곳으로 옮겨 가는 흔적이 줄었어요!','success');return;}const t=state.timeline;if(t.source!=='book')return;if(t.tried.length===1)notify(t.tried[0]===EARLY_WASH?'일찍 씻었어요! 늦게 씻으면 어떨까요? 다른 때도 넣어 봐요.':'흔적이 남았어요. 더 일찍 씻으면 어떨까요?');else if(!timingCompared(state))notify('아직 남은 흔적이 있어요. 더 일찍 씻을 때를 찾아봐요.');}
// P01 돋보기: 그림 위에서 움직이면 따라오고, 흔적 자리에 닿으면 신호를 찾는다. 키보드는 바로 찾는다.
function scanAt(vis:HTMLElement,id:string,x:number,y:number){const r=vis.getBoundingClientRect(),px=(x-r.left)/r.width*100,py=(y-r.top)/r.height*100;const lens=vis.querySelector<HTMLElement>('.scan-lens');if(lens){lens.style.left=`${Math.max(8,Math.min(92,px))}%`;lens.style.top=`${Math.max(10,Math.min(90,py))}%`;}const [hx,hy]=SIGNAL_SPOTS[id]??[50,50];return Math.hypot(px-hx,(py-hy)*r.height/r.width)<16;}
function discover(id:string){if(state.found.includes(id))return;sound('scan');update(s=>{if(!s.found.includes(id))s.found.push(id);});notify('신호 위치를 기록했어요.');}
let scanPressed=false,scanGrace={id:'',until:0};
root.addEventListener('pointerdown',e=>{if((e.target as HTMLElement).closest('.obs-site-visual'))scanPressed=true;});
window.addEventListener('pointerup',()=>{scanPressed=false;});
root.addEventListener('pointermove',e=>{if(state.route!=='P01'||sealed())return;const vis=(e.target as HTMLElement).closest<HTMLElement>('.obs-site-visual[data-scan]');if(!vis||(e.pointerType!=='mouse'&&!scanPressed))return;const id=vis.dataset.scan!;if(state.found.includes(id))return;if(scanAt(vis,id,e.clientX,e.clientY)){scanPressed=false;scanGrace={id,until:Date.now()+700};discover(id);}});
function cluesHint(){if(state.route==='P02'&&state.clues.length===5&&!state.completed.includes('P02'))notify(gateHint(state));}
function linkImpact(id:string){if(!view.effect)view.effect=DATA.p04.links.find(x=>!Object.values(state.impacts).includes(x.id))?.id??'';if(!view.effect){notify('먼저 영향 카드를 골라주세요.');return;}if(DATA.p04.links.find(x=>x.id===view.effect)?.domain!==id){notify('이 영향은 누구의 생활과 더 직접 이어질까요?');return;}update(s=>{s.impacts[id]=view.effect;view.effect='';view.focus='';});}
function setLab(id:string,value:number){view.labPreview=null;update(s=>{s.labs.values[id]=value;if(value===1&&!s.labs.done.includes(id))s.labs.done.push(id);});}
function place(actionId:string,site:string){let result='';update(s=>{result=addPlacement(s,{actionId,site});if(result==='ok')view.action='';});if(result==='budget')notify('에너지가 부족해요. 기존 행동을 빼거나 바꿔보세요.');if(result==='wrong-site')notify('이 행동과 관련된 장소에 놓아주세요.');if(result==='duplicate')notify('이미 이 장소에 배치한 행동이에요.');}
// 적용 직후 같은 자리에 다음 계획 버튼이 그려지므로, 연속 탭이 그 버튼까지 누르지 않게 잠깐 막는다.
let applyLock=0;
function apply(key:string){if(Date.now()<applyLock)return;let applied=false;const pages=state.completed.length;update(s=>applied=applyPlacement(s,key));if(applied){applyLock=Date.now()+700;if(state.completed.length===pages)sound('success');notify('계획을 직접 실천했어요.','success');}}
// 실천 결과(열린 창문·담긴 접시·씻은 손)를 잠깐 보여 준 뒤 다음 계획으로 넘어간다.
function applyWithReveal(key:string,reveal=true){if(Date.now()<applyLock||state.route!=='P10')return;const p=state.strategy.placements.find(x=>placementKey(x)===key);if(!p||state.final.applied.includes(key))return;applyLock=Date.now()+1400;if(reveal){view.demoStep=1;render();}else render();sound('success');const at=epoch;setTimeout(()=>{if(epoch!==at&&state.route!=='P10')return;applyLock=0;view.demoStep=0;apply(key);applyLock=Date.now()+250;},reveal?1200:900);}
// 손 씻기: 문지르면(끌기) 한 번에, 톡 누르면 세 번에 한 부분이 깨끗해진다. 키보드는 바로 완료.
const rub:Record<string,number>={};let rubbing:{id:string;key:string;el:HTMLElement;x:number;y:number;pointer:number}|null=null;
function addRub(el:HTMLElement,id:string,amount:number){rub[id]=Math.min(100,(rub[id]??0)+amount);el.style.setProperty('--rub',`${rub[id]}%`);el.classList.add('rubbing');return rub[id]>=100;}
function finishZone(id:string,key:string){delete rub[id];sound('scan');update(s=>{if(!s.final.hands.includes(id))s.final.hands.push(id);},false);if(state.final.hands.length===3)applyWithReveal(key,false);else render();}
root.addEventListener('pointerdown',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('.hand-zone');if(!el||state.route!=='P10'||state.final.hands.includes(el.dataset.id!))return;rubbing={id:el.dataset.id!,key:el.dataset.key??'',el,x:e.clientX,y:e.clientY,pointer:e.pointerId};});
window.addEventListener('pointermove',e=>{const r=rubbing;if(!r||e.pointerId!==r.pointer||!r.el.isConnected)return;const d=Math.hypot(e.clientX-r.x,e.clientY-r.y);r.x=e.clientX;r.y=e.clientY;if(d<2)return;if(addRub(r.el,r.id,d/3.2)){rubbing=null;suppressClick=Date.now()+450;finishZone(r.id,r.key);}});
window.addEventListener('pointerup',()=>{rubbing=null;});
function paintInstruction(){const el=root.querySelector('.next-instruction');const text=nextInstruction(state,view);if(el&&el.textContent!==text)el.textContent=text;}
function paintTimeline(){paintInstruction();const trace=contactAt(state.timeline.tick,state.timeline.intervention);const baseline=contactAt(state.timeline.tick);const result=root.querySelector('#prevention-result span');if(result&&state.timeline.intervention!==null)result.textContent=`${baseline.size}곳 → ${trace.size}곳에 모형 흔적. ${[...baseline].filter(n=>!trace.has(n)).length}곳의 연결이 달라졌어요.`;root.querySelectorAll<HTMLElement>('[data-node]').forEach(el=>{el.classList.toggle('has-trace',trace.has(el.dataset.node!));const protectedNode=baseline.has(el.dataset.node!)&&!trace.has(el.dataset.node!);el.classList.toggle('trace-protected',protectedNode);const label=el.querySelector('.prevented-trace');if(label)label.textContent=protectedNode?'연결 차단':'';});const text=root.querySelector('#time-label');if(text)text.textContent=`사건 ${state.timeline.tick.toFixed(1)} / 5`;const range=root.querySelector<HTMLInputElement>('[data-range="timeline"]');if(range)range.value=String(state.timeline.tick);}
function paintComparison(){paintInstruction();const live=root.querySelector('.comparison-live'),tasks=root.querySelector('.comparison-tasks'),text=root.querySelector('#comparison-time'),range=root.querySelector<HTMLInputElement>('[data-range="comparison"]');if(live)live.innerHTML=comparisonBoard(state);const a=DATA.p07.actionPool.find(x=>x.id===state.experiment.action);const after=String(!!a&&state.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time);if(tasks instanceof HTMLElement&&tasks.dataset.after!==after){tasks.dataset.after=after;tasks.innerHTML=comparisonTasks(state);}if(text)text.textContent=`${state.experiment.tick.toFixed(1)} / 5`;if(range&&document.activeElement!==range)range.value=String(state.experiment.tick);}
function showPlay(action:string,label:string){const b=root.querySelector(`[data-action="${action}"]`);if(b){b.innerHTML=icon('play',20);b.setAttribute('aria-label',label);}}
function paintPlaybackControls(){
 root.querySelectorAll<HTMLElement>('.playback-toggle').forEach(b=>{const active=view.playing&&view.autoMode===b.dataset.kind;b.innerHTML=`${icon(active?'pause':'play',20)}<span>${active?'직접 해보기':'자동재생'}</span>`;b.setAttribute('aria-pressed',String(active));b.classList.toggle('selected',active);});
 root.querySelectorAll('.playback-state').forEach(el=>el.textContent=view.playing?'과정을 함께 관찰해요':'직접 조작할 수도 있어요');
}
function performDemo(step:DemoStep){
 const previous=new Set(state.completed);
 if(step.type==='scan'){view.site=step.site;view.demoStep++;if(step.record&&!sealed()&&!state.found.includes(step.site))state.found.push(step.site);}
 if(step.type==='contact')view.demoStep=step.node;
 if(step.type==='lab'){view.labPreview=step.value;if(!sealed()){state.labs.values[step.lab]=step.value;if(step.value===1&&!state.labs.done.includes(step.lab))state.labs.done.push(step.lab);}}
 if(step.type==='apply'||step.type==='hand'){
  const current=state.strategy.placements.find(p=>!state.final.applied.includes(placementKey(p)));
  if(state.final.phase!=='apply'||!current||placementKey(current)!==step.key)return;
  if(step.type==='hand'){if(!state.final.hands.includes(step.zone))state.final.hands.push(step.zone);if(state.final.hands.length===3)applyPlacement(state,step.key);}
  else applyPlacement(state,step.key);
 }
 derive(state);queueMapEncounter(previous);persist();
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
root.addEventListener('change',e=>{const el=e.target as HTMLInputElement|HTMLSelectElement;if(el.dataset.select==='observation-site'){view.site=el.value;view.index=0;view.replacement='';view.focus='clues';render();return;}if(el.dataset.select==='playback-speed'){view.speed=playbackSpeed(Number(el.value));if(timer){clearTimeout(timer);timer=null;schedulePlayback();}return;}if(el.dataset.select==='intervention'){if(sealed())return;if(el.value!==''){{const was=state.completed.includes('P05');update(s=>tryIntervention(s,Number(el.value)));washFeedback(was);}}return;}if(el.dataset.range==='timeline'){persist();render();}if(el.dataset.range==='comparison'){persist();render();}if((el.dataset.range==='window'||el.dataset.select==='explanation')&&sealed()){notify('이 미션의 기록이 완성됐어요. 지도에서 다시 실험할 수 있어요.');render();return;}if(el.dataset.range==='window'){sound();setLab('air',Number(el.value));}if(el.dataset.select==='explanation'){const a=DATA.p07.actionPool.find(x=>x.id===state.experiment.action);if(a&&el.value!==a.metric){notify('이 행동과 직접 관련된 변화인지 두 장면을 다시 살펴봐요.');}update(s=>s.experiment.explanation=el.value);}});
modalRoot.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-modal]');if(!b||b.hasAttribute('disabled'))return;sound();switch(b.dataset.modal){case 'exit-replay':closeModal();exitReplay();return;case 'teacher':teacher(true);return;case 'settings':settings();modalRoot.querySelector<HTMLButtonElement>('[data-modal="teacher"]')?.focus();return;case 'records':modal(records(state));return;case 'question':{const id=b.dataset.id!;if(!state.strategy.asked.includes(id)&&state.strategy.asked.length<3&&!sealed()){state.strategy.asked.push(id);derive(state);persist();}questions();const answer=DATA.p09.questions.find(q=>q.id===id)?.answer;if(answer)narration.announce(answer);return;}case 'close':closeModal();return;case 'film':closeModal();playFilm(b.dataset.id==='outro'?'outro':'intro');return;case 'unlock':if(!archive)archive=structuredClone(state);state=structuredClone(state);view.teacher=true;closeModal();navigate('C01');notify('미션을 고르면 본편을 보존하는 예시 시연으로 열려요.');return;case 'reset':confirmReset();return;case 'confirm-reset':{const next=fresh();next.settings={...state.settings};if(!resetSave(next)){notify(saveError()??'새 연구를 저장하지 못해 기존 기록을 유지했어요.');return;}state=next;archive=null;protectedSave=false;saveWarning=false;view=viewFresh();closeModal();navigate('C01');return;}}});
modalRoot.addEventListener('change',e=>{const input=e.target as HTMLInputElement;if('settingVolume' in input.dataset){persist();return;}const key=input.dataset.setting as 'music'|'sfx'|'voice'|'reduced'|'large'|undefined;if(key){state.settings[key]=input.checked;for(const volume of modalRoot.querySelectorAll<HTMLInputElement>('[data-setting-volume]'))volume.disabled=!state.settings[volume.dataset.settingVolume==='sfx'?'sfx':'music'];syncSound();persist();document.body.classList.toggle('large-text',state.settings.large);document.body.classList.toggle('reduced',state.settings.reduced||matchMedia('(prefers-reduced-motion: reduce)').matches);}});
// 배경 음악·효과음 크기: 막대를 움직이는 동안 바로 반영하고, 손을 떼면(change) 저장한다. 효과음 크기는 다음 효과음부터 그 비율로 난다.
modalRoot.addEventListener('input',e=>{const input=e.target as HTMLInputElement;if(!('settingVolume' in input.dataset))return;const key=VOLUME_KEY[input.dataset.settingVolume==='sfx'?'sfx':'music'],value=Math.max(0,Math.min(100,Number(input.value)||0));state.settings[key]=value;const output=input.parentElement?.querySelector('output');if(output)output.textContent=`${value}%`;if(key==='musicVolume')music.sync();else researchAudio.sync();});
document.addEventListener('keydown',e=>{if(!modalRoot.firstChild)return;if(e.key==='Escape'){closeModal();return;}if(e.key==='Tab'){const focusable=Array.from(modalRoot.querySelectorAll<HTMLElement>('button,input,select,[tabindex="0"]')).filter(x=>!x.hasAttribute('disabled'));const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
let dragged:{kind:string;id:string}|null=null;
root.addEventListener('dragstart',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drag]');if(!el||sealed()||touchDrag){e.preventDefault();return;}dragged={kind:el.dataset.drag!,id:el.dataset.id!};e.dataTransfer?.setData('text/plain',el.dataset.id!);});
root.addEventListener('dragover',e=>{const el=(e.target as HTMLElement).closest<HTMLElement>('[data-drop]');if(el&&dragged?.kind===el.dataset.drop){e.preventDefault();el.classList.add('drop-hover');}});
root.addEventListener('dragleave',e=>(e.target as HTMLElement).closest('[data-drop]')?.classList.remove('drop-hover'));
function dropOn(d:{kind:string;id:string},el:HTMLElement){sound();if(d.kind==='wash-point'){const tick=Number(el.dataset.id);if(DATA.p05.intervention.allowedTicks.includes(tick)){{const was=state.completed.includes('P05');update(s=>tryIntervention(s,tick));washFeedback(was);}}return;}if(d.kind==='relation')linkRelation(d.id,el.dataset.id!);if(d.kind==='impact'){view.effect=d.id;linkImpact(el.dataset.id!);}if(d.kind==='strategy')place(d.id,el.dataset.id!);if(d.kind==='serving')setLab('saliva',1);if(d.kind==='sleeve')setLab('droplet',1);if(d.kind==='final-serve')applyWithReveal(d.id);}
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
root.addEventListener('pointerup',e=>{if(gesture&&gesture.id===e.pointerId&&gesture.epoch===epoch){const g=gesture;gesture=null;if(e.clientX-g.x>40){if(g.kind==='final-window')applyWithReveal(g.key);else{sound();setLab('air',1);}}}});
root.addEventListener('pointercancel',()=>gesture=null);
function viewport(){document.documentElement.style.setProperty('--app-height',`${visualViewport?.height??innerHeight}px`);gesture=null;}
window.addEventListener('resize',viewport);visualViewport?.addEventListener('resize',viewport);document.addEventListener('visibilitychange',()=>{if(document.hidden){const was=!!timer;stop();persist();if(was)render();}});
if(import.meta.env.PROD&&'serviceWorker' in navigator)addEventListener('load',()=>void navigator.serviceWorker.register('./sw.js').catch(()=>{/* 오프라인 캐시 없이도 앱은 동작한다. */}));
addEventListener('popstate',e=>{if(historyQuiet){historyQuiet--;return;}document.querySelector<HTMLDialogElement>('.story-film-dialog')?.close();const it=Math.max(0,Math.min(2,Number((e.state as {it?:number}|null)?.it??0)));historyDepth=it;
 if(modalRoot.innerHTML)closeModal();if(depthOf(state.route)===it)return;
 const target:Route=it===0?'C00':it===1?'C01':state.lastRoute;if(canEnter(state,target))navigate(target,true);
 if(depthOf(state.route)!==historyDepth){historyDepth=depthOf(state.route);history.replaceState({it:historyDepth},'');}});
// 저장된 활동·지도로 바로 열리면 history 칸이 하나뿐이다. 첫 조작 때 아래 단계 칸(시작·지도)을 깔아 뒤로 가기가 앱 안에서 멈추게 한다
// (조작 없이 만든 칸은 브라우저가 뒤로 가기에서 건너뛸 수 있다).
viewport();derive(state);historyDepth=depthOf(state.route);history.replaceState({it:historyDepth},'');
if(historyDepth>0){const lay=()=>{removeEventListener('pointerdown',lay,true);removeEventListener('keydown',lay,true);if(historyQuiet||(history.state as {it?:number}|null)?.it!==historyDepth)return;const top=historyDepth;history.replaceState({it:0},'');for(let d=1;d<=top;d++)history.pushState({it:d},'');};addEventListener('pointerdown',lay,true);addEventListener('keydown',lay,true);}
render();if(loaded.error)setTimeout(()=>notify(`기존 기록을 보존했어요. ${loaded.error} 새 연구는 교사용 안내에서 시작할 수 있어요.`),400);
