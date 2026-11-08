import {DATA,SITES,ACTION_ICONS,EFFECTS} from '../data/game';
import {planCost,planResult,placementKey,nextPlacement,type State} from '../simulation/model';
import {icon} from './icons';
import {btn,chip,image,note,actionName,playbackControls} from './render-parts';
import type {View} from './render';

const COMPACT_ACTIONS:Record<string,string>={washHands:'손 씻기',ventilation:'환기',portionFood:'덜어 먹기',coughEtiquette:'기침 예절',personalItems:'내 물품'};
const actionLabel=(id:string,label:string)=>`<span class="action-full">${label}</span><span class="action-compact">${COMPACT_ACTIONS[id]??label}</span>`;

export function strategyPages(s:State,v:View):string {
 switch(s.route){
 case 'P07': return `<div class="strategy-activity condition-activity"><div class="condition-workspace"><section class="condition-study">
  <div class="condition-picture">${image('condition','condition-photo')}<span class="scene-tag">교실 · 점심시간</span></div>
  <div class="condition-constants">${chip('lock','장소 · 친구 · 시간 · 순서는 같아요')}</div>
 </section><aside class="prediction-panel"><div class="condition-step"><b>1</b><span>행동 하나 고르기</span></div>
  <div class="action-choices">${DATA.p07.actionPool.map(a=>btn(`${icon(ACTION_ICONS[a.id],24)}${actionLabel(a.id,a.name)}`,'experiment-action',s.experiment.action===a.id?'choice selected':s.experiment.action?'choice':'choice next-target',`data-id="${a.id}" aria-label="${a.name}" aria-pressed="${s.experiment.action===a.id}"`)).join('')}</div>
  <div class="condition-step"><b>2</b><span>흔적이 어떻게 달라질지 예측하기</span></div><div class="prediction-choices">${[['fewer','줄어들 것 같아요'],['same','비슷할 것 같아요'],['unsure','아직 모르겠어요']].map(([id,label])=>btn(label,'predict',s.experiment.action?'small next-target':'small',`data-id="${id}" ${s.experiment.action?'':'disabled'}`)).join('')}</div>
 </aside></div></div>`;
 case 'P08': {const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action);if(!a)return note('조건 실험실에서 행동을 먼저 골라주세요.');return `<div class="strategy-activity comparison-activity"><div class="comparison-live strategy-comparison-live">${comparisonBoard(s)}</div><div class="comparison-control-row">${playbackControls(v,'comparison')}<div class="time-controls strategy-time"><input id="comparison-range" type="range" aria-label="두 하루의 공통 시간" data-range="comparison" min="0" max="5" step="0.1" value="${s.experiment.tick}"><span id="comparison-time">${s.experiment.tick.toFixed(1)} / 5</span></div></div><div class="comparison-tasks strategy-tasks" data-after="${s.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time}">${comparisonTasks(s)}</div></div>`;}
 case 'P09': return strategyBoard(s,v);
 case 'P10': return finalPage(s,v);
 default:return '';
 }
}

const MODEL_LABELS:Record<string,[string,string,string]>={
 washHands:['손','함께 쓰는 물건','손에서 물건으로 이어지는 접촉'],
 coughEtiquette:['기침하는 친구','함께 있는 공간','가리지 않은 기침의 흔적'],
 ventilation:['교실 안','창문 밖','공기 흐름'],
 personalItems:['친구 A','친구 B','같은 컵을 통해 이어지는 접촉'],
 portionFood:['공용 음식','개인 접시','개인 식기와 공용 음식의 접촉']
};

// 도식은 연결의 차이를 나타내며, 실제 입자 수·감염 확률을 표현하지 않는다.
function experimentDrawing(action:string,changed:boolean,after:boolean){
 const active=changed&&after;
 const skin='#f2cfb8',ink='#28555a',teal='#0b7a74',pale='#dff4ef',purple='#7556d4';
 const stroke=`stroke="${ink}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
 const person=(x:number,y:number,shirt:string)=>`<g transform="translate(${x} ${y})"><circle cx="0" cy="-32" r="17" fill="${skin}" ${stroke}/><path d="M-29 38v-32q29-28 58 0v32" fill="${shirt}" ${stroke}/><path d="M-8-33h2m12 0h2m-13 10q7 5 14 0" ${stroke}/></g>`;
 const mug=(x:number,y:number,color:string)=>`<g transform="translate(${x} ${y})"><path d="M-19-22h38v40q-19 11-38 0z" fill="${color}" ${stroke}/><path d="M19-13h8c19 0 19 25 0 25h-8" fill="none" ${stroke}/><path d="M-12-30v-10m13 10v-15" stroke="${teal}" stroke-width="3" stroke-linecap="round"/></g>`;
 const arrow=(x:number,y:number)=>`<path d="M${x-28} ${y}h56m-9-8 9 8-9 8" fill="none" stroke="${active?teal:purple}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${!after?'opacity=".35"':''}/>`;
 const signals=(points:number[][])=>after?points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${purple}" opacity=".8"/><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${purple}" opacity=".25"/>`).join(''):'';
 let drawing='';
 if(action==='washHands')drawing=`<path d="M66 116V81q0-9 8-9t8 9V51q0-9 8-9t8 9v27-40q0-9 8-9t8 9v42-32q0-9 8-9t8 9v47l12-15q6-8 13-2t1 15l-30 43H86z" fill="${skin}" ${stroke}/><circle cx="327" cy="89" r="41" fill="#f4d58d" ${stroke}/><path d="m327 67 20 14-8 24h-24l-8-24zM327 48v19m40 13-20 1m-8 24 12 18m-36-18-12 18m-17-43 21 1" fill="none" ${stroke}/>${arrow(213,86)}${signals(active?[[100,111]]:[[105,111],[196,85],[311,79],[339,105]])}${active?`<g fill="${pale}" stroke="${teal}" stroke-width="3"><circle cx="70" cy="54" r="9"/><circle cx="53" cy="70" r="6"/><circle cx="139" cy="47" r="7"/></g><path d="m190 105 13 13 25-29" fill="none" stroke="${teal}" stroke-width="5"/>`:''}`;
 else if(action==='coughEtiquette')drawing=`${person(85,96,'#83c9d9')}${person(340,96,'#e6c17e')}${active?`<path d="M76 76q29-15 59-1l-6 22-43-3z" fill="#83c9d9" ${stroke}/><path d="M125 82 99 67" fill="none" ${stroke}/>`:''}<path d="M127 65q${active?'36-4 47 20':'82-46 171 0'}" fill="none" stroke="${purple}" stroke-width="3" stroke-dasharray="5 8" ${!after?'opacity=".18"':''}/>${signals(active?[[142,66],[156,73]]:[[148,62],[193,50],[236,60],[281,77]])}`;
 else if(action==='ventilation')drawing=`<path d="M53 31h314v112H53z" fill="#edf8f7" ${stroke}/><rect x="267" y="41" width="84" height="84" rx="3" fill="#c4e6ed" ${stroke}/><path d="M309 41v84m-42-42h84" fill="none" ${stroke}/>${active?`<path d="m309 41 30 12v59l-30 13z" fill="#fff" ${stroke}/><g fill="none" stroke="${teal}" stroke-width="4"><path d="M92 61h197m-10-8 10 8-10 8M111 88h212m-10-8 10 8-10 8M84 113h204m-10-8 10 8-10 8"/></g>`:`<path d="M294 84h8" ${stroke}/>`}${signals(active?[[113,112],[172,67]]:[[96,69],[155,110],[190,59],[227,93],[258,113]])}`;
 else if(action==='personalItems')drawing=`${person(77,99,'#83c9d9')}${person(345,99,'#e6c17e')}${active?`${mug(164,86,'#d0eef4')}${mug(258,86,'#f8e7bb')}<path d="M210 48v86" fill="none" stroke="${teal}" stroke-width="3" stroke-dasharray="5 6"/>`:`${mug(210,86,'#e0d6f8')}${arrow(143,124)}${arrow(277,124)}`}${signals(active?[]:[[187,63],[214,102],[291,94]])}`;
 else drawing=`<ellipse cx="98" cy="93" rx="58" ry="17" fill="#e0d6f8" ${stroke}/><path d="M40 93q8 48 58 48t58-48" fill="#d2e7e8" ${stroke}/><g fill="#b9cd88" stroke="${ink}" stroke-width="2"><ellipse cx="73" cy="88" rx="13" ry="7"/><ellipse cx="105" cy="94" rx="14" ry="7"/><ellipse cx="127" cy="85" rx="11" ry="6"/></g><ellipse cx="327" cy="115" rx="57" ry="24" fill="#fff" ${stroke}/><ellipse cx="327" cy="115" rx="38" ry="14" fill="#f0f7f4" stroke="${ink}" stroke-width="2"/>${active?`<path d="m160 60 51 26" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><ellipse cx="221" cy="92" rx="18" ry="12" fill="#a7d6d4" ${stroke}/>${arrow(239,131)}<path d="M299 64v27m8-27v27m-8-7h8m-4 7v47" stroke="${teal}" stroke-width="3"/>`:`<path d="m177 61-42 27m29-36 16 16m-8-22 16 16m-8-22 16 16" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>${arrow(219,113)}`}${signals(active?[]:[[151,87],[194,111],[312,109]])}`;
 return `<svg class="experiment-drawing" viewBox="0 0 420 170" role="img" aria-label="${active?actionName(action)+' 적용 뒤의 연결 모형':'기본 행동의 연결 모형'}"><rect x="12" y="12" width="396" height="146" rx="20" fill="#fff" opacity=".88"/>${drawing}</svg>`;
}

function compareScene(s:State,changed:boolean){
 const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action)!;
 const after=s.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time;
 const labels=MODEL_LABELS[a.id];
 return `<div class="compare-scene experiment-scene ${changed&&after?'calmer':''}">${image(a.id==='portionFood'?'condition':'classroom','compare-image')}${experimentDrawing(a.id,changed,after)}<div class="experiment-object-labels"><span>${labels[0]}</span><span>${labels[1]}</span></div></div>`;
}

export function comparisonBoard(s:State){
 const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action);if(!a)return '';
 const after=s.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time;
 return `<div class="comparison-board strategy-comparison"><section class="compare-half"><div class="compare-label"><b class="compare-letter">A</b><span>기본 하루</span></div>${compareScene(s,false)}<div class="compare-result">${after?'접촉·주의 신호가 이어져요.':'기본 조건을 유지해요.'}</div></section><section class="compare-half modified ${s.experiment.pinned?'pinned':''}"><div class="compare-label"><b class="compare-letter">B</b><span>${a.name}</span>${s.experiment.pinned?icon('flag',20):''}</div>${compareScene(s,true)}<div class="compare-result">${after?EFFECTS[a.id]:'선택한 행동이 시작되기 전이에요.'}</div></section></div>`;
}

const SHORT_EFFECTS:Record<string,string>={washHands:'손 → 물건의 접촉 감소',coughEtiquette:'가리지 않은 기침의 흔적 범위 감소',ventilation:'공기 흐름과 주의 신호 변화',personalItems:'같은 컵을 통한 접촉 감소',portionFood:'개인 식기와 공용 음식의 접촉 감소'};
export function comparisonTasks(s:State){
 const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action);if(!a)return '';
 const after=s.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time;
 return `${btn(`${icon(s.experiment.pinned?'check':'flag',19)}<span>${s.experiment.pinned?'표시했어요':'차이 표시'}</span>`,'difference',s.experiment.pinned?'small selected':after?'small next-target':'small',after?'':'disabled')}<select class="${s.experiment.pinned&&!s.experiment.explanation?'next-target':''}" aria-label="달라진 결과 연결" data-select="explanation"><option value="">관찰한 결과 연결하기</option>${DATA.p07.actionPool.map(x=>`<option value="${x.metric}" ${s.experiment.explanation===x.metric?'selected':''}>${SHORT_EFFECTS[x.id]}</option>`).join('')}</select>${btn(`${icon('undo',19)}<span>행동 바꾸기</span>`,'re-experiment','text')}`;
}

function strategyBoard(s:State,v:View){
 const result=planResult(s.strategy.placements),cost=planCost(s.strategy.placements);
 const contexts:Record<string,string>={classroom:'함께 지내는 공간의 공기 흐름',cafeteria:'공용 음식에 쓰는 도구',gym:'체육 활동 뒤 간식 먹기 전의 손'};
 const activeSite=SITES.find(x=>x.id===v.focus)?.id??SITES[0].id;
 const feedback=s.strategy.simulated?(result.success?'세 장소의 대응안이 완성됐어요.':`${SITES.filter(x=>!result.resolved.includes(x.id)).map(x=>x.name).join(' · ')}의 남은 연결을 살펴보세요.`):v.action?`‘${actionName(v.action)}’을 적용할 장소를 눌러요.`:'행동을 고른 뒤 장소를 눌러 배치해요.';
 return `<div class="strategy-activity strategy-planning"><div class="strategy-toolbar"><div class="strategy-energy"><b>${5-cost}<small>/ 5</small></b><span>남은 에너지</span><span class="energy-cells" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i class="${i<5-cost?'available':''}"></i>`).join('')}</span></div>${btn(`${icon('people',20)}현장 질문 <b>${3-s.strategy.asked.length}</b>`,'questions','small')}<div class="strategy-selection-hint ${result.success&&s.strategy.simulated?'success':''}" role="status">${icon(s.strategy.simulated?(result.success?'check':'search'):v.action?ACTION_ICONS[v.action]:'hand',20)}<span>${feedback}</span></div></div>
 <div class="strategy-place-tabs">${SITES.map((x,i)=>btn(`${i+1} ${x.name}`,'focus',activeSite===x.id?'small selected':'small',`data-id="${x.id}"`)).join('')}</div>
 <div class="strategy-zones">${SITES.map((x,i)=>{const placed=s.strategy.placements.filter(p=>p.site===x.id);const resolved=s.strategy.simulated&&result.resolved.includes(x.id);return `<section class="strategy-zone-card ${x.id===activeSite?'focused':''}"><button class="strategy-zone ${s.strategy.simulated?(resolved?'resolved':'remaining'):''} ${v.action?'next-target':''}" data-action="place" data-id="${x.id}" data-drop="strategy"><span class="strategy-zone-picture">${image(x.image)}<span>${icon(x.icon,28)}</span></span><span class="strategy-zone-title"><strong>${x.name}</strong>${s.strategy.simulated?icon(resolved?'check':'search',21):''}</span><span class="strategy-zone-context">${contexts[x.id]}</span></button><div class="strategy-placement-tags">${placed.map(p=>btn(`${icon(ACTION_ICONS[p.actionId],17)}<span>${actionName(p.actionId)}</span>${icon('close',15)}`,'remove-placement','tiny',`data-id="${placementKey(p)}" aria-label="${x.name} ${actionName(p.actionId)} 배치 취소"`)).join('')}</div></section>`;}).join('')}</div>
 <div class="strategy-actions">${DATA.p09.actions.map(a=>`<button class="action-card ${v.action===a.id?'selected':''}" data-action="strategy-action" data-id="${a.id}" draggable="true" data-drag="strategy" aria-pressed="${v.action===a.id}">${icon(ACTION_ICONS[a.id],26)}<b>${actionLabel(a.id,a.label)}</b><small>${icon('bolt',16)}${a.cost}</small></button>`).join('')}${btn(`${icon('play',20)}작전 실행`,'simulate',s.strategy.placements.length?'primary next-target':'primary',s.strategy.placements.length?'':'disabled')}</div></div>`;
}

function finalPage(s:State,v:View){
 if(['restored','ending','certificate'].includes(s.final.phase)){
  const cert=s.final.phase==='certificate';return `<div class="ending strategy-ending ${cert?'certificate':''}">${image('restored','ending-background')}<div class="ending-card"><span class="core-emblem">${icon('spark',42)}</span><h2>${cert?'학교 과학 조사 인증서':'우리의 발견이 학교를 바꿨어요.'}</h2><div class="ending-badges">${chip('check','다섯 탐구 미션 완료')}${chip('file','연구 기록 5 / 5')}</div>${cert?'<div class="cert-fields"><span>학교<i></i></span><span>학년·반<i></i></span><span>이름<i></i></span></div>':''}<div class="ending-actions">${cert?btn(`${icon('print',20)} 인증서 출력`,'print','primary'):btn(`${icon('file',20)} 조사 인증서`,'certificate','primary next-target')}${btn('연구 기록','records')}${btn('조사 지도','map','text')}</div></div></div>`;
 }
 if(s.final.phase==='report')return `<div class="strategy-activity strategy-report"><div class="final-report-heading">${icon('flag',26)}<h2>내가 설계한 계획을 실천해요</h2></div><div class="final-plan-cards">${s.strategy.placements.map((p,i)=>`<section class="final-plan-card"><div class="final-plan-picture">${image(SITES.find(x=>x.id===p.site)?.image??'classroom')}${experimentDrawing(p.actionId,true,true)}</div><div class="final-plan-caption"><b>${i+1}</b><span><small class="final-plan-place">${SITES.find(x=>x.id===p.site)?.name}</small><strong>${actionName(p.actionId)}</strong></span></div></section>`).join('')}</div>${btn(`직접 실천하기 ${icon('arrow',22)}`,'begin-apply','primary next-target')}</div>`;
 const p=nextPlacement(s);if(!p)return '';const key=placementKey(p);
 return `<div class="strategy-activity strategy-apply"><div class="apply-heading"><span class="apply-count">${s.final.applied.length+1} / ${s.strategy.placements.length}</span><h2>${SITES.find(x=>x.id===p.site)?.name} · ${actionName(p.actionId)}</h2><div class="apply-progress" aria-label="실천 완료 ${s.final.applied.length} / ${s.strategy.placements.length}">${s.strategy.placements.map(x=>`<i class="${s.final.applied.includes(placementKey(x))?'done':''}"></i>`).join('')}</div></div><div class="apply-device">${p.actionId==='ventilation'?`<div class="window-demo final-window ${v.demoStep>0?'open':''}" data-gesture="final-window" data-id="${key}"><div class="window-sky"></div><div class="window-frame"><div class="window-pane"></div></div><div class="air-streams">${icon('arrow',80)}${icon('arrow',80)}</div><span class="window-handle"></span></div>${btn(`${icon('window',21)} 창문 열기`,'apply','primary next-target',`data-id="${key}"`)}`:p.actionId==='washHands'?`<div class="hand-zones">${[['palm','손바닥'],['back','손등'],['fingers','손가락 사이']].map(([id,label],i)=>`<button data-action="hand-zone" data-id="${id}" data-key="${key}" class="hand-zone ${s.final.hands.includes(id)?'done':'next-target'}"><span class="hand-zone-number">${s.final.hands.includes(id)?icon('check',18):i+1}</span><span class="hand-zone-drawing zone-${id}">${icon('hand',72)}${id==='palm'?'<i class="palm-marker"></i>':id==='back'?'<i class="back-marker"></i>':'<i class="finger-marker"></i>'}</span><b>${label}</b></button>`).join('')}</div>`:`<div class="serving-demo final-serving"><div class="shared-bowl" draggable="true" data-drag="final-serve" data-id="${key}">${icon(ACTION_ICONS[p.actionId],100)}<b>${p.actionId==='portionFood'?'공용 음식과 덜기 도구':'공용 물품'}</b></div><span class="final-serving-direction">${icon('arrow',40)}</span><button class="personal-plate next-target" data-action="apply" data-id="${key}" data-drop="final-serve">${icon(p.actionId==='portionFood'?'plate':'bag',100)}<b>${p.actionId==='portionFood'?'개인 접시에 담기':'내 계획 적용하기'}</b></button></div>`}</div><div class="apply-playback">${playbackControls(v,'apply')}</div></div>`;
}
