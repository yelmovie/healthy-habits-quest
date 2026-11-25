import { labAssets } from '../data/lab-assets';
import {DATA,SITES,ACTION_ICONS,EFFECTS} from '../data/game';
import {planCost,planResult,placementKey,nextPlacement,type State} from '../simulation/model';
import {icon} from './icons';
import {btn,chip,image,note,actionName,playbackControls,windowIllustration,CREDIT} from './render-parts';
import type {View} from './render';

// 받침이 있으면 '을', 없으면 '를'.
const objectParticle=(word:string)=>(word.charCodeAt(word.length-1)-0xac00)%28>0?'을':'를';

// P01과 같은 장소 그림을 되풀이하지 않도록, 작전 화면에는 해결할 문제가 보이는 장면을 쓴다.
const PLAN_SCENES:Record<string,string>={classroom:'plan-classroom-20261116',cafeteria:'plan-cafeteria-20261116',gym:'plan-gym-20261116'};
const ACTION_ART:Record<string,string>={washHands:labAssets.handwashing.src,coughEtiquette:labAssets.coughCovered.src,ventilation:labAssets.windowOpen.src,personalItems:labAssets.waterGlass.src,portionFood:labAssets.personalPlate.src};
const COMPACT_ACTIONS:Record<string,string>={washHands:'손 씻기',ventilation:'환기',portionFood:'덜어 먹기',coughEtiquette:'기침 예절',personalItems:'내 물품'};
const actionLabel=(id:string,label:string)=>`<span class="action-full">${label}</span><span class="action-compact">${COMPACT_ACTIONS[id]??label}</span>`;

// 급식실 원본 그림에서 창문, 입, 손, 공용 그릇의 위치를 따라간다.
const CONDITION_TARGETS: Record<string, { x: number; y: number; label: string }> = {
  ventilation: { x: 39, y: 15, label: '창문' },
  coughEtiquette: { x: 53, y: 42, label: '입과 코' },
  washHands: { x: 14, y: 62, label: '손' },
  portionFood: { x: 54, y: 87, label: '공용 음식' },
  personalItems: { x: 86, y: 86, label: '컵' },
};

function conditionLab(s: State): string {
  const action = DATA.p07.actionPool.find(a => a.id === s.experiment.action);
  return `<div class="strategy-activity condition-activity"><div class="condition-workspace">
    <section class="condition-study" aria-label="점심시간 그림">
      <div class="condition-picture"><div class="condition-scene-area">${image('meal-20261110','condition-photo')}
        ${Object.entries(CONDITION_TARGETS).map(([id, target]) => {
          const name = actionName(id);
          const selected = action?.id === id;
          return `<button type="button" class="condition-target condition-target-${id}" style="--target-x:${target.x}%;--target-y:${target.y}%" data-action="experiment-action" data-id="${id}" aria-label="${target.label}, ${name}" aria-pressed="${selected}">
            <span class="condition-target-ring" aria-hidden="true">${id === 'personalItems' ? `<img class="condition-cup" src="${labAssets.waterGlass.src}" alt="" draggable="false">` : ''}</span>
            <span class="condition-target-label">${icon(selected ? 'check' : ACTION_ICONS[id], 16)}${target.label}</span>
          </button>`;
        }).join('')}
      </div></div>
      <div class="condition-constants">${chip('lock','장소 · 친구 · 시간 · 순서는 같아요')}</div>
    </section>
    <aside class="prediction-panel">
      <h2>흔적이 어떻게 달라질까요?</h2>
      <p class="condition-selection" role="status">${action ? `${icon(ACTION_ICONS[action.id], 21)}<strong>${action.name}</strong>` : `${icon('hand', 21)}<span>그림에서 바꿔 볼 곳을 골라요.</span>`}</p>
      <div class="prediction-choices">${[['fewer','줄어들 것 같아요','↘'],['same','비슷할 것 같아요','＝'],['unsure','아직 모르겠어요','?']].map(([id,label,mark])=>btn(`<span class="predict-mark" aria-hidden="true">${mark}</span>${label}`,'predict','small',`data-id="${id}" ${action?'':'disabled'}`)).join('')}</div>
    </aside>
  </div></div>`;
}

export function strategyPages(s:State,v:View):string {
 switch(s.route){
 case 'P07': return conditionLab(s);
 case 'P08': {
  const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action);
  if(!a)return note('조건 실험실에서 행동을 먼저 골라주세요.');
  const after=s.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time;
  return `<div class="strategy-activity comparison-activity"><div class="comparison-live strategy-comparison-live" data-after="${after}">${comparisonBoard(s)}</div><div class="comparison-control-row">${playbackControls(v,'comparison')}<div class="time-controls strategy-time"><input id="comparison-range" type="range" aria-label="두 하루의 공통 시간" data-range="comparison" min="0" max="5" step="0.1" value="${s.experiment.tick}"><span id="comparison-time">${s.experiment.tick.toFixed(1)} / 5</span></div></div><div class="comparison-tasks strategy-tasks" data-after="${after}">${comparisonTasks(s)}</div></div>`;
 }
 case 'P09': return strategyBoard(s,v);
 case 'P10': return finalPage(s,v);
 default:return '';
 }
}

const MODEL_LABELS:Record<string,[string,string,string]>={
 washHands:['손','함께 쓰는 물건','손에서 물건으로 옮겨 가는 흔적'],
 coughEtiquette:['기침하는 친구','함께 있는 공간','가리지 않은 기침의 흔적'],
 ventilation:['실내','창문 밖','공기 흐름'],
 personalItems:['친구 A','친구 B','같은 컵을 통해 이어지는 접촉'],
 portionFood:['공용 음식','개인 접시','개인 식기와 공용 음식의 접촉']
};

const DIFFERENCE_AREAS: Record<string, { x: number; y: number; width: number; height: number; label: string }> = {
  washHands: { x: 25, y: 50, width: 34, height: 84, label: '씻은 손' },
  coughEtiquette: { x: 29, y: 40, width: 34, height: 60, label: '입과 코를 가린 옷소매' },
  ventilation: { x: 50, y: 48, width: 57, height: 86, label: '열린 창문' },
  personalItems: { x: 51, y: 51, width: 43, height: 69, label: '따로 쓰는 두 컵' },
  portionFood: { x: 67, y: 47, width: 52, height: 65, label: '덜기 도구와 개인 접시' },
};

// 도식은 연결의 차이를 나타내며, 실제 입자 수·감염 확률을 표현하지 않는다.
function experimentDrawing(action:string,changed:boolean,after:boolean){
 const active=changed&&after;
 const teal='#0b7a74',purple='#7556d4';
 const picture=(src:string,x:number,y:number,width:number,height:number)=>`<image href="${src}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`;
 const arrow=(x:number,y:number)=>`<path d="M${x-28} ${y}h56m-9-8 9 8-9 8" fill="none" stroke="${active?teal:purple}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${!after?'opacity=".35"':''}/>`;
 const signals=(points:number[][])=>after?points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="${purple}" opacity=".8"/><circle cx="${x}" cy="${y}" r="10" fill="none" stroke="${purple}" opacity=".25"/>`).join(''):'';
 let drawing='';
 if(action==='washHands'){
  drawing=`${picture(labAssets.handPalm.src,35,12,140,145)}${picture(labAssets.ball.src,272,30,112,118)}${arrow(213,86)}${signals(active?[]:[[105,111],[196,85],[311,79],[339,105]])}${active?`<path d="m191 110 12 12 25-29" fill="none" stroke="${teal}" stroke-width="5"/>`:''}`;
 }else if(action==='coughEtiquette'){
  drawing=`${picture((active?labAssets.coughCovered:labAssets.coughUncovered).src,22,10,125,147)}${picture(labAssets.coughBefore.src,295,10,125,147)}<path d="M126 56q${active?'25-4 43 15':'82-28 171 10'}" fill="none" stroke="${purple}" stroke-width="3" stroke-dasharray="5 8" ${!after?'opacity=".18"':''}/>${signals(active?[[142,56],[157,61]]:[[148,52],[193,45],[236,50],[281,63]])}`;
 }else if(action==='ventilation'){
  drawing=`${picture((active?labAssets.windowOpen:labAssets.windowClosed).src,75,0,270,170)}${active?`<g fill="none" stroke="${teal}" stroke-width="4" stroke-linecap="round"><path d="M84 70h103m-10-8 10 8-10 8M190 111H87m10-8-10 8 10 8"/></g>`:''}${signals(active?[[123,113],[192,66]]:[[96,69],[155,110],[190,59],[227,93],[258,113]])}`;
 }else if(action==='personalItems'){
  drawing=`${picture(labAssets.coughBefore.src,18,16,95,140)}${picture(labAssets.coughBefore.src,307,16,95,140)}${active?`${picture(labAssets.waterGlass.src,129,35,75,100)}${picture(labAssets.waterGlass.src,222,35,75,100)}<path d="M212 40v96" fill="none" stroke="${teal}" stroke-width="3" stroke-dasharray="5 6"/>`:`${picture(labAssets.waterGlass.src,174,35,75,100)}${arrow(140,132)}${arrow(280,132)}`}${signals(active?[]:[[187,63],[214,102],[291,94]])}`;
 }else{
  drawing=`${picture(labAssets.servingBowl.src,15,15,170,130)}${picture(labAssets.personalPlate.src,264,40,145,105)}${arrow(223,93)}<g stroke="${active?teal:purple}" stroke-width="4" fill="none" stroke-linecap="round">${active?'<path d="m182 37 42 25"/><ellipse cx="233" cy="68" rx="12" ry="8"/>':'<path d="m174 39-39 29m27-37 18 15m-9-23 18 15m-9-23 18 15"/>'}</g>${signals(active?[]:[[151,87],[194,111],[312,109]])}`;
 }
 return `<svg class="experiment-drawing" viewBox="0 0 420 170" role="img" aria-label="${active?actionName(action)+' 적용 뒤의 연결 모형':'기본 행동의 연결 모형'}"><rect x="12" y="8" width="396" height="154" rx="24" fill="#fff" opacity=".78"/>${drawing}</svg>`;
}

function compareScene(s:State,changed:boolean){
 const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action)!;
 const after=s.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time;
 const labels=MODEL_LABELS[a.id];
 const area=DIFFERENCE_AREAS[a.id];
 const areaStyle=`--target-x:${area.x}%;--target-y:${area.y}%;--target-width:${area.width}%;--target-height:${area.height}%`;
 const marker=changed&&after
  ? s.experiment.pinned
    ? `<span class="experiment-hit observed" style="${areaStyle}" aria-hidden="true"><span>${icon('check',20)}</span></span>`
    : `<button type="button" class="experiment-hit" style="${areaStyle}" data-action="difference" aria-label="B 그림에서 ${area.label} 표시하기"><span aria-hidden="true">${icon('flag',20)}</span></button>`
  : '';
 return `<div class="compare-scene experiment-scene ${changed&&after?'calmer':''}">${image('meal-20261110','compare-image')}<div class="experiment-playfield"><div class="experiment-picture">${experimentDrawing(a.id,changed,after)}${marker}</div></div><div class="experiment-object-labels"><span>${labels[0]}</span><span>${labels[1]}</span></div></div>`;
}

export function comparisonBoard(s:State){
 const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action);if(!a)return '';
 const after=s.experiment.tick>=DATA.p07.events.find(e=>e.id===a.differenceEvent)!.time;
 const result=after?(s.experiment.explanation===a.metric?EFFECTS[a.id]:'같은 곳을 A 그림과 비교해 봐요.'):'선택한 행동이 시작되기 전이에요.';
 return `<div class="prediction-record">내 예상: <b>${PREDICTIONS[s.experiment.prediction]??'아직 고르지 않았어요'}</b> · 예상은 채점하지 않아요.</div><div class="comparison-board strategy-comparison"><section class="compare-half"><div class="compare-label"><b class="compare-letter">A</b><span>기본 하루</span></div>${compareScene(s,false)}<div class="compare-result">기본 조건을 유지해요.</div></section><section class="compare-half modified ${s.experiment.pinned?'pinned':''}"><div class="compare-label"><b class="compare-letter">B</b><span>${a.name}</span>${s.experiment.pinned?icon('check',20):''}</div>${compareScene(s,true)}<div class="compare-result">${result}</div></section></div>`;
}

const PREDICTIONS:Record<string,string>={fewer:'줄어들 것 같아요',same:'비슷할 것 같아요',unsure:'아직 모르겠어요'};
const REFLECTIONS=[['matched','예상과 같았어요'],['different','예상과 달랐어요'],['unsure','아직 잘 모르겠어요']];
const SHORT_EFFECTS:Record<string,string>={washHands:'손에서 옮겨 가는 흔적 감소',coughEtiquette:'가리지 않은 기침의 흔적 범위 감소',ventilation:'바깥 공기와 바뀌어 흔적 감소',personalItems:'같은 컵을 통한 접촉 감소',portionFood:'개인 식기와 공용 음식의 접촉 감소'};
export function comparisonTasks(s:State){
 const a=DATA.p07.actionPool.find(a=>a.id===s.experiment.action);if(!a)return '';
 const change=btn(`${icon('undo',19)}<span>행동 바꾸기</span>`,'re-experiment','text');
 if(!s.experiment.pinned)return change;
 if(s.experiment.explanation===a.metric){
  return `<div class="prediction-reflection"><b>내 예상과 뭐가 달랐나요?</b><span>결과 그림을 근거로 말한 뒤 골라요. 정답은 없어요.</span><div class="reflection-choices">${REFLECTIONS.map(([id,label])=>btn(label,'reflect',`small ${s.experiment.reflection===id?'selected':''}`,`data-id="${id}" aria-pressed="${s.experiment.reflection===id}"`)).join('')}</div></div>${change}`;
 }
 const pool=DATA.p07.actionPool,i=pool.findIndex(x=>x.id===a.id),options=[pool[i],pool[(i+1)%pool.length],pool[(i+3)%pool.length]].sort((x,y)=>x.metric.localeCompare(y.metric));
 return `<div class="explain-step"><span class="explain-label">${icon('link',19)}무엇이 달라졌나요?</span><div class="explain-choices">${options.map(x=>btn(SHORT_EFFECTS[x.id],'explain','choice',`data-id="${x.metric}"`)).join('')}</div></div>${change}`;
}

const SCENE_HINTS:Record<string,string>={classroom:'닫힌 교실에서 공기가 드나들 길을 살펴봐요.',cafeteria:'개인 숟가락이 공용 음식에 닿는지 살펴봐요.',gym:'공을 만진 뒤 음식을 먹기 전의 손을 떠올려요.'};
export const strategySceneHint=(site:string)=>SCENE_HINTS[site]??'그 장소에서 흔적이 이어지는 장면을 다시 살펴봐요.';

function strategyBoard(s:State,v:View){
 const result=planResult(s.strategy.placements),cost=planCost(s.strategy.placements);
 const contexts:Record<string,string>={classroom:'함께 지내는 공간의 공기 흐름',cafeteria:'공용 음식에 쓰는 도구',gym:'체육 활동 뒤 간식 먹기 전의 손'};
 const activeSite=SITES.find(x=>x.id===v.focus)?.id??SITES[0].id;
 const remaining=SITES.find(x=>!result.resolved.includes(x.id));
 const feedback=s.strategy.simulated?(result.success?'세 장소의 대응안이 완성됐어요.':`${remaining?.name}: ${strategySceneHint(remaining?.id??'')}`):v.action?`‘${actionName(v.action)}’${objectParticle(actionName(v.action))} 적용할 장소를 눌러요.`:'행동을 고른 뒤 장소를 눌러 배치해요.';
 return `<div class="strategy-activity strategy-planning"><div class="strategy-toolbar"><div class="strategy-energy"><b>${5-cost}<small>/ 5</small></b><span>남은 에너지<br>게임 규칙</span><span class="energy-cells" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i class="${i<5-cost?'available':''}"></i>`).join('')}</span></div>${btn(`${icon('people',20)}현장 질문 <b>${3-s.strategy.asked.length}</b>`,'questions','small')}<div class="strategy-selection-hint ${result.success&&s.strategy.simulated?'success':''}" role="status" ${s.strategy.simulated?'':'hidden'}>${icon(s.strategy.simulated?(result.success?'check':'search'):v.action?ACTION_ICONS[v.action]:'hand',20)}<span>${feedback}</span></div></div>
 <div class="strategy-place-tabs" aria-label="살펴볼 장소">${SITES.map(x=>btn(x.name,'focus',activeSite===x.id?'small selected':'small',`data-id="${x.id}" aria-pressed="${activeSite===x.id}"`)).join('')}</div>
 <div class="strategy-zones">${SITES.map(x=>{
  const placed=s.strategy.placements.filter(p=>p.site===x.id);
  const resolved=s.strategy.simulated&&result.resolved.includes(x.id);
  return `<section class="strategy-zone-card ${x.id===activeSite?'focused':''}">
    <button class="strategy-zone ${s.strategy.simulated?(resolved?'resolved':'remaining'):''} ${v.action?'placement-ready':''}" data-action="place" data-id="${x.id}" data-drop="strategy">
      <span class="strategy-zone-picture">${image(PLAN_SCENES[x.id]??x.image)}<span aria-hidden="true">${icon(v.action?'hand':x.icon,23)}</span></span>
      <span class="strategy-zone-title"><strong>${x.name}</strong>${s.strategy.simulated?icon(resolved?'check':'search',21):''}</span>
      <span class="strategy-zone-context">${contexts[x.id]}</span>
    </button>
    <div class="strategy-placement-tags">${placed.map(p=>btn(`${icon(ACTION_ICONS[p.actionId],17)}<span>${actionName(p.actionId)}</span>${icon('close',15)}`,'remove-placement','tiny',`data-id="${placementKey(p)}" aria-label="${x.name} ${actionName(p.actionId)} 배치 취소"`)).join('')}</div>
  </section>`;
 }).join('')}</div>
 <div class="strategy-actions">${DATA.p09.actions.map(a=>`<button class="action-card ${v.action===a.id?'selected':''}" data-action="strategy-action" data-id="${a.id}" draggable="true" data-drag="strategy" aria-pressed="${v.action===a.id}" aria-label="${a.label}, 에너지 ${a.cost}">
   <img class="strategy-action-art" src="${ACTION_ART[a.id]}" alt="" draggable="false"><b>${actionLabel(a.id,a.label)}</b><small>${icon('bolt',16)}${a.cost}</small>
 </button>`).join('')}${btn(`${icon('play',20)}작전 실행`,'simulate',s.strategy.placements.length?'primary next-target':'primary',s.strategy.placements.length?'':'disabled')}</div></div>`;
}

function finalWindow(open: boolean, key: string): string {
 return `<button type="button" class="window-demo illustrated-window final-window ${open?'open':''}" data-action="apply" data-gesture="final-window" data-id="${key}" aria-label="${open?'열린 창문':'창문 열기'}" ${open?'disabled':''}>
  ${windowIllustration(open)}
  ${open?`<span class="final-reveal">${icon('check',22)} 바깥 공기가 들어와요!</span>`:`<span class="swipe-hint" aria-hidden="true">${icon('hand',25)}${icon('arrow',22)}</span>`}
 </button>`;
}

// 인증서(2026-11-22 디자인): A4 가로 종이 한 장 + 종이 밖 버튼. 학교·학년/반·번호·이름은 인쇄한 뒤 손으로 쓰는 밑줄 빈칸이다.
function certificatePage(){
 return `<div class="ending strategy-ending certificate cert-stage">${image('restored','ending-background')}<div class="cert-layout">
 <section class="cert-paper" data-cert-paper aria-label="학교 과학 조사 인증서">${image('certificate-frame-20261122','cert-frame')}<div class="cert-content">
 <p class="cert-kicker">보이지 않는 흔적 · 학교 과학 조사</p>
 <h2 class="cert-title">학교 과학 조사 인증서</h2>
 <div class="cert-to"><p>${[['school','학교'],['class','학년/반'],['number','번호']].map(([id,label])=>`<span class="cert-slot cert-slot-${id}"><small>${label}</small><b></b></span>`).join('')}</p><p><span class="cert-slot cert-slot-name"><small>이름</small><b></b></span></p></div>
 <p class="cert-award">위 조사원은 학교에 남은 보이지 않는 흔적을 관찰하고 근거를 비교하여<br>손 씻기·기침 예절·환기·덜어 먹기 실천 계획을 수립하였으므로 이 인증서를 수여함.</p>
 <div class="cert-foot"><p class="cert-date"><small>완료한 날</small><b>${certDate()}</b></p><span class="cert-stamp" aria-hidden="true"><span>조사<br>완료</span></span><p class="cert-giver"><small>수여자</small><b>기록 파트너</b></p></div>
 <small class="cert-credit">${CREDIT}</small>
 </div></section>
 <aside class="cert-panel" aria-label="인증서 저장"><p class="cert-handwrite">인쇄한 뒤 학교·반·번호·이름을 직접 적어요.</p>
 <div class="ending-actions">${btn(`${icon('print',20)} 인증서 인쇄 / PDF 저장`,'print','primary')}${btn(`${icon('file',20)} PNG로 저장`,'cert-png','secondary')}${btn(`${icon('play',20)} 파이널 영상 다시 보기`,'film','secondary','data-id="outro"')}</div></aside>
 </div></div>`;
}
// 인증서 날짜: 인증서를 연 날을 `2026. 11. 22.` 꼴로(저장 구조는 바꾸지 않는다).
const certDate=(d=new Date())=>`${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;
function finalPage(s:State,v:View){
 if(s.final.phase==='certificate')return certificatePage();
 if(['restored','ending','certificate'].includes(s.final.phase)){
  const cert=false;return `<div class="ending strategy-ending ${cert?'certificate':''}">${image('restored','ending-background')}<div class="ending-card"><span class="core-emblem">${icon('spark',42)}</span><h2>${cert?'학교 과학 조사 인증서':'우리의 발견이 학교를 바꿨어요.'}</h2><div class="ending-badges">${chip('check','다섯 탐구 미션 완료')}${chip('file','연구 기록 5 / 5')}</div>${cert?'':'<p class="ending-practice">손 씻기·기침 예절·환기·덜어 먹기는 생활에서 모두 함께 실천해요.</p><p class="ending-share"><b>오늘의 약속을 말해요</b><span>나는 오늘 ______할 때 ______할 거야.<br>왜냐하면 ______을 줄일 수 있기 때문이야.</span></p>'}${cert?'<div class="cert-fields"><span>학교<i></i></span><span>학년·반<i></i></span><span>이름<i></i></span></div>':''}${cert?`<p class="cert-date">완료한 날 ${certDate()}</p>`:''}${cert?`<small class="cert-credit">${CREDIT}</small>`:''}<div class="ending-actions">${cert?btn(`${icon('print',20)} 인증서 인쇄 / PDF 저장`,'print','primary'):btn(`${icon('file',20)} 조사 인증서`,'certificate','primary next-target')}${btn(`${icon('play',20)} 파이널 영상 다시 보기`,'film','secondary','data-id="outro"')}</div></div></div>`;
 }
 if(s.final.phase==='report')return `<div class="strategy-activity strategy-report"><div class="final-report-heading">${icon('flag',26)}<h2>내가 설계한 계획을 실천해요</h2></div><div class="final-plan-cards">${s.strategy.placements.map((p,i)=>`<section class="final-plan-card"><div class="final-plan-picture">${image(SITES.find(x=>x.id===p.site)?.image??'classroom')}${experimentDrawing(p.actionId,true,true)}</div><div class="final-plan-caption"><b>${i+1}</b><span><small class="final-plan-place">${SITES.find(x=>x.id===p.site)?.name}</small><strong>${actionName(p.actionId)}</strong></span></div></section>`).join('')}</div>${btn(`직접 실천하기 ${icon('arrow',22)}`,'begin-apply','primary next-target')}</div>`;
 const p=nextPlacement(s);if(!p)return '';const key=placementKey(p);
 return `<div class="strategy-activity strategy-apply"><div class="apply-heading"><h2>${SITES.find(x=>x.id===p.site)?.name} · ${actionName(p.actionId)}</h2></div><div class="apply-device">${p.actionId==='ventilation'?finalWindow(v.demoStep>0,key):p.actionId==='washHands'?`<div class="handwashing-workspace wash-steps"><p class="wash-practice-note">세 부위 문지르기는 게임 연습이에요. 실제 손 씻기는 아래 그림 안내를 따라요.</p><div class="hand-zones">${[['palm','손바닥'],['back','손등'],['fingers','손가락 사이']].map(([id,label],i)=>`<button data-action="hand-zone" data-id="${id}" data-key="${key}" class="hand-zone ${s.final.hands.includes(id)?'done':'next-target'}"><span class="hand-zone-number">${s.final.hands.includes(id)?icon('check',18):i+1}</span>${image(['wash-palm-20261116','wash-back-20261116','wash-fingers-20261116'][i],'hand-zone-art')}<span class="hand-zone-cue">${['두 손바닥을 마주 대고 문질러요.','한 손바닥으로 다른 손등을 문질러요.','깍지를 끼고 손가락 사이를 문질러요.'][i]}</span><b>${label}</b><span class="rub-meter" aria-hidden="true"></span></button>`).join('')}</div>${realHandwashingGuide()}</div>`:`<div class="serving-demo final-serving"><div class="shared-bowl" draggable="true" data-drag="final-serve" data-id="${key}">${p.actionId==='portionFood'?image('serving-bowl-20261112','final-food-illustration','공용 음식과 덜기 도구'):icon(ACTION_ICONS[p.actionId],100)}<b>${p.actionId==='portionFood'?'공용 음식과 덜기 도구':'공용 물품'}</b></div><span class="final-serving-direction">${icon('arrow',40)}</span><button class="personal-plate ${v.demoStep>0?'filled':'next-target'}" data-action="apply" data-id="${key}" data-drop="final-serve" ${v.demoStep>0?'disabled':''}>${p.actionId==='portionFood'?(v.demoStep>0?image('personal-plate-20261112','final-food-illustration','개인 접시에 덜어 담은 음식'):'<span class="tracing-empty-plate" aria-hidden="true"></span>'):icon('bag',100)}<b>${v.demoStep>0?'내 접시에 덜었어요!':p.actionId==='portionFood'?'여기를 눌러 개인 접시에 덜기':'내 계획 적용하기'}</b></button></div>`}</div></div>`;
}

function realHandwashingGuide(){
 return `<aside class="wash-real-guide" aria-label="실제 손 씻기 그림 안내"><b>실제로는 흐르는 물과 비누로 30초 이상 꼼꼼히 씻어요.</b><ol><li>${icon('drop',30)}<span>물을 적시고<br>비누 거품 내기</span></li><li><span class="wash-guide-pictures">${['wash-palm-20261116','wash-back-20261116','wash-fingers-20261116'].map(name=>image(name)).join('')}</span><span>손바닥·손등·손가락 사이·마주 잡은 손가락을 문질러요.<br>엄지도 돌려 씻고, 손끝과 손톱 밑도 꼼꼼히 씻어요.</span></li><li>${icon('drop',30)}<span>흐르는 물로 헹구고<br>깨끗하게 말리기</span></li></ol></aside>`;
}
