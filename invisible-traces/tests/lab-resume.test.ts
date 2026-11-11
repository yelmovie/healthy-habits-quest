import test from 'node:test';
import assert from 'node:assert/strict';
import { fresh, sanitize } from '../src/simulation/model';

test('실험 선택은 저장 복원 뒤에도 유지된다', () => {
  for (const active of ['contact', 'droplet', 'air', 'water', 'saliva', 'synthesis']) {
    const state = fresh();
    const saved = { ...state, labs: { ...state.labs, active } };
    assert.equal(sanitize(saved).labs.active, active);
  }
});

test('이전 저장과 잘못된 실험 선택은 접촉 실험으로 복원한다', () => {
  const state = fresh();
  for (const active of [undefined, null, 'missing', 1]) {
    const saved = { ...state, labs: { ...state.labs, active } };
    assert.equal(sanitize(saved).labs.active, 'contact');
    assert.deepEqual(sanitize(saved).labs.done, state.labs.done);
  }
});
