import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '../src/data/game';
import { fresh } from '../src/simulation/model';
import type { View } from '../src/ui/render';
import { learningFocus, learningGuide, nextInstruction } from '../src/ui/learning-guidance';
import { comparisonBoard, comparisonTasks, strategyPages } from '../src/ui/stages-strategy';
import { tracingPages } from '../src/ui/stages-tracing';

const viewFresh = (): View => ({ lab: 'contact', clue: '', effect: '', replacement: '', action: '' } as View);

test('학습 10장에 성취기준, 목표, 관찰 증거와 설명 질문이 있다', () => {
  for (const page of DATA.pages) {
    assert.ok(page.standards.every(id => DATA.standards.some(s => s.id === id)));
    assert.ok(page.learningObjectives.length > 0);
    assert.ok(page.concept.term && page.concept.description && page.reflection && page.evidence);
    const s = fresh(); s.route = page.id as typeof s.route;
    assert.match(learningFocus(s, viewFresh()), /<mark>/);
    assert.ok(learningGuide(s).includes(page.standards[0]));
  }
});

test('단서와 영향 연결은 선택 전후에 맞는 다음 조작을 알려준다', () => {
  const s = fresh(), v = viewFresh(); s.route = 'P03';
  assert.match(nextInstruction(s, v), /단서를 골라/);
  v.clue = 'CL01'; assert.match(nextInstruction(s, v), /생활 상황/);
  s.route = 'P04'; assert.match(nextInstruction(s, v), /영향 카드/);
  v.effect = 'FX01'; assert.match(nextInstruction(s, v), /생활 영역/);
});

test('실험 안내는 현재 실험의 조작과 완료 뒤 이동을 구별한다', () => {
  const s = fresh(), v = viewFresh(); s.route = 'P06'; v.lab = 'air';
  assert.match(nextInstruction(s, v), /열기/);
  s.labs.done.push('air'); assert.match(nextInstruction(s, v), /다음 실험/);
  s.route = 'P05'; s.timeline.tick = 5;
  assert.match(nextInstruction(s, v), /0/);
  s.timeline.tick = 0; assert.match(nextInstruction(s, v), /처음 흔적/);
});

test('손 씻기 결과는 접촉 횟수 감소로 설명하지 않는다', () => {
  const s = fresh(); s.route = 'P08'; s.experiment.action = 'washHands'; s.experiment.tick = 5;
  assert.doesNotMatch(comparisonTasks(s), /손 → 물건의 접촉 감소/);
  assert.match(comparisonTasks(s), /손에서 옮겨 가는 흔적 감소/);
});

test('시간 추적의 질문 문구가 기존 음성과 일치한다', () => {
  const s = fresh(); s.route = 'P05';
  const text = tracingPages(s, viewFresh()).replace(/<[^>]+>/g, '');
  assert.ok(text.includes('흔적이 시작된 곳을 고르고, 손 씻을 때를 바꿔요.'));
});

test('예측과 비교의 장소를 유지하고 두 하루에 같은 배경을 쓴다', () => {
  const s = fresh(); s.route = 'P07';
  assert.match(strategyPages(s, viewFresh()), /meal-20261110.webp/);
  for (const action of DATA.p07.actionPool) {
    s.experiment.action = action.id;
    assert.equal((comparisonBoard(s).match(/class="compare-image" src="\/assets\/meal-20261110.webp"/g) ?? []).length, 2);
  }
});
