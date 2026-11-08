import test from 'node:test';
import assert from 'node:assert/strict';
import { tracingPages, synthesisReady } from '../src/ui/stages-tracing';
import { fresh } from '../src/simulation/model';
import type { View } from '../src/ui/render';
test('기침 종합은 아무 두 행동이 아니라 기침 예절과 환기를 확인한다', () => {
  assert.equal(synthesisReady(['washHands', 'ventilation']), false);
  assert.equal(synthesisReady(['coughEtiquette', 'washHands']), false);
  assert.equal(synthesisReady(['coughEtiquette', 'ventilation']), true);
});
test('물 출처 비교는 동일한 생성 이미지로 외형 정답 단서를 주지 않는다', () => {
  const s = fresh(); s.route = 'P06';
  const html = tracingPages(s, { lab: 'water', playing: false } as View);
  assert.equal((html.match(/src="\/assets\/water-glass-20261108.webp"/g) || []).length, 2);
  assert.match(html, /출처가 확인되지 않은 물/);
});

test('기침 두 상태는 독립 그림을 바꾸고 비말은 DOM 모형으로 유지한다', () => {
  const s = fresh(); s.route = 'P06';
  const before = tracingPages(s, { lab: 'droplet', labPreview: 0 } as View);
  const after = tracingPages(s, { lab: 'droplet', labPreview: 1 } as View);
  assert.match(before, /cough-before-20261108.webp/);
  assert.doesNotMatch(before, /cough-covered-20261108.webp/);
  assert.match(after, /cough-covered-20261108.webp/);
  for (const html of [before, after]) {
    assert.match(html, /tracing-cough-path/);
    assert.equal((html.match(/<i><\/i>/g) || []).length, 5);
    assert.match(html, /data-action="lab-set"/);
    assert.match(html, /함께 있는 친구/);
  }
});
