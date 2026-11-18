import {createRewardCards,type RewardCards,type RewardSound} from './reward-cards.js';
import {PLACES} from './game/school-map';
import {asset} from './data/game';
import {icon} from './ui/icons';
import type {Cue} from './audio';

// 지도 악당 한 명에 성취 카드 한 장. 순서는 지도 장소 순번(mapHits 키 '0'~'4')이고, 별은 순서대로 1~5개가 붙는다.
const TITLES=['이상 신호 관찰 탐정','단서 연결 추리왕','감염 경로 추적 박사','손 씻기 비교 실험왕','건강 학교 수호 영웅'];
const CUES:Record<RewardSound,Cue>={whoosh:'cardWhoosh',reveal:'cardReveal',epic:'cardEpic',slot:'cardSlot',complete:'cardComplete'};
type Hits=Record<string,number>|undefined;
/** 악당을 세 번 맞혀 물리친 장소의 카드만 가진 것으로 본다. 따로 저장하는 값은 없다. */
export const ownedRewardCards=(hits:Hits)=>PLACES.map((_,i)=>hits?.[String(i)]===3);
/** 방금 저장된 타격으로 새로 얻은 카드 순번: 3 미만이던 타격 수가 3이 된 장소. */
export const wonRewardCards=(before:Hits,patch:Hits)=>PLACES.flatMap((_,i)=>before?.[String(i)]!==3&&patch?.[String(i)]===3?[i]:[]);

let play:(cue:Cue)=>void=()=>{};
/** main.ts가 앱의 효과음 재생기를 넘겨 준다. 카드 소리도 소리 설정을 그대로 따른다. */
export function bindRewardSound(next:(cue:Cue)=>void){play=next;}

// 처음 쓸 때 만든다: 단위 테스트는 브라우저 없이 위 규칙만 읽는다.
let instance:RewardCards|undefined;
function rewards(){
 return instance??=createRewardCards({
  setName:'보이지 않는 흔적 성취 카드',
  cards:PLACES.map((place,i)=>({id:String(i),title:TITLES[i],stage:place.name,art:asset(`reward-cards/card-${i+1}-${i}`),thumb:asset(`reward-cards/thumb-${i+1}-${i}`)})),
  theme:{accent:'#12a097',accent2:'#0a7069',glow:'#d8f2ef',ink:'#103e43'},
  particles:['bubble','drop','spark','star'],
  colors:['#12a097','#2f95cf','#7556d4','#e57c14','#d8f2ef','#ffffff'],
  // 카드 뒷면: 머리글 상표와 같은 돋보기.
  emblem:icon('search',48),
  sound:name=>play(CUES[name]),
  inertRoot:()=>document.querySelector<HTMLElement>('#app'),
 });
}

// 칸으로 날아가는 중인 카드는 도착할 때까지 머리글 칸을 비워 둔다.
const flying=new Set<number>();
const shown=(hits:Hits)=>ownedRewardCards(hits).map((owned,i)=>owned&&!flying.has(i));
/** 소리 버튼 바로 앞에 넣는 카드 칸 HTML. */
export const rewardSlotsHtml=(hits:Hits)=>rewards().slotsHtml(shown(hits));
// 악당 퇴장이 끝났지만 아직 보관함에 넣지 않은 카드 수.
let due=0;
/** 카드를 열 차례가 된 때부터 칸에 들어갈 때까지 참. 그동안 지도는 악당과 전체 격퇴 파이널을 멈춘다. */
export const rewardCardDue=()=>due>0;
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
/**
 * `index`번 악당이 방금 세 번째 타격을 맞았다. `delay`(퇴장 연출) 뒤 `origin()` 자리에서 카드가 날아온다.
 * `state()`는 'open'(열기), 'wait'(안내창이 지도를 덮음), 'gone'(지도를 떠남: 칸만 채움) 중 하나를 답한다.
 */
export async function winRewardCard(index:number,{delay,state,origin,hits}:{delay:number;state:()=>'open'|'wait'|'gone';origin:()=>{x:number;y:number}|undefined;hits:()=>Hits}){
 flying.add(index);
 let counted=false;
 try{
  await wait(delay);
  due++;counted=true;
  let now;
  while((now=state())==='wait')await wait(400);
  if(now==='open')await rewards().reveal(index,origin(),ownedRewardCards(hits()));
 }finally{
  if(counted)due--;
  flying.delete(index);rewards().syncSlots(shown(hits()));
 }
}
