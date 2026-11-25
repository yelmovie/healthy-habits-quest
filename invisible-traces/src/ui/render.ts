import {conceptRecall} from './concept-recall';
import {nextInstruction} from './learning-guidance';
import {DATA,STAGES,PAGES,LABS,SITES,CLUE_NAMES,asset} from '../data/game';
import {branches,type State} from '../simulation/model';
import {icon} from './icons';
import {PLACES,type Point} from '../game/school-map';
export interface View {site:string;clue:string;effect:string;lab:string;action:string;mapSpot:Point|null;mapOverview:boolean;teacher:boolean;playing:boolean;replacement:string;focus:string;speed:number;autoMode:string;demoStep:number;labPreview:number|null;}
export const viewFresh=():View=>({site:'classroom',clue:'',effect:'',lab:'contact',action:'',mapSpot:null,mapOverview:false,teacher:false,playing:false,replacement:'',focus:'',speed:1,autoMode:'',demoStep:0,labPreview:null});
import {btn,chip,image,actionName,CREDIT} from './render-parts';
export {btn} from './render-parts';
import {observationPages} from './stages-observation';
import {tracingPages,nextLab} from './stages-tracing';
import {strategyPages} from './stages-strategy';
export {comparisonBoard,comparisonTasks} from './stages-strategy';
/** 머리글 소리 버튼은 배경 음악과 효과음(목소리 포함)을 함께 켜고 끈다. 둘 중 하나라도 켜져 있으면 켜짐이다. */
/** 헤더 소리 버튼: 배경 음악·효과음·목소리 중 하나라도 켜져 있으면 「끄기」. */
export const soundOn=(s:State)=>s.settings.music||s.settings.sfx||s.settings.voice;
/** `cards`는 소리 버튼 바로 앞에 넣는 성취 카드 칸(지도 화면에서만 main.ts가 넘긴다). */
export function header(s:State,sandbox:boolean,cards=''){
 const page=PAGES.find(p=>p.id===s.route);
 const onMap=s.route==='C01';
 const tools=`${sandbox&&!onMap?btn(`${icon('undo',20)}<span>본편 복귀</span>`,'exit-replay','small','aria-label="본편 복귀"'):''}${s.route!=='C00'&&!onMap?`<button class="icon-btn" data-action="records" aria-label="연구 기록">${icon('file')}</button>`:''}${cards}<button class="icon-btn" data-action="sound" aria-label="${soundOn(s)?'소리 끄기':'소리 켜기'}" aria-pressed="${soundOn(s)}">${icon(soundOn(s)?'sound':'mute')}</button><button class="icon-btn" data-action="settings" aria-label="설정">${icon('settings')}</button>`;
 if(page)return `<header class="topbar activity-topbar"><button class="icon-btn" data-action="map" aria-label="조사 지도로 돌아가기">${icon('map',22)}</button><div class="activity-heading"><span class="activity-mission">미션 ${Number(page.stage.slice(1))} / 5</span><h1>${page.name}</h1></div><nav class="tools" aria-label="공통 도구">${tools}</nav></header>`;
 if(s.route==='C00')return `<header class="topbar title-topbar"><nav class="tools" aria-label="공통 도구">${tools}</nav></header>`;
 return `<header class="topbar map-topbar"><button class="brand" data-action="home" aria-label="메인으로"><span class="brand-mark">${icon('home',24)}</span><span>처음 화면</span></button><div class="header-center">${sandbox?chip('flask','다시 실험','purple'):''}</div><nav class="tools" aria-label="공통 도구">${tools}</nav></header>`;
}
// 그림 속 빛나는 자리(%)에 맞춰 신호가 깜빡인다.
const TITLE_SIGNALS=[['purple',26.2,43.6],['blue',50.7,52.8],['amber',78,51.6],['orange',82.6,75.5]] as const;
// 제작·저작권 표기: 시작 화면 우측 하단과 설정의 앱 정보에 같은 문구를 쓴다.
export {CREDIT} from './render-parts';
export function home(s:State){
 const active=s.found.length>0||s.clues.length>0;
 const start=btn(`${active?'이어 하기':'시작하기'} ${icon('arrow',22)}`,active?'continue':'start','primary');
 return `<main class="title-screen"><div class="title-world">${image('school','title-school')}${TITLE_SIGNALS.map(([color,x,y],i)=>`<i class="title-signal ${color}" style="left:${x}%;top:${y}%;animation-delay:${i*.7}s"></i>`).join('')}</div>${image('title-hero','title-person title-hero')}${image('title-mate','title-person title-mate')}<div class="title-center"><h1 class="title-logo">${image('title-logo','','보이지 않는 흔적')}</h1></div><div class="title-bottom"><div class="title-actions">${start}${active?btn('새로 시작','new-start','text'):''}</div></div><p class="title-credit">${CREDIT}</p></main>`;
}
// 지도 위 다섯 장소의 상태. 입장 가능 여부는 캔버스와 이름표가 같은 값을 쓴다.
export function mapStatus(s:State,v:View){const open=STAGES.map((_,i)=>i===0||s.evidence.includes(`E${i}`)||v.teacher);const done=STAGES.map(t=>s.completed.includes(t.pages[1]));return {open,done,next:STAGES.findIndex((_,i)=>open[i]&&!done[i])};}
export const mapViewLabel=(mode:string)=>mode==='overview'?'이전 지도 보기로 돌아가기':'지도 한눈에 보기';
export function map(s:State,v:View){const {open,done,next}=mapStatus(s,v);const nextPlace=PLACES[next];
 const label=(place:(typeof PLACES)[number],i:number)=>{const state=done[i]?'done':i===next?'next':open[i]?'open':'locked';return `<button class="map-place ${state}" data-action="stage" data-id="${i+1}" ${open[i]?'':'disabled'} aria-label="미션 ${i+1} ${place.name}, ${STAGES[i].name}, ${done[i]?'기록 완료, 다시 실험':open[i]?'조사 가능':'잠김'}"><span class="map-place-mark"><svg class="map-lock-icon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="${open[i]?'M8 11V7a4 4 0 0 1 7.5-2':'M8 11V7a4 4 0 0 1 8 0v4'}"/></svg></span><b>${place.name}</b></button>`;};
 const pad=(dir:string,name:string,text:string)=>`<button class="map-dir ${dir}" data-map-direction="${dir}" aria-label="${text}">${icon(name,24)}</button>`;
 return `<main class="map-page"><div id="pixel-map" role="application" aria-label="학교를 비스듬히 내려다보는 픽셀 지도. 방향키로 걷고 Enter로 들어가요." style="background-image:url(${asset('school')})"></div><div class="map-places">${PLACES.map(label).join('')}</div><p class="map-status" role="status"></p><section class="map-controls" aria-label="지도 조작"><div class="map-pad">${pad('up','arrow','위로 걷기')}${pad('left','arrow','왼쪽으로 걷기')}${pad('down','arrow','아래로 걷기')}${pad('right','arrow','오른쪽으로 걷기')}</div></section><aside class="map-next" aria-label="지도 보기와 다음 조사"><div class="map-view-tools">${btn(icon('hand',24),'map-hand','small map-icon-tool','aria-label="손으로 지도 움직이기" title="손으로 지도 움직이기" aria-pressed="false"')}${btn(icon('map',24),'map-view','small map-icon-tool',`aria-label="${v.mapOverview?'이전 지도 보기로 돌아가기':'지도 한눈에 보기'}" title="${v.mapOverview?'이전 지도 보기로 돌아가기':'지도 한눈에 보기'}" aria-pressed="${v.mapOverview}"`)}</div>${next>=0?`${btn(`${nextPlace.to} 가기 ${icon('arrow',20)}`,'stage','primary map-next-cue',`data-id="${next+1}"`)}`:`${btn(`연구 기록 보기 ${icon('arrow',20)}`,'records','primary')}`}</aside></main>`;}
// 다음 버튼이 잠긴 이유를 "무엇을 몇 개 더"로 알려준다. 판정은 derive()와 같은 조건을 따른다.
export function gateHint(s:State):string {
 switch(s.route){
 case 'P01':return `신호를 ${DATA.p01.requiredSites.filter(x=>!s.found.includes(x)).length}곳 더 찾아보세요.`;
 case 'P02':return s.clues.length<5?`단서를 ${5-s.clues.length}개 더 담아보세요.`:'사건과 관계가 먼 단서가 섞여 있어요. 다시 비교해 바꿔보세요.';
 case 'P03':return `설명한 관계 ${branches(s)} / 2 · 단서를 알맞은 생활 상황에 이어보세요.`;
 case 'P04':return `영향 카드를 ${DATA.p04.links.filter(x=>s.impacts[x.domain]!==x.id).length}개 더 연결해 보세요.`;
 case 'P05':return s.timeline.source!=='book'?'시간을 처음으로 되감고, 흔적이 처음 시작된 물체를 눌러보세요.':s.timeline.tried.length<2?'손 씻을 때를 두 번 이상 넣어 흔적 수를 비교해 보세요.':'흔적이 가장 적게 남는 이른 때를 찾아보세요.';
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
 case 'P01':return `신호 ${s.found.length} / ${DATA.p01.requiredSites.length}`;
 case 'P03':return `관계 ${branches(s)} / 2`;
 case 'P04':return `연결 ${Object.keys(s.impacts).length} / 3`;
 case 'P10':return `실천 ${s.final.applied.length} / ${s.strategy.placements.length}`;
 default:return '';
 }
}
export function shell(s:State,v:View,content:string){
 const done=s.completed.includes(s.route);
 const following=PAGES.find(p=>p.id===s.route)?.next;
 const lab=s.route==='P06'&&s.labs.done.includes(v.lab)?nextLab(s):undefined;
 let advance='';
 if(s.route!=='P10'&&done)advance=btn(`${following==='C01'?'조사 지도':'다음 조사'} ${icon('arrow',20)}`,'next','primary next-target');
 else if(lab&&lab!==v.lab)advance=btn(`${lab==='synthesis'?'종합 문제':'다음 실험'} ${icon('arrow',20)}`,'lab','primary next-target',`data-id="${lab}"`);
 else if(s.route==='P09'&&s.strategy.placements.length&&!v.action&&!s.strategy.simulated)advance=btn(`${icon('play',20)}작전 실행`,'simulate','primary');
 const progress=progressLabel(s);
 const instruction=nextInstruction(s,v);
 const task=content.replace(/<p class="mission-question">[\s\S]*?<\/p>/,'');
 return `<main class="play-layout activity-layout" data-page="${s.route}" data-focus="${v.focus}"><section class="play-main"><div id="page-content" class="page-content">${task}</div><footer class="actionbar"><button class="icon-btn activity-info" data-action="model-info" aria-label="힌트와 학습 모형 안내">${icon('info',22)}</button><div class="activity-status" role="status"><b class="next-instruction">${instruction}</b>${progress?`<span class="activity-progress">${progress}</span>`:''}</div>${advance}</footer></section></main>`;
}
export function pageContent(s:State,v:View):string {
 const page=Number(s.route.slice(1));
 if(page<=4)return observationPages(s,v);
 if(page<=6)return tracingPages(s,v);
 return strategyPages(s,v);
}
export function records(s:State){return `<h2>연구 기록</h2>${conceptRecall()}<div class="record-list">${DATA.evidence.map(e=>`<div class="record-entry ${s.evidence.includes(e.id)?'ready':''}"><span class="record-icon">${icon(s.evidence.includes(e.id)?'check':'lock',22)}</span><div><b>${e.name}</b><p>${s.evidence.includes(e.id)?e.id==='E1'?s.clues.map(id=>CLUE_NAMES[id]).join(' · '):e.id==='E2'?`설명한 관계 ${branches(s)}가지 · 생활 영향 3영역`:e.id==='E3'?'흔적의 이동과 다섯 생활 상황을 조사했어요.':e.id==='E4'?`${actionName(s.experiment.action)} 전후의 차이를 설명했어요.`:s.strategy.placements.map(p=>`${SITES.find(x=>x.id===p.site)?.name}: ${actionName(p.actionId)}`).join(' · '):'앞으로 탐구하며 채워갈 기록이에요.'}</p></div></div>`).join('')}</div>`;}
