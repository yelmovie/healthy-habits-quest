import { icon } from './icons';
import { DATA, PAGES } from '../data/game';
import { nextPlacement, type State } from '../simulation/model';
import type { View } from './render';

// Keep the instruction tied to the learner's state without identifying an answer.
export function nextInstruction(s: State, v: View): string {
  if (s.completed.includes(s.route) && s.route !== 'P10') return '잘 관찰했어요. 다음 조사로 가요!';
  switch (s.route) {
    case 'P01': return '돋보기를 그림 위로 움직여 보라 빛이 숨은 곳을 찾아요.';
    case 'P02': return v.replacement ? '단서함에서 바꿀 단서를 눌러요.'
      : s.clues.length === 5 ? '단서함에서 관계가 먼 단서를 바꿔요.' : '장소를 바꿔 보며 관련 단서를 눌러 담아요.';
    case 'P03': return v.clue ? '이 단서와 이어지는 생활 상황을 눌러요.' : '연결할 단서를 골라요.';
    case 'P04': return '반짝이는 카드의 일이 누구에게 생길지 그림을 눌러요.';
    case 'P05':
      if (s.timeline.source !== 'book') return s.timeline.tick > 0 ? '시간 막대를 0으로 옮겨 처음을 살펴봐요.' : '처음 흔적이 있는 물체를 눌러요.';
      if (s.timeline.tried.length === 0) return '비누 방패를 넣을 때를 하나 골라요.';
      return s.timeline.tried.includes(1.5) ? '다른 때에도 넣어 흔적 수를 비교해요.' : '더 일찍 씻으면 흔적이 줄어들까요?';
    case 'P06': {
      if (v.lab === 'synthesis') return '관찰한 기록을 떠올리며 다른 흔적을 줄일 행동 두 개를 골라요.';
      if (s.labs.done.includes(v.lab)) return '다음 실험 버튼을 눌러 다른 경로도 살펴봐요.';
      const instructions: Record<string, string> = {
        contact: '다음 실험 버튼을 눌러 다른 경로를 살펴봐요.',
        droplet: '옷소매를 기침하는 친구의 입으로 끌어 흔적 범위를 비교해요.',
        air: '열기를 눌러 창문 전후를 비교해요.',
        water: '관리 정보를 읽고 마실 물을 골라요.',
        saliva: '개인 접시에 덜기를 눌러 도구의 역할을 봐요.',
      };
      return instructions[v.lab] ?? '살펴볼 실험을 골라요.';
    }
    case 'P07': return s.experiment.action ? '흔적이 어떻게 달라질지 예측을 눌러요.' : '바꿔 볼 행동 하나를 눌러요.';
    case 'P08': {
      const action = DATA.p07.actionPool.find(a => a.id === s.experiment.action);
      const event = DATA.p07.events.find(e => e.id === action?.differenceEvent);
      if (!event) return '조건 실험실에서 행동을 먼저 골라요.';
      if (s.experiment.tick < event.time) return '자동재생이나 시간 막대로 두 하루를 관찰해요.';
      return s.experiment.pinned ? '달라진 결과 카드 중 알맞은 것을 골라요.' : 'B 그림에서 달라진 곳을 눌러 표시해요.';
    }
    case 'P09': return v.action ? '고른 행동을 놓을 장소 그림을 눌러요.'
      : !s.strategy.placements.length ? '장소의 설명을 읽고 행동 카드를 눌러요.'
        : s.strategy.simulated ? '남은 연결을 살펴보고 배치를 고쳐요.' : '장소마다 행동을 놓은 뒤 작전 실행을 눌러요.';
    case 'P10': {
      if (s.final.phase === 'report') return '내 계획을 보고 직접 실천하기를 눌러요.';
      const placement = nextPlacement(s);
      if (placement?.actionId === 'washHands') return '손바닥·손등·손가락 사이 카드를 쓱쓱 문질러요.';
      if (placement?.actionId === 'ventilation') return '창문을 오른쪽으로 밀어 열어요.';
      return '공용 음식을 개인 접시로 끌거나 접시를 눌러 덜어요.';
    }
    default: return '';
  }
}

const LAB_CONCEPTS: Record<string, { term: string; description: string }> = {
  contact: { term: '접촉', description: '손·물건을 거쳐 옮겨진 병원체가 눈·코·입으로 들어갈 수 있어요.' },
  droplet: { term: '비말', description: '기침할 때 튀는 작은 침방울이에요. 옷소매로 입과 코를 가려요.' },
  air: { term: '환기', description: '공기 중에 머물 수 있는 병원체를 줄이도록 바깥 공기와 바꿔요.' },
  water: { term: '안전한 물', description: '맑아 보여도 병원체가 있을 수 있어요. 공급·관리 정보를 확인해요.' },
  saliva: { term: '타액', description: '입속의 침이에요. 침이 묻은 개인 식기가 공용 음식에 닿지 않게 해요.' },
  synthesis: { term: '함께 예방', description: '기침에서 나오는 흔적과 실내에 머무는 흔적을 함께 생각해요.' },
};

export function learningFocus(s: State, v: View): string {
  if (s.route === 'P10' && ['restored', 'ending', 'certificate'].includes(s.final.phase)) return '';
  const page = PAGES.find(p => p.id === s.route);
  if (!page) return '';
  let concept = s.route === 'P06' ? LAB_CONCEPTS[v.lab] ?? page.concept : page.concept;
  if (s.route === 'P10' && s.final.phase === 'apply' && nextPlacement(s)?.actionId === 'washHands') {
    concept = { term: '30초 이상', description: '실제로는 비누와 흐르는 물로 씻어요. 엄지·손끝·손톱 밑도 꼼꼼히!' };
  }
  return `<aside class="learning-focus" aria-label="이 활동의 핵심 개념"><mark>${concept.term}</mark><span>${concept.description}</span></aside>`;
}

export function recheckInstruction(s: State, v: View): string {
  switch(s.route) {
    case 'P02': return '단서함을 눌러 남길 카드의 장소와 행동을 다시 읽어요. 지금 조사하는 상황과 연결되는 근거가 있는지 비교해요.';
    case 'P03': case 'P04': return '카드를 눌러 관찰 문장을 다시 읽어요. 고른 생활 장면에서 같은 변화가 있는지 살펴봐요.';
    case 'P05': case 'P08': return '시간 막대를 움직여 앞뒤 장면의 같은 곳을 봐요. 흔적이 나타난 곳과 사라진 곳을 비교해요.';
    case 'P06': return '살펴본 실험의 처음과 결과를 비교해요. 어떤 조건을 바꿨고 흔적이 어디까지 남았는지 확인해요.';
    case 'P07': return '두 하루의 조건을 다시 읽어요. 내가 바꾼 행동이 어느 장면에 영향을 줄지 생각해요.';
    case 'P09': return '작전 실행 뒤 남은 연결을 봐요. 장소와 행동 카드를 다시 눌러 어떤 연결이 유지됐는지 비교해요.';
    default: return nextInstruction(s,v);
  }
}

export function learningGuide(s: State, v?: View): string {
  const page = PAGES.find(p => p.id === s.route);
  if (!page) return '';
  // 팝업은 카드 두 장(다시 볼 단서·내 말로 설명)만 펼쳐 두고, 긴 약속·성취기준은 접어 둔다.
  return `<header class="guide-head"><span class="guide-chip">${icon('flag', 16)}미션 ${Number(page.stage.slice(1))} · ${page.name}</span><h2>이 활동에서 알아볼 것</h2><p class="guide-goal">${page.learningObjectives.join(' ')}</p></header>
  <div class="guide-cards">${v ? `<section class="guide-card look"><b>${icon('search', 20)}다시 볼 단서</b><p>${recheckInstruction(s, v)}</p></section>` : ''}<section class="guide-card talk"><b>${icon('voice', 20)}내 말로 설명해요</b><p>${page.reflection}</p></section></div>
  <p class="guide-note">${page.evidence}</p>
  <details class="learning-standards"><summary>그림을 읽는 약속</summary><p>보라색 흔적과 그림은 생활 속 연결을 관찰하는 모형이에요. 실제 입자 수나 감염 여부·확률을 나타내지 않아요. 병원체마다 옮겨 가는 방법이 달라요.</p><p>자동재생은 시간에 따른 변화를 보여줘요. 단서·예측·해석·대응 계획과 실천은 직접 해요.</p></details>
  <details class="learning-standards"><summary>연결된 성취기준</summary><p>${page.standards.map(id => `${id} · ${DATA.standards.find(s => s.id === id)?.focus}`).join('<br>')}</p></details>`;
}

export function curriculumGuide(): string {
  return `<details class="learning-standards"><summary>페이지별 성취기준·확인할 배움</summary><div class="curriculum-pages">${PAGES.map(page => `<section><b>${page.id} · ${page.name}</b><small>${page.standards.join(' · ')}</small><p>${page.learningObjectives.join(' ')}</p><p>함께 이야기하기 · ${page.reflection}</p></section>`).join('')}</div></details>`;
}
