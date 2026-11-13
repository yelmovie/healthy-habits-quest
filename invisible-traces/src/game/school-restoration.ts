import type Phaser from 'phaser';
import {MAP_SIZE,type Point} from './school-map';

type XY=[number,number];
// Coordinate masks are traced against school-map.webp; sky, trees and roads
// stay visible while the actual affected building or field is muted.
const campus: {outline:XY[];door:XY;tone:string}[]=[
 {outline:[[348,220],[397,205],[436,209],[487,232],[483,249],[450,272],[411,274],[375,262],[347,246]],door:[455,247],tone:'#8ee8ef'},
 {outline:[[81,166],[105,152],[142,133],[183,119],[215,110],[259,108],[292,116],[324,138],[329,164],[311,189],[306,215],[267,243],[212,251],[162,265],[116,265],[95,249]],door:[119,232],tone:'#e6a7ee'},
 {outline:[[357,60],[384,51],[405,44],[435,38],[475,39],[490,45],[513,29],[538,18],[587,22],[620,28],[636,40],[642,62],[659,73],[647,86],[624,94],[612,115],[605,149],[572,171],[515,170],[472,173],[430,152],[384,145],[362,123]],door:[528,163],tone:'#92e7ed'},
 {outline:[[616,89],[634,76],[668,77],[700,84],[737,86],[770,92],[778,104],[764,133],[760,165],[742,190],[702,200],[665,185],[627,175],[610,158]],door:[718,173],tone:'#ffc98a'},
 {outline:[[451,299],[484,265],[522,248],[567,239],[655,246],[720,263],[770,286],[786,312],[788,349],[760,379],[717,388],[662,380],[608,365],[555,354],[503,338],[468,324]],door:[673,333],tone:'#b6edb0'},
];
const scale=MAP_SIZE.width/900;
export function schoolBuildingPatch(source:HTMLImageElement,index:number,complete:boolean){
 const {outline,door,tone}=campus[index],min=(axis:number)=>Math.min(...outline.map(p=>p[axis])),max=(axis:number)=>Math.max(...outline.map(p=>p[axis]));
 const x=Math.floor(min(0)*scale)-8,y=Math.floor(min(1)*scale)-8;
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(max(0)*scale-x)+8;canvas.height=Math.ceil(max(1)*scale-y)+8;
 const c=canvas.getContext('2d')!;c.translate(-x,-y);c.scale(scale,scale);
 if(!complete){
  c.beginPath();outline.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.clip();
  c.filter='saturate(30%) brightness(76%)';c.drawImage(source,0,0,900,MAP_SIZE.height/scale);c.filter='none';
  if(index>0&&index<4){c.fillStyle='#435963';c.fillRect(door[0]-9,door[1]-6,18,11);}
  return {canvas,x,y};
 }
 c.translate(...door);
 const glow=c.createRadialGradient(0,0,0,0,0,28);glow.addColorStop(0,tone+'bf');glow.addColorStop(1,tone+'00');c.fillStyle=glow;c.fillRect(-28,-28,56,56);
 const box=(a:number,b:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(a,b,w,h);};
 const dot=(a:number,b:number,r:number,color:string)=>{c.fillStyle=color;c.beginPath();c.arc(a,b,r,0,Math.PI*2);c.fill();};
 if(index===0){
  // Reopened signal plaza: a turquoise lamp on either side of the noticeboard.
  box(-10,-9,20,13,'#286c78');box(-8,-8,16,9,'#daf3e2');box(-6,-6,11,2,'#559382');box(-6,-2,7,1,'#559382');
  for(const a of [-11,9]){box(a,4,2,6,'#476d5e');dot(a+1,-6,3,tone);}
 }else if(index===1){
  box(-8,-8,16,13,'#576692');box(-6,-6,5,9,'#ccecec');box(1,-6,5,9,'#e4daf4');box(12,-3,10,6,'#8d9cbd');dot(15,-5,2,tone);
 }else if(index===2){
  box(-10,-11,21,15,'#446f82');box(-8,-9,7,11,'#ade4de');box(2,-9,7,11,'#fff3c9');box(14,-10,10,12,'#3a6b62');box(15,-7,8,2,'#ebf5d8');
 }else if(index===3){
  box(-8,-10,16,14,'#735b4c');box(-6,-8,12,11,'#ffe5a4');box(13,-2,12,6,'#64a7a4');box(15,-6,7,5,'#dff2e9');dot(18,-7,2,'#fff5ce');
 }else{
  for(const d of [-21,0,21]){box(d-1,-17,2,19,'#e9f0e6');box(d+1,-17,10,6,tone);box(d+1,-12,10,1,'#51967c');}
 }
 return {canvas,x,y};
}
export function schoolCelebration(scene:Phaser.Scene,at:Point){
 const g=scene.add.graphics({x:at.x,y:at.y}).setDepth(5);
 g.fillStyle(0x165c62,.8).fillEllipse(0,0,69,22);
 for(let i=0;i<5;i++){const x=(i-2)*12,y=i%2?-4:-9;g.fillStyle(0x4d8b77,1).fillRect(x-1,y,2,17);g.fillStyle(i===2?0xffd986:0xb5f0da,1).fillCircle(x,y,3);}
 return g;
}
