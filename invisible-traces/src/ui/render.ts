import {DATA,STAGES,PAGES,LABS,SITES,CLUE_NAMES,asset} from '../data/game';
import {branches,type State} from '../simulation/model';
import {icon} from './icons';
import {PLACES,type Point} from '../game/school-map';
export interface View {site:string;clue:string;effect:string;lab:string;action:string;mapSpot:Point|null;mapOverview:boolean;teacher:boolean;playing:boolean;replacement:string;focus:string;index:number;speed:number;autoMode:string;demoStep:number;labPreview:number|null;}
export const viewFresh=():View=>({site:'classroom',clue:'',effect:'',lab:'contact',action:'',mapSpot:null,mapOverview:false,teacher:false,playing:false,replacement:'',focus:'',index:0,speed:1,autoMode:'',demoStep:0,labPreview:null});
import {btn,chip,image,actionName} from './render-parts';
export {btn} from './render-parts';
import {observationPages} from './stages-observation';
import {tracingPages,synthesisReady} from './stages-tracing';
import {strategyPages} from './stages-strategy';
export {comparisonBoard,comparisonTasks} from './stages-strategy';
export function header(s:State,sandbox:boolean){
 const page=PAGES.find(p=>p.id===s.route);
 const tools=`${sandbox?btn(`${icon('undo',20)}<span>본편 복귀</span>`,'exit-replay','small','aria-label="본편 복귀"'):''}<button class="icon-btn" data-action="records" aria-label="연구 기록">${icon('file')}</button><button class="icon-btn" data-action="sound" aria-label="${s.settings.sound?'소리 끄기':'소리 켜기'}" aria-pressed="${s.settings.sound}">${icon(s.settings.sound?'sound':'mute')}</button><button class="icon-btn" data-action="settings" aria-label="설정">${icon('settings')}</button>`;
 if(page)return `<header class="topbar activity-topbar"><button class="icon-btn" data-action="map" aria-label="조사 지도로 돌아가기">${icon('map',22)}</button><div class="activity-heading"><span class="activity-mission">미션 ${Number(page.stage.slice(1))} / 5</span><h1>${page.name}</h1></div><nav class="tools" aria-label="공통 도구">${tools}</nav></header>`;
 return `<header class="topbar"><button class="brand" data-action="home" aria-label="메인으로"><span class="brand-mark">${icon('search',26)}</span><span>보이지 않는 흔적<small>학교 과학 조사</small></span></button><div class="header-center">${sandbox?chip('flask','다시 실험 · 본편 기록 보존','purple'):chip('file',`연구 기록 <b>${s.evidence.length}</b> / 5`)}</div><nav class="tools" aria-label="공통 도구">${tools}</nav></header>`;
}
// 그림 속 빛나는 자리(%)에 맞춰 신호가 깜빡인다.
const TITLE_SIGNALS=[['purple',26.2,43.6],['blue',50.7,52.8],['amber',78,51.6],['orange',82.6,75.5]] as const;
export function home(s:State){const active=s.found.length>0||s.clues.length>0;return `<main class="title-screen"><div class="title-world">${image('school','title-school')}${TITLE_SIGNALS.map(([color,x,y],i)=>`<i class="title-signal ${color}" style="left:${x}%;top:${y}%;animation-delay:${i*.7}s"></i>`).join('')}</div>${image('title-hero','title-person title-hero')}${image('title-mate','title-person title-mate')}<div class="title-center"><h1 class="title-logo">${image('title-logo','','보이지 않는 흔적')}</h1><p class="title-tagline">우리 학교에 남은 흔적을 찾아 줘!</p></div><div class="title-bottom"><div class="title-actions">${active?`${btn(`이어하기 ${icon('arrow',22)}`,'start','primary')}${btn('새 연구 시작','new-game','secondary')}`:btn(`조사 시작하기 ${icon('arrow',22)}`,'start','primary')}</div><div class="title-foot">${btn(`${icon('info',19)} 교사용 안내`,'teacher','small')}<span>흔적은 감염 과정을 생각해 보는 학습 모형이에요.</span></div></div></main>`;}
// 지도 위 다섯 장소의 상태. 입장 가능 여부는 캔버스와 이름표가 같은 값을 쓴다.
export function mapStatus(s:State,v:View){const open=STAGES.map((_,i)=>i===0||s.evidence.includes(`E${i}`)||v.teacher);const done=STAGES.map(t=>s.completed.includes(t.pages[1]));return {open,done,next:STAGES.findIndex((_,i)=>open[i]&&!done[i])};}
export const mapViewLabel=(mode:string)=>mode==='follow'?'지도 한눈에 보기':'조사팀 따라 보기';
export function map(s:State,v:View){const {open,done,next}=mapStatus(s,v);const nextPlace=PLACES[next];
 const label=(place:(typeof PLACES)[number],i:number)=>{const state=done[i]?'done':i===next?'next':open[i]?'open':'locked';return `<button class="map-place ${state}" data-action="stage" data-id="${i+1}" ${open[i]?'':'disabled'} aria-label="미션 ${i+1} ${place.name}, ${STAGES[i].name}, ${done[i]?'기록 완료, 다시 실험':open[i]?'조사 가능':'잠김'}"><span class="map-place-mark">${done[i]?icon('check',19):open[i]?i+1:icon('lock',17)}</span><span><b>${place.name}</b><small>${done[i]?'기록 완료':i===next?'지금 조사해요':open[i]?'조사 가능':'잠겨 있어요'}</small></span></button>`;};
 const pip=(_:unknown,i:number)=>`<button class="map-pip ${done[i]?'done':i===next?'next':''}" data-action="stage" data-id="${i+1}" ${open[i]?'':'disabled'} aria-label="미션 ${i+1} ${PLACES[i].to} 가기">${done[i]?icon('check',18):i+1}</button>`;
 const pad=(dir:string,name:string,text:string)=>`<button class="map-dir ${dir}" data-map-direction="${dir}" aria-label="${text}">${icon(name,24)}</button>`;
 return `<main class="map-page"><div id="pixel-map" role="application" aria-label="학교를 비스듬히 내려다보는 픽셀 지도. 방향키로 걷고 Enter로 들어가요." style="background-image:url(${asset('school')})"></div><div class="map-places">${PLACES.map(label).join('')}</div><p class="map-status" role="status">${next>=0?`길을 눌러 걷거나, 끌어서 학교를 둘러봐요.`:'다섯 곳을 모두 조사했어요.'}</p><section class="map-controls" aria-label="지도 조작"><div class="map-pad">${pad('up','arrow','위로 걷기')}${pad('left','arrow','왼쪽으로 걷기')}${pad('down','arrow','아래로 걷기')}${pad('right','arrow','오른쪽으로 걷기')}</div><div class="map-view-tools">${btn(`${icon('map',19)} <span data-map-view-label>${mapViewLabel(v.mapOverview?'overview':'follow')}</span>`,'map-view','small')}${btn(`${icon('info',19)} 교사용 안내`,'teacher','small')}</div></section><aside class="map-next" aria-label="다음 조사">${next>=0?`<small>MISSION 0${next+1} · ${nextPlace.name}</small><strong>${STAGES[next].name}</strong>${btn(`${nextPlace.to} 가기 ${icon('arrow',20)}`,'stage','primary',`data-id="${next+1}"`)}`:`<small>조사 완료</small><strong>다섯 기록이 모두 모였어요.</strong>${btn(`연구 기록 보기 ${icon('arrow',20)}`,'records','primary')}`}<div class="map-pips">${PLACES.map(pip).join('')}</div></aside></main>`;}
// 다음 버튼이 잠긴 이유를 "무엇을 몇 개 더"로 알려준다. 판정은 derive()와 같은 조건을 따른다.
export function gateHint(s:State):string {
 switch(s.route){
 case 'P01':return `신호를 ${DATA.p01.requiredSites.filter(x=>!s.found.includes(x)).length}곳 더 찾아보세요.`;
 case 'P02':return s.clues.length<5?`단서를 ${5-s.clues.length}개 더 담아보세요.`:'사건과 관계가 먼 단서가 섞여 있어요. 다시 비교해 바꿔보세요.';
 case 'P03':return `설명한 관계 ${branches(s)} / 2 · 단서를 알맞은 생활 상황에 이어보세요.`;
 case 'P04':return `영향 카드를 ${DATA.p04.links.filter(x=>s.impacts[x.domain]!==x.id).length}개 더 연결해 보세요.`;
 case 'P05':return s.timeline.source!=='book'?'시간을 처음으로 되감고, 흔적이 처음 시작된 물체를 눌러보세요.':s.timeline.intervention===null?'손을 씻을 때를 하나 골라 끼워 넣어 보세요.':'다른 때에 손을 씻으면 연결이 어떻게 달라질까요?';
 case 'P06':{const n=LABS.filter(x=>!s.labs.done.includes(x.id)).length;return n?`실험을 ${n}개 더 해보세요.`:'닫힌 교실에서 기침할 때 바꿀 행동 두 가지를 골라보세요.';}
 case 'P07':return s.experiment.action?'흔적이 어떻게 달라질지 예측을 골라보세요.':'바꿀 행동 하나를 골라보세요.';
 case 'P08':{const a=DATA.p07.actionPool.find(x=>x.id===s.experiment.action);if(!a)return '조건 실험실에서 행동을 먼저 골라주세요.';return s.experiment.pinned!==a.differenceEvent?'두 장면이 달라지는 순간에 차이 지점을 표시해 보세요.':'바꾼 행동과 이어지는 결과를 골라 연결해 보세요.';}
 case 'P09':return !s.strategy.placements.length?'행동 카드를 고른 뒤 장소를 눌러 배치해 보세요.':!s.strategy.simulated?'작전 실행을 눌러 계획을 확인해 보세요.':'남은 연결을 살펴보고 계획을 고쳐 다시 실행해 보세요.';
 case 'P10':return s.final.phase==='report'?'직접 실천하기를 눌러 계획을 적용해 보세요.':`계획 ${s.strategy.placements.length-s.final.applied.length}개를 더 실천해 보세요.`;
 default:return '';
 }
}
function progressLabel(s:State):string {
 switch(s.route){
 case 'P01':return `신호 ${s.found.length} / 3곳`;
 case 'P02':return `단서 ${s.clues.length} / 5개`;
 case 'P03':return `관계 ${branches(s)} / 2가지`;
 case 'P04':return `영향 ${Object.keys(s.impacts).length} / 3영역`;
 case 'P05':return s.timeline.source==='book'&&s.timeline.intervention===1.5?'시간 추적 완료':`시작점 ${s.timeline.source?'선택함':'미선택'} · 시점 ${s.timeline.intervention===null?'미선택':'선택함'}`;
 case 'P06':return `실험 ${s.labs.done.length} / 5 · 종합 ${synthesisReady(s.labs.synthesis)?'완료':'확인 중'}`;
 case 'P07':return s.experiment.action?'행동 선택함 · 예측 대기':'행동 · 예측 미선택';
 case 'P08':return `관찰 기록 ${Number(!!s.experiment.pinned)+Number(!!s.experiment.explanation)} / 2`;
 case 'P09':return `대응 행동 ${s.strategy.placements.length}개 배치`;
 case 'P10':return s.final.phase==='report'?`연구 기록 ${s.evidence.length} / 5`:`실천 ${s.final.applied.length} / ${s.strategy.placements.length}`;
 default:return '';
 }
}
export function shell(s:State,v:View,content:string){
 const done=s.completed.includes(s.route);
 return `<main class="play-layout activity-layout" data-page="${s.route}" data-focus="${v.focus}"><section class="play-main"><div id="page-content" class="page-content">${content}</div><footer class="actionbar"><div class="activity-status"><button class="icon-btn activity-info" data-action="model-info" aria-label="학습 모형 안내">${icon('info',20)}</button><span class="status-line ${done?'success':''}" role="status">${icon(done?'check':'file',18)}<span>${done&&s.route!=='P10'?'활동 완료':progressLabel(s)}</span></span></div>${s.route==='P10'?btn(`${icon('file',19)} 연구 기록`,'records','small'):btn(`계속 ${icon('arrow',20)}`,'next',`primary ${done?'next-target':''}`,done?'':'disabled')}</footer></section></main>`;
}
export function pageContent(s:State,v:View):string {
 const page=Number(s.route.slice(1));
 if(page<=4)return observationPages(s,v);
 if(page<=6)return tracingPages(s,v);
 return strategyPages(s,v);
}
export function records(s:State){return `<div class="eyebrow">MY RESEARCH NOTE</div><h2>우리의 발견 기록</h2><p>플레이하며 남긴 근거가 여기 모여요.</p><div class="record-list">${DATA.evidence.map(e=>`<div class="record-entry ${s.evidence.includes(e.id)?'ready':''}"><span class="record-icon">${icon(s.evidence.includes(e.id)?'check':'lock',22)}</span><div><b>${e.name}</b><p>${s.evidence.includes(e.id)?e.id==='E1'?s.clues.map(id=>CLUE_NAMES[id]).join(' · '):e.id==='E2'?`설명한 관계 ${branches(s)}가지 · 생활 영향 3영역`:e.id==='E3'?'흔적의 이동과 다섯 생활 상황을 조사했어요.':e.id==='E4'?`${actionName(s.experiment.action)} 전후의 차이를 설명했어요.`:s.strategy.placements.map(p=>`${SITES.find(x=>x.id===p.site)?.name}: ${actionName(p.actionId)}`).join(' · '):'앞으로 탐구하며 채워갈 기록이에요.'}</p></div></div>`).join('')}</div>`;}
