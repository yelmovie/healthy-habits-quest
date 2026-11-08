import { labAssets } from '../data/lab-assets';
import { DATA, LABS, NODE_NAMES } from '../data/game';
import { contactAt, type State } from '../simulation/model';
import { icon } from './icons';
import { btn, image, actionName, playbackControls } from './render-parts';
import type { View } from './render';


export const synthesisReady = (actions: string[]) => ['coughEtiquette', 'ventilation'].every(id => actions.includes(id));

const nodeIcons = ['book', 'hand', 'ball', 'hand', 'lock', 'hand'];
const interventionNames = ['공을 만지기 전', '공을 만진 뒤', '다른 친구가 쓴 뒤', '문손잡이에 옮겨진 뒤'];

export function tracingPages(s: State, v: View): string {
  if (s.route === 'P05') {
    const trace = contactAt(s.timeline.tick, s.timeline.intervention);
    return `<section class="tracing-page tracing-p05"><p class="mission-question">흔적이 시작된 곳을 고르고, <b>손 씻을 때</b>를 바꿔요.</p>
      <div class="timeline-layout tracing-timeline">
        <section class="timeline-stage tracing-stage" aria-label="접촉 순서 모형">
          ${image('classroom', 'timeline-background')}
          <div class="timeline-scene tracing-sequence">
            ${DATA.p05.nodes.map((node, i) => `<button class="trace-node ${trace.has(node) ? 'has-trace' : ''} ${s.timeline.source === node ? 'source' : ''}" data-node="${node}" data-action="source" data-id="${node}" aria-pressed="${s.timeline.source === node}">
              <span class="trace-step-number">${i}</span>
              <span class="trace-object">${icon(nodeIcons[i], 34)}</span>
              <b>${NODE_NAMES[node]}</b>
              <span class="trace-state"><span class="trace-state-on">${icon('search', 16)} 있음</span><span class="trace-state-off">없음</span></span>
              <em class="trace-source-label">${icon('flag', 16)} 시작</em>
            </button>`).join('')}
          </div>
        </section>
        <aside class="intervention-panel tracing-intervention">
          <label class="tracing-intervention-label" for="tracing-intervention">${icon('hand', 24)}<b>손 씻을 때</b></label>
          <div class="tracing-choices">${DATA.p05.intervention.allowedTicks.map((tick, i) => btn(`<span>${interventionNames[i]}</span>${s.timeline.intervention === tick ? icon('check', 18) : ''}`, 'intervene', s.timeline.intervention === tick ? 'choice selected' : 'choice', `data-id="${tick}" aria-pressed="${s.timeline.intervention === tick}"`)).join('')}</div>
          <select id="tracing-intervention" class="tracing-intervention-select" data-select="intervention" aria-label="손 씻을 때 선택"><option value="">시점을 골라요</option>${DATA.p05.intervention.allowedTicks.map((tick, i) => `<option value="${tick}" ${s.timeline.intervention === tick ? 'selected' : ''}>${interventionNames[i]}</option>`).join('')}</select>
          <div class="intervention-result">${icon(s.timeline.intervention === 1.5 ? 'check' : 'info', 20)}<span>${s.timeline.intervention === null ? '시점을 골라 전후를 비교해요.' : s.timeline.intervention === 1.5 ? '이후 연결이 달라졌어요.' : '이미 옮겨진 흔적은 남아요.'}</span></div>
        </aside>
      </div>
      <div class="tracing-play-row">${playbackControls(v, 'timeline')}<div class="tracing-time-controls"><input id="tracing-time" aria-label="사건 시간 되감기" data-range="timeline" type="range" min="0" max="5" step="0.1" value="${s.timeline.tick}"><span id="time-label">사건 ${s.timeline.tick.toFixed(1)} / 5</span></div></div></section>`;
  }
  if (s.route === 'P06') {
    const next = LABS.find(l => !s.labs.done.includes(l.id))?.id ?? 'synthesis';
    const tabs = [...LABS, { id: 'synthesis', name: '종합', icon: 'link' }];
    return `<section class="tracing-page tracing-p06"><div class="lab-tabs tracing-lab-tabs" aria-label="실험 선택">${tabs.map(l => btn(`${icon(l.icon, 21)}<span>${l.name}</span>${s.labs.done.includes(l.id) || l.id === 'synthesis' && synthesisReady(s.labs.synthesis) ? icon('check', 16) : ''}`, 'lab', `${v.lab === l.id ? 'lab-tab selected' : 'lab-tab'} ${next === l.id && v.lab !== l.id ? 'next-target' : ''}`, `data-id="${l.id}" aria-pressed="${v.lab === l.id}"`)).join('')}</div>
      <section class="lab-device tracing-device tracing-device-${v.lab}">${labDevice(s, v)}</section>
      <div class="tracing-lab-play">${['water', 'synthesis'].includes(v.lab) ? '' : playbackControls(v, 'lab')}${next !== v.lab ? btn(`<span>${next === 'synthesis' ? '종합 문제' : `${LABS.find(l => l.id === next)?.name} 실험`}</span>${icon('arrow', 20)}`, 'lab', 'small next-target', `data-id="${next}"`) : ''}</div>
    </section>`;
  }
  return '';
}

function learnerFigure(covered = false): string {
  const art = covered ? labAssets.coughCovered : labAssets.coughBefore;
  return `<img class="tracing-learner" src="${art.src}" width="${art.width}" height="${art.height}" alt="" aria-hidden="true" data-cough-state="${covered ? 'covered' : 'uncovered'}" decoding="async" draggable="false">`;
}

function coughFigure(covered: boolean): string {
  return `<div class="tracing-cough-view ${covered ? 'is-covered' : ''}"><div class="tracing-cough-people"><div class="tracing-cough-person">${learnerFigure(covered)}<b>${covered ? '옷소매로 가린 기침' : '가리지 않은 기침'}</b></div><div class="tracing-cough-path" aria-hidden="true"><span></span><i></i><i></i><i></i><i></i><i></i></div><div class="tracing-cough-person tracing-cough-friend">${learnerFigure()}<b>함께 있는 친구</b></div></div></div>`;
}

function waterGlass(): string {
  return `<img class="tracing-water-glass" src="${labAssets.waterGlass.src}" alt="겉보기에는 같은 맑은 물" width="${labAssets.waterGlass.width}" height="${labAssets.waterGlass.height}" decoding="async" draggable="false">`;
}

function bowlSvg(personal = false): string {
  return `<svg class="tracing-food-drawing" viewBox="0 0 150 100" fill="none" aria-hidden="true">${personal ? '<ellipse cx="75" cy="64" rx="61" ry="24" fill="var(--sky)" stroke="var(--sky-strong)" stroke-width="3"/><ellipse cx="75" cy="62" rx="42" ry="14" fill="#fff" stroke="var(--sky-strong)" stroke-width="2"/>' : '<path d="M14 44c5 53 117 53 122 0" fill="var(--orange-soft)" stroke="var(--orange)" stroke-width="3"/><ellipse cx="75" cy="44" rx="61" ry="18" fill="#fff" stroke="var(--orange)" stroke-width="3"/>'}<ellipse cx="67" cy="${personal ? 60 : 42}" rx="15" ry="7" fill="var(--teal)"/><ellipse cx="88" cy="${personal ? 64 : 46}" rx="12" ry="6" fill="var(--orange)"/><ellipse cx="52" cy="${personal ? 66 : 48}" rx="10" ry="5" fill="var(--purple)"/></svg>`;
}

function labDevice(s: State, v: View): string {
  const value = v.labPreview ?? s.labs.values[v.lab] ?? 0;
  const heading = (title: string) => `<h2 class="tracing-device-heading">${title}</h2>`;
  const result = (text: string, changed: boolean, compact = text) => `<p class="device-result tracing-device-result ${changed ? 'is-observed' : ''}">${icon(changed ? 'check' : 'search', 20)}<span class="tracing-result-full">${text}</span><span class="tracing-result-compact">${compact}</span></p>`;
  switch (v.lab) {
    case 'contact':
      return `${heading('손에서 물건으로, 다시 다른 손으로')}
        <div class="tracing-device-art tracing-contact">${DATA.p05.nodes.map((x, i) => `<div class="tracing-contact-node ${i <= v.demoStep ? 'observed' : ''}"><span class="tracing-contact-order">${i + 1}</span>${icon(nodeIcons[i], 66)}<b><span class="tracing-contact-name">${NODE_NAMES[x]}</span><span class="tracing-contact-short">${['책', 'A의 손', '공', 'B의 손', '손잡이', 'C의 손'][i]}</span></b>${i < 5 ? `<span class="tracing-contact-arrow" aria-hidden="true">${icon('arrow', 23)}</span>` : ''}</div>`).join('')}</div>
        ${result('늦게 손을 씻어도 이미 다른 물체에 옮겨진 흔적은 남아요.', s.labs.done.includes('contact'), '옮겨진 흔적은 남아요.')}`;
    case 'droplet':
      return `${heading('옷소매로 입과 코를 가리면?')}<div class="tracing-device-art">${coughFigure(!!value)}</div>
        <div class="tracing-device-action">${btn(`${icon(value ? 'undo' : 'air', 22)} ${value ? '가리기 전 보기' : '옷소매로 입·코 가리기'}`, 'lab-set', value ? 'primary small' : 'secondary', `data-id="droplet" data-value="${value ? 0 : 1}"`)}</div>
        ${result(value ? '흔적이 퍼지는 범위가 줄었어요.' : '옷소매로 가리기 전후를 비교해요.', !!value, value ? '흔적 범위가 줄었어요.' : '가리기 전후를 비교해요.')}`;
    case 'air':
      return `${heading('창문을 열면 무엇이 달라질까요?')}
        <div class="tracing-device-art tracing-room"><div class="window-demo tracing-window ${value ? 'open' : ''}" data-gesture="window" aria-label="오른쪽으로 밀어 여는 창문"><div class="window-sky"></div><div class="tracing-outdoor" aria-hidden="true"><i></i><i></i><i></i></div><div class="window-frame"><div class="window-pane"></div></div><div class="air-streams" aria-hidden="true">${icon('arrow', 70)}${icon('arrow', 70)}${icon('arrow', 70)}</div><span class="window-handle"></span></div></div>
        <div class="tracing-device-action device-controls tracing-device-controls">${btn('닫기', 'lab-set', !value ? 'small selected' : 'small', 'data-id="air" data-value="0" aria-label="창문 닫힘"')}<input aria-label="창문 열기" type="range" min="0" max="1" step="1" data-range="window" value="${value}">${btn('열기', 'lab-set', value ? 'small selected' : 'small', 'data-id="air" data-value="1" aria-label="창문 열기"')}</div>
        ${result(value ? '열린 창문으로 공기 흐름이 생겼어요.' : '손잡이를 오른쪽으로 밀어 열어요.', !!value, value ? '공기 흐름이 생겨요.' : '손잡이를 밀어 열어요.')}`;
    case 'water':
      return `${heading('맑아 보이면 모두 괜찮을까요?')}
        <div class="tracing-device-art water-options tracing-water-options"><button class="water-card ${value === 1 ? 'selected' : ''}" data-action="water" data-id="1" aria-pressed="${value === 1}">${waterGlass()}<strong>관리 기록이 확인된 물</strong><small>${icon('file', 18)} 학교에서 공급·관리</small></button><button class="water-card ${value === 2 ? 'selected' : ''}" data-action="water" data-id="2" aria-pressed="${value === 2}">${waterGlass()}<strong>출처가 확인되지 않은 물</strong><small>${icon('search', 18)} 어디서 담았는지 몰라요</small></button></div>
        ${result(value === 1 ? '공급·관리 정보를 근거로 골랐어요.' : value === 2 ? '투명해도 안전한지 알 수 없어요.' : '두 물의 겉모습보다 관리 정보를 살펴봐요.', value === 1, value === 1 ? '관리 정보를 확인했어요.' : '관리 정보를 살펴봐요.')}`;
    case 'synthesis':
      return `${heading('닫힌 교실에서 기침한다면?')}<div class="tracing-device-art tracing-synthesis-scene"><span class="tracing-synthesis-window">${icon('window', 90)}<b>닫힌 창문</b></span>${coughFigure(false)}</div>
        <div class="tracing-device-action tracing-synthesis-choices">${['coughEtiquette', 'ventilation', 'washHands'].map(id => btn(`${icon(s.labs.synthesis.includes(id) ? 'check' : id === 'ventilation' ? 'window' : id === 'coughEtiquette' ? 'air' : 'hand', 25)}<span>${actionName(id)}</span>`, 'synthesis', s.labs.synthesis.includes(id) ? 'small selected' : 'small', `data-id="${id}" aria-pressed="${s.labs.synthesis.includes(id)}"`)).join('')}</div>${result(synthesisReady(s.labs.synthesis) ? '기침 예절과 환기는 각각의 상황을 바꿔요.' : '기침과 닫힌 공간을 각각 바꾸는 두 행동을 골라요.', synthesisReady(s.labs.synthesis))}`;
    default:
      return `${heading('공용 음식은 어떻게 덜어 먹을까요?')}
        <div class="tracing-device-art serving-demo tracing-serving ${value ? 'separated' : ''}"><div class="shared-bowl">${bowlSvg()}<b>공용 음식</b></div><div class="serving-tool" draggable="true" data-drag="serving" data-id="serve">${icon('plate', 38)}<span>덜기 도구</span>${icon('arrow', 24)}</div><button class="personal-plate" data-action="lab-set" data-id="saliva" data-value="1" data-drop="serving">${value ? bowlSvg(true) : '<span class="tracing-empty-plate" aria-hidden="true"></span>'}<b>개인 접시</b></button></div>
        <div class="tracing-device-action">${btn(`${icon(value ? 'check' : 'arrow', 20)} 개인 접시에 덜기`, 'lab-set', 'primary small', 'data-id="saliva" data-value="1"')}</div>
        ${result(value ? '개인 숟가락과 공용 음식의 접촉이 줄었어요.' : '덜기 도구를 접시로 끌어 놓아도 돼요.', !!value, value ? '접촉이 줄었어요.' : '덜기 도구를 써요.')}`;
  }
}
