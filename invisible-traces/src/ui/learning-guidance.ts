import { icon } from './icons';
import { DATA, PAGES } from '../data/game';
import { nextPlacement, type State } from '../simulation/model';
import type { View } from './render';

// Keep the instruction tied to the learner's state without identifying an answer.
export function nextInstruction(s: State, v: View): string {
  if (s.completed.includes(s.route) && s.route !== 'P10') return '조사를 마쳤어요.';
  switch (s.route) {
    case 'P01': return '돋보기를 움직이거나 보랏빛을 눌러요.';
    case 'P02': return v.replacement ? '단서함에서 바꿀 단서를 눌러요.'
      : s.clues.length === 5 ? '사건과 연결되는 단서인지 비교해요.' : '그림을 눌러 사건의 단서 5개를 모아요.';
    case 'P03': return v.clue ? '이 단서와 이어지는 생활 상황을 눌러요.' : '연결할 단서를 골라요.';
    case 'P04': return '카드 속 일이 누구에게 생길지 그림을 골라요.';
    case 'P05':
      if (s.timeline.source !== 'book') return s.timeline.tick > 0 ? '시간 막대를 0으로 옮겨요.' : '처음 흔적이 보이는 물체를 눌러요.';
      return s.timeline.tried.length === 0 ? '물방울을 눌러 손 씻을 때를 골라요.' : '다른 때도 눌러 남은 흔적 수를 비교해요.';
    case 'P06': {
      if (v.lab === 'synthesis') return '닫힌 교실에서 기침이 나면? 바꿀 그림 두 곳을 골라요.';
      if (s.labs.done.includes(v.lab) || v.lab === 'contact') return '그림을 다시 보거나 다음 실험으로 가요.';
      const instructions: Record<string, string> = {
        droplet: '기침하는 친구를 눌러 전후 모습을 비교해요.',
        air: '창문을 눌러 열기 전과 후를 비교해요.',
        water: '관리 정보를 보고 마실 물을 골라요.',
        saliva: '도구를 끌거나 개인 접시를 눌러요.',
      };
      return instructions[v.lab] ?? '살펴볼 실험을 골라요.';
    }
    case 'P07': return s.experiment.action ? '내 예상을 골라요.' : '그림에서 바꿀 곳 하나를 눌러요.';
    case 'P08': {
      const action = DATA.p07.actionPool.find(a => a.id === s.experiment.action);
      const event = DATA.p07.events.find(e => e.id === action?.differenceEvent);
      if (!event) return '조건 실험실에서 행동을 먼저 골라요.';
      if (s.experiment.tick < event.time) return '재생하거나 시간 막대를 움직여요.';
      if (s.experiment.explanation) return '처음 예상과 비교해 돌아봐요.';
      return s.experiment.pinned ? '그림에서 어떻게 달라졌는지 골라요.' : 'A와 B를 비교해 B에서 달라진 곳을 눌러요.';
    }
    case 'P09': return v.action ? '행동을 놓을 장소를 눌러요.'
      : s.strategy.simulated ? '남은 연결을 보고 배치를 바꿔요.'
        : s.strategy.placements.length ? '더 배치하거나 작전을 실행해요.' : '장소 그림을 보고 아래 행동을 골라요.';
    case 'P10': {
      if (s.final.phase === 'report') return '그림으로 내 계획을 확인해요.';
      const placement = nextPlacement(s);
      if (placement?.actionId === 'washHands') return '손 그림을 문지르거나 눌러요.';
      if (placement?.actionId === 'ventilation') return '창문을 누르거나 오른쪽으로 밀어요.';
      return '도구를 끌거나 접시를 눌러요.';
    }
    default: return '';
  }
}

export function recheckInstruction(s: State, v: View): string {
  switch(s.route) {
    case 'P02': return '그림 속 단서를 다시 눌러 그 장소와 행동을 살펴봐요. 지금 조사하는 상황과 연결되는 근거가 있는지 비교해요.';
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
  const modelNote = s.route === 'P06'
    ? '<p>접촉은 앞 실험에서 살펴봤어요. 비말과 공기 중 작은 입자는 함께 퍼질 수 있고, 병마다 전파 방식이 달라요.</p>' : '';
  const concept = s.route === 'P03' ? '창문 닫힘은 경로가 아니라 공기 흐름에 영향을 주는 조건이에요.' : page.concept.description;
  const reviewed = s.completed.includes(s.route);
  return `<header class="guide-head"><h2>관찰 힌트</h2></header>
  ${v ? `<p class="guide-goal">${recheckInstruction(s, v)}</p>` : ''}
  <details class="learning-standards"><summary>그림을 읽는 약속</summary><p>보라색은 옮겨 갈 수 있는 흔적을 나타내는 모형이에요. 실제 병원체나 감염 여부·확률을 나타내지 않아요.</p>${modelNote}</details>
  <details class="learning-standards"><summary>${reviewed?'활동에서 알아본 것':'활동 목표'}</summary><p>${page.learningObjectives.join(' ')}</p>${reviewed?`<p><b>${page.concept.term}</b> · ${concept}</p><p>${page.reflection}</p><p>${page.evidence}</p>`:''}</details>
  <details class="learning-standards"><summary>성취기준</summary><p>${page.standards.map(id => `${id} · ${DATA.standards.find(s => s.id === id)?.focus}`).join('<br>')}</p></details>`;
}

export function curriculumGuide(): string {
  return `<details class="learning-standards"><summary>페이지별 성취기준·확인할 배움</summary><div class="curriculum-pages">${PAGES.map(page => `<section><b>${page.id} · ${page.name}</b><small>${page.standards.join(' · ')}</small><p>${page.learningObjectives.join(' ')}</p><p>함께 이야기하기 · ${page.reflection}</p></section>`).join('')}</div></details>`;
}
