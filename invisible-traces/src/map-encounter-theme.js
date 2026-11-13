const base=import.meta.env.BASE_URL+'assets/map-encounters/';
const story = [
  ["vent", "숨어 있던 손자국을 찾아냈어? 장갑에 탐정 방지 기능을 넣을걸!", "다음 손자국은 내 이름처럼 크게 찍지!", "앗, 내 장갑에서 형광이 번쩍!", "가려 둔 손자국이 또렷해졌어!", "흥, 신호 광장 기록은 돌려줄게!"],
  ["label", "체육관에서 흔적이 옮겨간 순서까지 찾았어? 내 가림막을 봤구나!", "다음엔 단서판에 내 발자국도 찍을 거야!", "앗, 체육관 단서가 펼쳐졌어!", "내가 뒤섞은 순서 카드가 돌아오잖아!", "쳇, 체육관 단서는 네가 챙겨!"],
  ["flip", "교실에서 누가 뭘 만졌는지 기록했어? 내 표식은 못 찾을 줄 알았지!", "책상 밑에도 내 사인 하나 남겨야겠군!", "앗, 교실 물건에 찍힌 표시가 보여!", "숨긴 관찰 카드까지 펼쳐졌어!", "흥, 교실 기록엔 내 낙서는 지울게!"],
  ["pane", "급식실에서 바꾸기 전후를 비교했어? 내 몰래 숨긴 표식이 딱 걸렸네!", "다음엔 표식을 식판 밑에 붙여야지!", "앗, 가렸던 비교 기록이 보이잖아!", "내가 숨긴 두 번째 장이 열렸어!", "쳇, 급식실 표식은 깨끗이 지워 둘게!"],
  ["file", "학교 지도에 모든 단서를 이었어? 내 낙서가 증거가 될 줄은 몰랐지!", "다음엔 내 사인 밑에 ‘절대 증거 아님’이라고 쓰겠어!", "앗, 내 표식 밑의 지도가 나와!", "운동장 기록까지 다 이어졌잖아!", "흥, 지도를 돌려줄게. 낙서는 이제 내 수첩에만!"],
];
export const encounterLook = {palette:'#e5ff83', effect:'handprint', art:{left:base+'villain-redraw.png',frames:6}};
export function encounterStage(index,id,name,point){
  const [prop,one,two,hitOne,hitTwo,finish]=story[index];
  return {id:String(id),name,speaker:"자국 도깨비",x:point.x,y:point.y,lines:[one,two],prop,hit:[hitOne,hitTwo],finish};
}
