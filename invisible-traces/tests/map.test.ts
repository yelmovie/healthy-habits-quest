import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EDGES, MAP_SIZE, NODES, PLACES, START_NODE, nearestOnRoad, placeAt, placeHit, pointAlong, routeBetween, routeLength, step } from '../src/game/school-map';

const near = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y) < .01;

test('지도 자료: 모든 길과 장소가 그림 안에 있고 다섯 미션이 순서대로 있다', () => {
  assert.equal(PLACES.length, 5);
  for (const [a, b] of EDGES) assert.ok(NODES[a] && NODES[b], `${a}-${b} 길의 끝점이 있어야 해요`);
  for (const p of Object.values(NODES)) assert.ok(p.x > 0 && p.y > 0 && p.x < MAP_SIZE.width && p.y < MAP_SIZE.height);
  for (const place of PLACES) assert.ok(NODES[place.node], `${place.name}의 길 지점이 있어야 해요`);
});

test('길 찾기: 시작점에서 다섯 장소 모두에 닿고 끝점이 장소와 같다', () => {
  for (const place of PLACES) {
    const route = routeBetween(NODES[START_NODE], NODES[place.node]);
    assert.ok(near(route.at(-1)!, NODES[place.node]), `${place.name}까지 닿아야 해요`);
    for (const p of route) assert.ok(nearestOnRoad(p).gap < .01, '경로는 길을 벗어나지 않아요');
  }
});

test('길 찾기: 장소끼리 어느 쪽으로든 이동할 수 있다', () => {
  for (const a of PLACES) for (const b of PLACES) {
    const route = routeBetween(NODES[a.node], NODES[b.node]);
    assert.ok(near(route[0], NODES[a.node]) && near(route.at(-1)!, NODES[b.node]), `${a.name} → ${b.name}`);
  }
});

test('길 찾기: 길 중간에서 시작해도 가까운 쪽으로 돈다', () => {
  const mid = { x: (NODES.plazaMid.x + NODES.plazaNorth.x) / 2, y: (NODES.plazaMid.y + NODES.plazaNorth.y) / 2 };
  const toSignal = routeBetween(mid, NODES.signal), toGate = routeBetween(mid, NODES.gate);
  assert.ok(routeLength(toSignal) < routeLength(routeBetween(NODES.gate, NODES.signal)));
  assert.ok(toGate.some(p => near(p, NODES.plazaMid)));
  assert.ok(!toGate.some(p => near(p, NODES.plazaNorth)), '돌아가지 않고 곧장 내려가요');
});

test('같은 길 위의 두 점은 곧장 잇는다', () => {
  const a = { x: 430, y: 360 }, b = nearestOnRoad({ x: 440, y: 352 }).point;
  assert.equal(routeBetween(a, b).length, 2);
});

test('pointAlong: 경로를 따라 움직이고 끝을 넘지 않는다', () => {
  const route = routeBetween(NODES.gate, NODES.gym), total = routeLength(route);
  assert.ok(near(pointAlong(route, 0), route[0]));
  assert.ok(near(pointAlong(route, total + 50), NODES.gym));
  assert.ok(nearestOnRoad(pointAlong(route, total / 2)).gap < .01);
});

test('방향 걷기: 어떤 방향으로 오래 눌러도 길을 벗어나지 않는다', () => {
  for (const dir of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }]) {
    let p = NODES.hub;
    for (let i = 0; i < 400; i++) { p = step(p, dir, 3); assert.ok(nearestOnRoad(p).gap < .01); }
  }
});

test('방향 걷기: 정문에서 위로 누르면 광장 쪽으로 가고 아래로는 나가지 않는다', () => {
  const up = step(NODES.gate, { x: 0, y: -1 }, 10);
  assert.ok(up.y < NODES.gate.y);
  assert.ok(near(step(NODES.gate, { x: 0, y: 1 }, 10), NODES.gate), '정문 밖으로는 못 나가요');
});

test('방향 걷기: 갈림길을 지나쳐도 멈추지 않고 입력 쪽 길로 들어선다', () => {
  let p = NODES.plazaNorth;
  for (let i = 0; i < 200; i++) p = step(p, { x: 1, y: 0 }, 3);
  assert.ok(p.x > NODES.main.x, '오른쪽을 계속 누르면 광장에서 동쪽 길까지 이어져요');
});

test('방향 걷기: 입력이 없으면 움직이지 않는다', () => {
  assert.deepEqual(step(NODES.hub, { x: 0, y: 0 }, 10), NODES.hub);
});

test('장소 판정: 길 지점 근처에서만 장소로 본다', () => {
  PLACES.forEach((place, i) => assert.equal(placeAt(NODES[place.node]), i));
  assert.equal(placeAt(NODES.gate), -1);
});

test('건물 누르기: 그림의 건물 영역이 해당 장소로 이어진다', () => {
  assert.equal(placeHit({ x: 250, y: 220 }), 1);
  assert.equal(placeHit({ x: 620, y: 120 }), 2);
  assert.equal(placeHit({ x: 760, y: 420 }), 4);
  assert.equal(placeHit({ x: 20, y: 520 }), -1);
});
