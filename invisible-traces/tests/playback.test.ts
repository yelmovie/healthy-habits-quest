import test from 'node:test';
import assert from 'node:assert/strict';
import { demonstrationSteps, playbackDelay, playbackSpeed } from '../src/simulation/playback';
import { fixtureFor, placementKey } from '../src/simulation/model';

const ready = () => fixtureFor(5, { sound: false, reduced: true, large: false });
test('automatic demonstrations do not answer water, synthesis, evidence or comparison questions', () => {
  const s = ready(), before = structuredClone(s);
  assert.deepEqual(demonstrationSteps(s, 'lab', 'water'), []);
  assert.deepEqual(demonstrationSteps(s, 'lab', 'synthesis'), []);
  assert.deepEqual(demonstrationSteps(s, 'comparison'), []);
  assert.equal(demonstrationSteps(s, 'scan').length, 6);
  assert.deepEqual(s, before);
});
test('automatic practice follows only unapplied actions from the chosen plan', () => {
  const s = ready();
  s.strategy.placements = [{ site: 'classroom', actionId: 'ventilation' }, { site: 'gym', actionId: 'washHands' }];
  assert.deepEqual(demonstrationSteps(s, 'apply'), []);
  s.final.phase = 'apply';
  s.final.applied = [placementKey(s.strategy.placements[0])];
  s.final.hands = ['palm'];
  assert.deepEqual(demonstrationSteps(s, 'apply'), [
    { type: 'hand', key: 'gym:washHands', zone: 'back' },
    { type: 'hand', key: 'gym:washHands', zone: 'fingers' },
  ]);
});
test('playback speed rejects invalid rates and scales observation time predictably', () => {
  assert.equal(playbackDelay(.5), 2000);
  assert.equal(playbackDelay(1), 1000);
  assert.equal(playbackDelay(2), 500);
  for (const value of [0, -1, Infinity, NaN, 3]) assert.equal(playbackSpeed(value), 1);
});
