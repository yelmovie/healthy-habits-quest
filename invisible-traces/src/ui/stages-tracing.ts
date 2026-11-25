import { labAssets } from '../data/lab-assets';
import { DATA, LABS, NODE_NAMES } from '../data/game';
import { contactAt, type State } from '../simulation/model';
import { icon } from './icons';
import { btn, image, playbackControls, windowIllustration } from './render-parts';
export const VISIBLE_LABS = LABS.filter(l => l.id !== 'contact');
import type { View } from './render';


export const synthesisReady = (actions: string[]) => ['coughEtiquette', 'ventilation'].every(id => actions.includes(id));

const nodeIcons = ['book', 'hand', 'ball', 'hand', 'door', 'hand'];
// 사물 그림: 책·손·공·손·문손잡이·손. 같은 손이라도 이름표로 누구의 손인지 구분한다.
const nodeArt = [labAssets.book, labAssets.handPalm, labAssets.ball, labAssets.handPalm, labAssets.door, labAssets.handPalm];
const nodeImage = (i: number) => `<img src="${nodeArt[i].src}" alt="" width="${nodeArt[i].width}" height="${nodeArt[i].height}" decoding="async" draggable="false">`;
const interventionNames = ['공을 만지기 전', '공을 만진 뒤', '다른 친구가 쓴 뒤', '문손잡이에 옮겨진 뒤'];
function traceStop(s: State, node: string, i: number, trace: Set<string>, avoided: string[]): string {
  const tick = DATA.p05.intervention.allowedTicks[i - 1];
  const source = s.timeline.source === node;
  const choosingSource = s.timeline.source !== 'book';
  const canWash = !choosingSource && tick !== undefined;
  const isActive = canWash && s.timeline.intervention === tick;
  const tried = canWash && s.timeline.tried.includes(tick);
  const tag = choosingSource || canWash ? 'button' : 'div';
  const timing = interventionNames[i - 1];
  const count = tried ? `흔적 ${contactAt(5, tick).size}곳` : '';
  const action = choosingSource
    ? `data-action="source" data-id="${node}" aria-pressed="${source}"`
    : canWash ? `data-action="intervene" data-id="${tick}" aria-label="${timing} 손 씻기${tried?`, ${count}`:''}" aria-pressed="${isActive}"` : '';
  return `<div class="trace-stop"><${tag} class="trace-node ${trace.has(node)?'has-trace':''} ${source?'source':''} ${avoided.includes(node)?'trace-protected':''} ${canWash?'trace-wash-stop':''}" data-node="${node}" ${action}>
    <span class="trace-step-number">${i}</span>
    <span class="trace-object">${nodeImage(i)}</span>
    <b>${node==='door'?'문<wbr>손잡이':NODE_NAMES[node]}</b>
    <span class="trace-state"><span class="trace-state-on">${icon('search',16)} 있음</span><span class="trace-state-off">없음</span><span class="prevented-trace">${avoided.includes(node)?'연결 차단':''}</span></span>
    ${canWash?`<span class="trace-wash ${isActive?'active':''}">${icon(tried?'check':'drop',18)}<span>${tried?count:timing}</span></span>`:`<em class="trace-source-label">${icon('flag',16)} 시작</em>`}
  </${tag}></div>`;
}

export function tracingPages(s: State, v: View): string {
  if (s.route === 'P05') {
    const trace = contactAt(s.timeline.tick, s.timeline.intervention);
    const before = contactAt(s.timeline.tick);
    const avoided = [...before].filter(node => !trace.has(node));
    return `<section class="tracing-page tracing-p05"><p class="mission-question">흔적이 시작된 곳을 고르고, <b>손 씻을 때</b>를 바꿔요.</p>
      <div class="timeline-layout tracing-timeline">
        <section class="timeline-stage tracing-stage" aria-label="접촉 순서 모형">
          ${image('classroom', 'timeline-background')}
          <div class="timeline-scene tracing-sequence">
            ${DATA.p05.nodes.map((node,i)=>traceStop(s,node,i,trace,avoided)).join('')}
          </div>
        </section>
      </div>
      <div class="tracing-play-row">${playbackControls(v, 'timeline')}<div class="tracing-time-controls"><input id="tracing-time" aria-label="사건 시간 되감기" data-range="timeline" type="range" min="0" max="5" step="0.1" value="${s.timeline.tick}"><span class="trace-model-note" id="prevention-result"><span>${s.timeline.intervention===null?'접촉 경로 학습 모형 · 실제 감염 여부를 나타내지 않아요.':`모형 흔적 ${before.size}곳 → ${trace.size}곳 · ${avoided.length}곳의 연결이 달라졌어요.`}</span></span><span id="time-label">사건 ${s.timeline.tick.toFixed(1)} / 5</span></div></div></section>`;
  }
  if (s.route === 'P06') {
    // 접촉 실험은 P05 기록과 같은 장면이라 탭을 따로 두지 않는다(자동으로 기록됨).
    const labs = LABS.filter(l => l.id !== 'contact');
    const next = labs.find(l => !s.labs.done.includes(l.id))?.id ?? 'synthesis';
    const tabs = [...labs, { id: 'synthesis', name: '종합·복습', icon: 'link' }];
    return `<section class="tracing-page tracing-p06"><p class="lab-model-notice">접촉은 앞 실험(P05)에서 다뤘어요. 종합은 배운 내용을 다시 쓰는 복습이에요.${['droplet','air','synthesis'].includes(v.lab)?'<span>비말과 공기 중 작은 입자는 같은 상황에서 함께 퍼질 수 있어요. 병마다 전파 방식이 달라요.</span>':''}</p><div class="lab-tabs tracing-lab-tabs" aria-label="실험 선택">${tabs.map(l => btn(`${icon(l.icon, 21)}<span>${l.name}</span>${s.labs.done.includes(l.id) || l.id === 'synthesis' && synthesisReady(s.labs.synthesis) ? icon('check', 16) : ''}`, 'lab', v.lab === l.id ? 'lab-tab selected' : 'lab-tab', `data-id="${l.id}" aria-pressed="${v.lab === l.id}"`)).join('')}</div>
      <section class="lab-device tracing-device tracing-device-${v.lab}">${labDevice(s, v)}</section>
      ${next !== v.lab && (s.labs.done.includes(v.lab) || v.lab === 'contact') ? `<div class="tracing-lab-play">${btn(`<span>${next === 'synthesis' ? '종합 문제 풀기' : `다음 실험: ${LABS.find(l => l.id === next)?.name}`}</span>${icon('arrow', 20)}`, 'lab', 'primary next-target', `data-id="${next}"`)}</div>` : ''}
    </section>`;
  }
  return '';
}

function learnerFigure(covered = false, coughing = false): string {
  const art = covered ? labAssets.coughCovered : coughing ? labAssets.coughUncovered : labAssets.coughBefore;
  return `<img class="tracing-learner" src="${art.src}" width="${art.width}" height="${art.height}" alt="" aria-hidden="true" data-cough-state="${covered ? 'covered' : 'uncovered'}" decoding="async" draggable="false">`;
}

function coughFigure(covered: boolean, synthesis = false): string {
  const action = synthesis ? 'data-action="synthesis" data-id="coughEtiquette"' : `data-action="lab-set" data-id="droplet" data-value="${covered?0:1}"`;
  return `<div class="tracing-cough-view ${covered?'is-covered':''}"><div class="tracing-cough-people">
    <button type="button" class="tracing-cough-person lab-picture-control" ${action} aria-pressed="${covered}" aria-label="${covered?'가리지 않은 기침 보기':'옷소매로 입과 코 가리기'}">${learnerFigure(covered,true)}<b>${covered?'옷소매로 가린 기침':'가리지 않은 기침'}</b><span class="lab-touch-mark" aria-hidden="true">${icon(covered?'undo':'hand',19)}</span></button>
    <div class="tracing-cough-path" aria-hidden="true"><span></span><i></i><i></i><i></i><i></i><i></i></div>
    <div class="tracing-cough-person tracing-cough-friend">${learnerFigure()}<b>함께 있는 친구</b></div>
  </div></div>`;
}

// 물 자체는 두 쪽 모두 똑같이 맑은 컵이다(겉모습으로 정답을 알 수 없게). 관리된 물에만 출처인 점검된 정수기가 함께 보인다.
function waterGlass(managed: boolean): string {
  const art = managed ? labAssets.waterManaged : labAssets.waterGlass;
  return `<img class="tracing-water-glass" src="${art.src}" alt="${managed ? '점검 표시가 있는 학교 정수기에서 받은 맑은 물 한 컵' : '어디서 받았는지 모르는 맑은 물 한 컵'}" width="${art.width}" height="${art.height}" decoding="async" draggable="false">`;
}

function foodIllustration(personal = false): string {
  const art = personal ? labAssets.personalPlate : labAssets.servingBowl;
  return `<img class="tracing-food-drawing" src="${art.src}" width="${art.width}" height="${art.height}" alt="${personal ? '개인 접시에 덜어 담은 음식' : '공용 음식과 전용 덜기 도구'}" draggable="false">`;
}

function labDevice(s: State, v: View): string {
  const value = v.labPreview ?? s.labs.values[v.lab] ?? 0;
  // 한자어 실험 이름(비말·타액)은 제목 아래에 짧은 풀이를 붙인다. 낮은 가로 화면에서는 CSS로 숨긴다.
const heading = (title: string, term = '') => `<h2 class="tracing-device-heading">${title}${term ? `<small class="tracing-term">${term}</small>` : ''}</h2>`;
  const result = (text: string, changed: boolean, compact = text, show = true) => !show ? '' : `<p class="device-result tracing-device-result ${changed ? 'is-observed' : ''}">${icon(changed ? 'check' : 'search', 20)}<span class="tracing-result-full">${text}</span><span class="tracing-result-compact">${compact}</span></p>`;
  switch (v.lab) {
    case 'contact':
      return `${heading('손에서 물건으로, 다시 다른 손으로')}
        <div class="tracing-device-art tracing-contact">${DATA.p05.nodes.map((x, i) => `<div class="tracing-contact-node ${i <= v.demoStep ? 'observed' : ''}"><span class="tracing-contact-order">${i + 1}</span>${icon(nodeIcons[i], 66)}<b><span class="tracing-contact-name">${NODE_NAMES[x]}</span><span class="tracing-contact-short">${['책', 'A의 손', '공', 'B의 손', '손잡이', 'C의 손'][i]}</span></b>${i < 5 ? `<span class="tracing-contact-arrow" aria-hidden="true">${icon('arrow', 23)}</span>` : ''}</div>`).join('')}</div>
        ${result('늦게 손을 씻어도 이미 다른 물체에 옮겨진 흔적은 남아요.', s.labs.done.includes('contact'), '옮겨진 흔적은 남아요.')}`;
    case 'droplet':
      return `${heading('옷소매로 입과 코를 가리면?', '비말은 기침·재채기 때 튀는 작은 침방울이에요.')}<div class="tracing-device-art">${coughFigure(!!value)}</div>
        ${result('흔적이 퍼지는 범위가 줄었어요.', !!value, '흔적 범위가 줄었어요.', !!value)}`;
    case 'air':
      return `${heading('창문을 열면 무엇이 달라질까요?')}
        <div class="tracing-device-art tracing-room"><button type="button" class="window-demo illustrated-window tracing-window lab-picture-control ${value?'open':''}" ${value?'':'data-gesture="window"'} data-action="lab-set" data-id="air" data-value="${value?0:1}" aria-pressed="${!!value}" aria-label="${value?'창문 닫기':'창문 열기'}">${windowIllustration(!!value)}<span class="lab-touch-mark" aria-hidden="true">${icon(value?'undo':'hand',19)}</span></button></div>
        ${result('바깥 공기와 바뀌며 공기 중 흔적이 줄어요.', !!value, '공기 흐름이 생겨요.', !!value)}`;
    case 'water':
      return `${heading('맑아 보이면 모두 괜찮을까요?')}
        <div class="tracing-device-art water-options tracing-water-options"><button class="water-card ${value === 1 ? 'selected' : ''}" data-action="water" data-id="1" aria-pressed="${value === 1}">${waterGlass(true)}<strong>관리 기록이 확인된 물</strong><small>${icon('file', 18)} 학교에서 공급·관리</small></button><button class="water-card ${value === 2 ? 'selected' : ''}" data-action="water" data-id="2" aria-pressed="${value === 2}">${waterGlass(false)}<strong>출처가 확인되지 않은 물</strong><small>${icon('search', 18)} 어디서 담았는지 몰라요</small></button></div>
        ${result(value === 1 ? '공급·관리 정보를 근거로 골랐어요.' : value === 2 ? '투명해도 안전한지 알 수 없어요.' : '두 물의 겉모습보다 관리 정보를 살펴봐요.', value === 1, value === 1 ? '관리 정보를 확인했어요.' : '관리 정보를 살펴봐요.', value !== 0)}`;
    case 'synthesis': {
      const open = s.labs.synthesis.includes('ventilation');
      return `${heading('닫힌 교실에서 기침한다면?')}<div class="tracing-device-art tracing-synthesis-scene">
        <button type="button" class="tracing-synthesis-window lab-picture-control ${open?'open':''}" data-action="synthesis" data-id="ventilation" aria-pressed="${open}" aria-label="${open?'창문 닫기':'창문 열기'}"><img src="${(open?labAssets.windowOpen:labAssets.windowClosed).src}" alt="" draggable="false"><b>${open?'열린 창문':'닫힌 창문'}</b><span class="lab-touch-mark" aria-hidden="true">${icon(open?'undo':'hand',19)}</span></button>
        ${coughFigure(s.labs.synthesis.includes('coughEtiquette'),true)}
        <button type="button" class="tracing-synthesis-hand lab-picture-control" data-action="synthesis" data-id="washHands"><img src="${labAssets.handPalm.src}" alt="" draggable="false"><b>손 씻기</b><span class="lab-touch-mark" aria-hidden="true">${icon('hand',19)}</span></button>
        </div>${result(synthesisReady(s.labs.synthesis) ? '기침 예절과 환기는 각각의 상황을 바꿔요.' : '기침과 닫힌 공간을 각각 바꾸는 두 행동을 골라요.', synthesisReady(s.labs.synthesis), undefined, s.labs.synthesis.length > 0)}`;
    }
    default:
      return `${heading('공용 음식은 어떻게 덜어 먹을까요?', '타액은 입속의 침이에요.')}
        <div class="tracing-device-art serving-demo tracing-serving ${value ? 'separated' : ''}"><div class="shared-bowl">${foodIllustration()}<b>공용 음식</b></div><div class="serving-tool" draggable="true" data-drag="serving" data-id="serve">${icon('plate', 38)}<span>덜기 도구</span>${icon('arrow', 24)}</div><button class="personal-plate ${value ? '' : 'next-target'}" data-action="lab-set" data-id="saliva" data-value="1" data-drop="serving" aria-label="개인 접시에 덜기">${value ? foodIllustration(true) : '<span class="tracing-empty-plate" aria-hidden="true"></span>'}<b>개인 접시</b></button></div>
        ${result('개인 숟가락과 공용 음식의 접촉이 줄었어요.', !!value, '접촉이 줄었어요.', !!value)}`;
  }
}
