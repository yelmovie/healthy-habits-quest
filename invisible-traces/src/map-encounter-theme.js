const base=import.meta.env.BASE_URL+'assets/map-encounters/';
const story = [
  [
    "이 손잡이에 내 자국을 남겼지!",
    "자국이 눈에 보일까?",
    "vent"
  ],
  [
    "이 단서 하나는 내가 가렸어!",
    "가려진 단서는 못 찾겠지?",
    "label"
  ],
  [
    "이번엔 어느 물건에 자국을 남길까?",
    "여기랑 저기에 찍어야지!",
    "flip"
  ],
  [
    "비교용 손잡이를 잠깐 가려 둘게!",
    "이쪽은 못 보게 해야지!",
    "pane"
  ],
  [
    "학교 지도에 내 표식을 찍어야지!",
    "내 표식은 꼭 남겨야지!",
    "file"
  ]
];
const hit = ["앗, 장갑이 미끄러졌어!", "형광 자국이 흐려졌잖아!"], finish = "내 표식이 다 지워졌네!";
export const encounterLook = {palette:'#e5ff83', effect:'handprint', art:{left:base+'villain-redraw.png',frames:6}};
export function encounterStage(index,id,name,point){
  const [one,two,prop]=story[index];
  return {id:String(id),name,x:point.x,y:point.y,lines:[one,two],prop,hit,finish};
}
