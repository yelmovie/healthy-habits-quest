import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATA, LABS } from '../src/data/game';
import { fresh, derive, contactAt, addPlacement, planResult, planCost, sanitize, canEnter, fixtureFor, applyPlacement, placementKey, nextPlacement, type State } from '../src/simulation/model';

const solvedPlan = () => [{ actionId: 'ventilation', site: 'classroom' }, { actionId: 'portionFood', site: 'cafeteria' }, { actionId: 'washHands', site: 'gym' }];
const roundTrip = (s: State) => sanitize(JSON.parse(JSON.stringify(s)));

test('되감기 모형: 손을 일찍 씻으면 이후 연결이 끊기고, 늦게 씻으면 이미 옮겨진 흔적은 남는다', () => {
  assert.deepEqual([...contactAt(0)], ['book']);
  const none = contactAt(5);
  for (const node of DATA.p05.nodes) assert.ok(none.has(node), `${node} 흔적이 이어져야 해요`);
  const early = contactAt(5, 1.5);
  assert.deepEqual([...early].sort(), ['book']);
  const late = contactAt(5, 2.5);
  assert.ok(!late.has('studentA'), '씻은 손의 흔적만 지워져요');
  assert.ok(late.has('ball') && late.has('door'), '이미 물체에 옮겨진 흔적은 남아요');
});

test('되감기 모형: 시간을 거꾸로 돌려도 같은 시각은 같은 결과다', () => {
  for (const tick of [0, 1, 1.5, 2.4, 3, 4.9, 5]) assert.deepEqual([...contactAt(tick, 2.5)], [...contactAt(tick, 2.5)]);
  assert.ok(!contactAt(0.9).has('studentA'));
  assert.ok(contactAt(1).has('studentA'));
});

test('작전 예산: 에너지 5를 넘거나 맞지 않는 장소·중복 배치는 거절한다', () => {
  const s = fresh();
  assert.equal(addPlacement(s, { actionId: 'ventilation', site: 'gym' }), 'wrong-site');
  assert.equal(addPlacement(s, { actionId: 'ventilation', site: 'classroom' }), 'ok');
  assert.equal(addPlacement(s, { actionId: 'ventilation', site: 'classroom' }), 'duplicate');
  assert.equal(addPlacement(s, { actionId: 'washHands', site: 'gym' }), 'ok');
  assert.equal(addPlacement(s, { actionId: 'portionFood', site: 'cafeteria' }), 'ok');
  assert.equal(planCost(s.strategy.placements), 5);
  assert.equal(addPlacement(s, { actionId: 'coughEtiquette', site: 'classroom' }), 'budget');
  assert.equal(s.strategy.placements.length, 3);
});

test('작전 예산: 행동을 빼면 에너지가 돌아오고 다시 배치할 수 있다', () => {
  const s = fresh();
  for (const p of solvedPlan()) addPlacement(s, p);
  s.strategy.placements = s.strategy.placements.filter(p => placementKey(p) !== 'gym:washHands');
  assert.equal(planCost(s.strategy.placements), 3);
  assert.equal(addPlacement(s, { actionId: 'personalItems', site: 'gym' }), 'ok');
  assert.equal(addPlacement(s, { actionId: 'coughEtiquette', site: 'classroom' }), 'ok');
  assert.equal(planCost(s.strategy.placements), 5);
  assert.equal(planResult(s.strategy.placements).success, false, '체육 공간의 손 씻기가 빠졌어요');
});

test('작전 결과: 세 장소의 핵심 행동이 모두 있어야 성공한다', () => {
  assert.equal(planResult(solvedPlan()).success, true);
  assert.deepEqual(planResult(solvedPlan().slice(0, 2)).resolved.sort(), ['cafeteria', 'classroom']);
});

test('최종 실천: 보이던 계획만 적용되고 연속 탭이 다음 계획을 적용하지 않는다', () => {
  const s = fixtureFor(5, fresh().settings);
  for (const p of solvedPlan()) addPlacement(s, p);
  s.strategy.simulated = true;
  derive(s);
  assert.ok(s.completed.includes('P09'));
  const first = placementKey(nextPlacement(s)!);
  assert.equal(applyPlacement(s, first), true);
  assert.equal(applyPlacement(s, first), false, '같은 버튼을 두 번 눌러도 한 번만 적용돼요');
  assert.equal(s.final.applied.length, 1);
  assert.equal(applyPlacement(s, 'gym:washHands'), false, '순서가 아닌 계획은 적용되지 않아요');
  for (let p = nextPlacement(s); p; p = nextPlacement(s)) applyPlacement(s, placementKey(p));
  derive(s);
  assert.ok(s.completed.includes('P10'));
  assert.equal(s.final.phase, 'restored');
  assert.equal(new Set(s.final.applied).size, s.final.applied.length);
});

test('저장 복구: 손상되거나 조작된 값은 버리고 허용된 값만 남긴다', () => {
  const s = fresh();
  const raw = { ...JSON.parse(JSON.stringify(s)), found: ['classroom', 'classroom', 'hacker', 3], clues: ['CL01', 'CL99', 'CL02', 'CL03', 'CL04', 'CL05', 'CL06'],
    relations: { CL02: 'contact', CL01: 'nowhere', '<img>': 'contact' }, timeline: { tick: 999, source: 'book', intervention: 2 },
    strategy: { asked: ['x'], placements: [{ actionId: 'ventilation', site: 'classroom' }, { actionId: 'ventilation', site: 'classroom' }, { actionId: 'washHands', site: 'cafeteria' }], simulated: true },
    route: 'P10', settings: { sound: 'yes', reduced: true, large: false } };
  const out = sanitize(raw);
  assert.deepEqual(out.found, ['classroom']);
  assert.equal(out.clues.length, 5);
  assert.ok(!out.clues.includes('CL99'));
  assert.deepEqual(out.relations, { CL02: 'contact' });
  assert.equal(out.timeline.tick, 5);
  assert.equal(out.timeline.intervention, null);
  assert.deepEqual(out.strategy.placements, [{ actionId: 'ventilation', site: 'classroom' }]);
  assert.equal(out.route, 'C01', '열리지 않은 장으로 바로 들어가지 않아요');
  assert.equal(out.settings.sound, true);
  assert.equal(out.settings.reduced, true);
});

test('저장 복구: 다른 버전 기록은 덮어쓰지 않도록 오류로 알린다', () => {
  assert.throws(() => sanitize({ version: 2 }));
  assert.throws(() => sanitize(null));
  assert.throws(() => sanitize({ ...fresh(), contentVersion: 'old' }));
});

test('저장 복구: 완료된 기록은 저장 후 다시 읽어도 그대로다', () => {
  for (let stage = 1; stage <= 5; stage++) {
    const s = fixtureFor(stage, fresh().settings);
    const back = roundTrip(s);
    assert.deepEqual(back.completed, s.completed, `미션 ${stage}`);
    assert.deepEqual(back.evidence, s.evidence, `미션 ${stage}`);
    assert.equal(back.route, s.route);
  }
});

test('진행 잠금: 앞 장을 끝내야 다음 장에 들어간다', () => {
  const s = fresh();
  assert.ok(canEnter(s, 'P01'));
  assert.ok(!canEnter(s, 'P02'));
  s.found = [...DATA.p01.requiredSites];
  derive(s);
  assert.ok(canEnter(s, 'P02'));
  assert.ok(!canEnter(s, 'P03'));
});

test('연구 기록: 단서 5개는 핵심 단서가 모두 있어야 인정된다', () => {
  const s = fresh();
  s.found = [...DATA.p01.requiredSites];
  s.clues = ['CL01', 'CL02', 'CL03', 'CL04', 'CL06'];
  derive(s);
  assert.ok(!s.evidence.includes('E1'));
  s.clues = [...DATA.p02.requiredClues];
  derive(s);
  assert.ok(s.evidence.includes('E1'));
});

test('시연 자료: 각 미션 시연은 앞 미션 기록을 모두 갖고 시작한다', () => {
  for (let stage = 1; stage <= 5; stage++) {
    const s = fixtureFor(stage, fresh().settings);
    assert.equal(s.evidence.length, stage - 1, `미션 ${stage}`);
    assert.ok(canEnter(s, s.route));
  }
  assert.equal(LABS.length, 5);
});

test('콘텐츠: 성취기준·장 구성·필수 단서가 비어 있지 않다', () => {
  assert.ok(Array.isArray(DATA.standards) && DATA.standards.length > 0);
  assert.equal(DATA.stages.length, 5);
  assert.equal(DATA.pages.length, 10);
  assert.ok(DATA.p02.requiredClues.every(id => DATA.clues.some(c => c.id === id)));
});

test('콘텐츠: 검수 상태와 출처가 데이터에 남아 있다', () => {
  // 교사 검수 전에는 needsReview 가 true 여야 한다. 검수 뒤에는 검토자와 날짜가 함께 있어야 한다.
  assert.equal(typeof DATA.review.needsReview, 'boolean');
  if (!DATA.review.needsReview) assert.ok(DATA.review.reviewedBy && DATA.review.reviewedAt);
  assert.ok(DATA.review.scope.length > 0);
  assert.ok(DATA.sources.curriculum.startsWith('https://') && DATA.sources.prevention.startsWith('https://'));
});
