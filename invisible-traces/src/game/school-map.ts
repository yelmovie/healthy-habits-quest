// 조사 지도의 장소와 걸을 수 있는 길. 좌표는 public/assets/school-map.webp의 픽셀 기준이다.
// Phaser 없이도 쓰도록 계산만 담는다.
export interface Point { x:number; y:number }
export interface Place { name:string; to:string; node:string; label:Point; hit:[number,number,number,number] }

export const MAP_SIZE = { width:1115, height:547 };

export const NODES: Record<string,Point> = {
 gate:{x:372,y:428}, plazaSouth:{x:402,y:382}, plazaMid:{x:450,y:345}, plazaNorth:{x:500,y:305}, signal:{x:545,y:290},
 hub:{x:625,y:262}, main:{x:655,y:257},
 gymTurn:{x:362,y:345}, gym:{x:345,y:316},
 eastGate:{x:690,y:256}, eastWalk:{x:735,y:264}, cafeteria:{x:795,y:277},
 trackGate:{x:670,y:285}, trackEdge:{x:676,y:310}, track:{x:690,y:322},
};

export const EDGES: [string,string][] = [
 ['gate','plazaSouth'],['plazaSouth','plazaMid'],['plazaMid','plazaNorth'],['plazaNorth','signal'],['signal','hub'],['hub','main'],
 ['plazaSouth','gymTurn'],['gymTurn','gym'],
 ['main','eastGate'],['eastGate','eastWalk'],['eastWalk','cafeteria'],
 ['hub','trackGate'],['eastGate','trackGate'],['trackGate','trackEdge'],['trackEdge','track'],
];

// 미션 순서대로. hit은 그림의 건물을 눌러도 같은 장소로 가게 하는 영역이다.
export const PLACES: Place[] = [
 {name:'신호 광장',to:'신호 광장으로',node:'signal',label:{x:560,y:238},hit:[505,250,110,60]},
 {name:'체육관',to:'체육관으로',node:'gym',label:{x:292,y:236},hit:[105,130,250,190]},
 {name:'본관 교실',to:'본관 교실로',node:'main',label:{x:640,y:176},hit:[440,20,330,200]},
 {name:'급식실',to:'급식실로',node:'cafeteria',label:{x:838,y:190},hit:[770,90,190,140]},
 {name:'운동장',to:'운동장으로',node:'track',label:{x:742,y:372},hit:[570,320,380,170]},
];

export const START_NODE = 'gate';
export const STOP_RADIUS = 10;

const dist = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
const neighbours = (id:string) => EDGES.flatMap(([a,b]) => a===id?[b]:b===id?[a]:[]);

/** 길 위에서 주어진 위치와 가장 가까운 지점. */
export function nearestOnRoad(p:Point){
 let best = {point:NODES[START_NODE],a:START_NODE,b:START_NODE,gap:Infinity};
 for(const [a,b] of EDGES){
  const A=NODES[a],B=NODES[b],dx=B.x-A.x,dy=B.y-A.y;
  const t=Math.max(0,Math.min(1,((p.x-A.x)*dx+(p.y-A.y)*dy)/(dx*dx+dy*dy)));
  const point={x:A.x+dx*t,y:A.y+dy*t},gap=dist(p,point);
  if(gap<best.gap)best={point,a,b,gap};
 }
 return best;
}

/** 방향 입력으로 길을 따라 한 걸음 옮긴다. 갈 수 없는 방향이면 제자리다. */
export function step(from:Point,dir:Point,length:number):Point{
 const size=Math.hypot(dir.x,dir.y);if(!size)return from;
 const road=nearestOnRoad(from),{a,b}=road;
 const node=[a,b].find(id=>dist(road.point,NODES[id])<.75);
 const point=node?NODES[node]:road.point; // 갈림길에서는 길 밖으로 새지 않게 지점에 붙인다
 const options=(node?neighbours(node):[a,b]).map(id=>NODES[id]);
 let target:Point|null=null,score=node?.3:.12;
 for(const n of options){const d=dist(point,n),dot=((n.x-point.x)*dir.x+(n.y-point.y)*dir.y)/(d*size);if(dot>score){score=dot;target=n;}}
 if(!target)return point;
 const move=Math.min(length,dist(point,target)),d=dist(point,target);
 return {x:point.x+(target.x-point.x)/d*move,y:point.y+(target.y-point.y)/d*move};
}

/** from에서 to까지 길을 따라가는 지점 목록. to도 길 위의 점으로 맞춘다. */
export function routeBetween(from:Point,to:Point):Point[]{
 const start=nearestOnRoad(from),end=nearestOnRoad(to);
 const sameEdge=(start.a===end.a&&start.b===end.b);
 if(sameEdge)return [start.point,end.point];
 const cost=new Map<string,number>([[start.a,dist(start.point,NODES[start.a])],[start.b,dist(start.point,NODES[start.b])]]);
 const previous=new Map<string,string>(),open=new Set(Object.keys(NODES));
 while(open.size){
  const id=[...open].filter(n=>cost.has(n)).sort((x,y)=>cost.get(x)!-cost.get(y)!)[0];if(!id)break;open.delete(id);
  for(const next of neighbours(id)){const total=cost.get(id)!+dist(NODES[id],NODES[next]);if(total<(cost.get(next)??Infinity)){cost.set(next,total);previous.set(next,id);}}
 }
 const viaEnd=[end.a,end.b].sort((x,y)=>cost.get(x)!+dist(NODES[x],end.point)-cost.get(y)!-dist(NODES[y],end.point))[0];
 const path=[viaEnd];while(previous.has(path[0]))path.unshift(previous.get(path[0])!);
 return [start.point,...path.map(id=>NODES[id]),end.point];
}

export const routeLength = (route:Point[]) => route.slice(1).reduce((sum,p,i)=>sum+dist(route[i],p),0);

/** 경로의 앞에서 distance만큼 간 지점. */
export function pointAlong(route:Point[],distance:number):Point{
 let left=distance;
 for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],d=dist(a,b);if(left<=d&&d>0)return {x:a.x+(b.x-a.x)*left/d,y:a.y+(b.y-a.y)*left/d};left-=d;}
 return route.at(-1)!;
}

/** 이 위치가 멈춰 설 수 있는 장소의 번호(0부터), 아니면 -1. */
export const placeAt = (p:Point) => PLACES.findIndex(x=>dist(p,NODES[x.node])<=STOP_RADIUS);

/** 그림의 건물 영역을 눌렀을 때의 장소 번호, 아니면 -1. */
export const placeHit = (p:Point) => PLACES.findIndex(({hit:[x,y,w,h]})=>p.x>=x&&p.x<=x+w&&p.y>=y&&p.y<=y+h);
