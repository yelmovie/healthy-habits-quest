import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ownedRewardCards,wonRewardCards} from '../src/reward-card-set';

test('성취 카드는 악당을 세 번 맞힌 장소만 가진 것으로 본다',()=>{
 assert.deepEqual(ownedRewardCards(undefined),[false,false,false,false,false]);
 assert.deepEqual(ownedRewardCards({'0':3,'1':2,'3':3}),[true,false,false,true,false]);
});
test('타격 수가 3이 되는 순간에만 카드를 얻는다',()=>{
 assert.deepEqual(wonRewardCards({'0':2},{'0':3}),[0]);
 assert.deepEqual(wonRewardCards(undefined,{'2':1}),[]);
 // 지도는 그 방문의 타격을 매번 다시 넘겨 주므로, 앞서 얻은 카드가 다시 나오면 안 된다.
 assert.deepEqual(wonRewardCards({'0':3,'1':2},{'0':3,'1':3}),[1]);
 assert.deepEqual(wonRewardCards({'4':3},{'4':3}),[]);
});
