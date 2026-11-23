import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from '../src/data/game';
import {fresh,fixtureFor,derive,sanitize,addPlacement} from '../src/simulation/model';
import {observationPages} from '../src/ui/stages-observation';
import type {View} from '../src/ui/render';
const viewFresh=():View=>({site:'classroom',lab:'contact',clue:'',effect:'',replacement:'',action:''} as View);
import {comparisonBoard,strategySceneHint} from '../src/ui/stages-strategy';

test('가득 찬 단서함은 관계가 먼 단서만 강조하고 고른 단서는 보존한다',()=>{
 const s=fixtureFor(2,{});s.route='P02';s.clues=[...DATA.p02.requiredClues.slice(0,4),'CL06'];derive(s);
 const before=structuredClone(s.clues),html=observationPages(s,viewFresh());
 const highlighted=[...html.matchAll(/class="evidence-slot filled [^"]*needs-recheck[^"]*"[^>]*data-id="([^"]+)"/g)].map(m=>m[1]);
 assert.deepEqual(highlighted,['CL06']);assert.deepEqual(s.clues,before);assert.ok(!s.completed.includes('P02'));
 s.clues=s.clues.map(c=>c==='CL06'?DATA.p02.requiredClues[4]:c);derive(s);assert.ok(s.completed.includes('P02'));
 assert.doesNotMatch(observationPages(s,viewFresh()),/needs-recheck/);
});

test('예측 세 가지와 돌아보기 세 가지는 정오 판정 없이 비교 기록을 완성한다',()=>{
 for(const prediction of ['fewer','same','unsure'])for(const reflection of ['matched','different','unsure']){
  const s=fixtureFor(4,{});s.route='P08';s.experiment={action:'washHands',prediction,tick:5,pinned:'before-meal',explanation:'hand-object-contact',baselineSeen:true,reflection:''};
  derive(s);assert.ok(s.completed.includes('P07'));assert.ok(!s.completed.includes('P08'));
  assert.ok(comparisonBoard(s).includes({fewer:'줄어들 것 같아요',same:'비슷할 것 같아요',unsure:'아직 모르겠어요'}[prediction]!));
  s.experiment.reflection=reflection;derive(s);assert.ok(s.completed.includes('P08'));assert.equal(s.experiment.prediction,prediction);
  const restored=sanitize(s);assert.equal(restored.experiment.reflection,reflection);assert.ok(restored.evidence.includes('E4'));
 }
});

test('기존 완료 기록과 인증서 단계는 새 돌아보기 항목이 없어도 유지한다',()=>{
 const s=fixtureFor(5,{});delete s.experiment.reflection;derive(s);
 const restored=sanitize(s);assert.deepEqual(restored.evidence,s.evidence);assert.ok(restored.completed.includes('P08'));
 restored.strategy.placements=[{site:'classroom',actionId:'ventilation'},{site:'cafeteria',actionId:'portionFood'},{site:'gym',actionId:'washHands'}];restored.strategy.simulated=true;
 restored.final.applied=restored.strategy.placements.map(p=>`${p.site}:${p.actionId}`);restored.final.phase='certificate';derive(restored);
 assert.equal(sanitize(restored).final.phase,'certificate');assert.ok(sanitize(restored).completed.includes('P10'));
});

test('부분 진행·잘못된 돌아보기는 비교를 완료시키지 않는다',()=>{
 const s=fixtureFor(4,{});s.experiment={action:'washHands',prediction:'same',tick:5,pinned:'before-meal',explanation:'hand-object-contact',baselineSeen:true,reflection:'invalid'};
 assert.ok(!derive(s).completed.includes('P08'));assert.equal(sanitize(s).experiment.reflection,'');
 const old=fresh();delete old.experiment.reflection;assert.equal(sanitize(old).experiment.reflection,'');
});

test('잘못 놓은 행동은 기존 계획을 보존하고 대상 장면의 단서 하나로 돌아간다',()=>{
 const s=fixtureFor(5,{});assert.equal(addPlacement(s,{site:'cafeteria',actionId:'portionFood'}),'ok');const before=structuredClone(s.strategy.placements);
 assert.equal(addPlacement(s,{site:'gym',actionId:'ventilation'}),'wrong-site');assert.deepEqual(s.strategy.placements,before);
 assert.match(strategySceneHint('gym'),/음식을 먹기 전의 손/);assert.doesNotMatch(strategySceneHint('gym'),/손 씻기|환기|덜어 먹기/);
});
