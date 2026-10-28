import Phaser from 'phaser';
export interface MapHandle { travel:(stage:number)=>Promise<void>;destroy:()=>void }
export async function createMap(parent:HTMLElement,available:number,completed:number,reduced:boolean,onSelect:(stage:number)=>void):Promise<MapHandle>{
 let resolveReady:()=>void=()=>{};const ready=new Promise<void>(r=>resolveReady=r);let active:SchoolMap|undefined;let game:Phaser.Game;
 const positions=[[1,1],[5,1],[6,4],[3,6],[1,4]];
 const iso=(u:number,v:number)=>({x:192+(u-v)*20,y:48+(u+v)*10});
 class SchoolMap extends Phaser.Scene {
  hero!:Phaser.GameObjects.Container;g!:Phaser.GameObjects.Graphics;busy=false;travelDone:(()=>void)|null=null;
  constructor(){super('SchoolMap');}
  create(){active=this;this.cameras.main.setBackgroundColor('#dcece2');this.g=this.add.graphics();const g=this.g;
   const poly=(pts:number[][],color:number)=>{g.fillStyle(color);g.fillPoints(pts.map(([x,y])=>new Phaser.Geom.Point(x,y)),true);};
   // A low-resolution isometric island, with hard pixel edges.
   poly([[192,35],[372,125],[192,215],[12,125]],0x548a68);
   poly([[12,117],[192,207],[192,215],[12,125]],0x406f54);poly([[192,207],[372,117],[372,125],[192,215]],0x375d4d);
   for(let u=0;u<9;u++)for(let v=0;v<9;v++){const {x,y}=iso(u,v);const path=u===3||v===3||u===6||v===1;poly([[x,y-10],[x+20,y],[x,y+10],[x-20,y]],path?0xe7d4a5:((u+v)%3?0x86b879:0x96c287));if(!path&&((u*3+v)%7===0)){g.fillStyle(0xc5da91);g.fillRect(x-3,y-2,3,2);g.fillStyle(0xe9e8b5);g.fillRect(x+5,y+1,2,2);}}
   const tree=(u:number,v:number)=>{const {x,y}=iso(u,v);g.fillStyle(0x4a775c,.22);g.fillEllipse(x,y,20,8);g.fillStyle(0x795b3b);g.fillRect(x-2,y-16,4,18);g.fillStyle(0x39765b);g.fillRect(x-10,y-24,20,12);g.fillRect(x-7,y-29,14,10);g.fillStyle(0x4d9466);g.fillRect(x-11,y-21,14,7);g.fillRect(x-6,y-27,10,7);g.fillStyle(0x75af72);g.fillRect(x-6,y-28,5,4);};
   [[0,0],[0,2],[0,5],[0,7],[2,8],[4,8],[7,8],[8,7],[8,5],[8,2],[7,0],[4,0]].forEach(([u,v])=>tree(u,v));
   positions.forEach(([u,v],i)=>{const {x,y}=iso(u,v);const wall=[0xf6e7c9,0xddd2ee,0xf0d9b8,0xc5e0dd,0xf0dfbf][i],roof=[0x497e87,0x7f739d,0x9f7350,0x4d8b7f,0x6c8e63][i];
    g.fillStyle(0x345741,.18);g.fillEllipse(x,y+5,54,16);
    poly([[x-22,y-7],[x,y+4],[x,y-24],[x-22,y-35]],wall);poly([[x,y+4],[x+22,y-7],[x+22,y-35],[x,y-24]],Phaser.Display.Color.IntegerToColor(wall).darken(12).color);
    poly([[x-26,y-34],[x,y-53],[x+26,y-34],[x,y-21]],roof);g.fillStyle(0xffffff,.15);g.fillRect(x-14,y-37,9,3);
    g.fillStyle(0x3f6570);g.fillRect(x-17,y-23,5,7);g.fillRect(x-9,y-19,5,7);g.fillRect(x+6,y-20,5,8);g.fillRect(x+14,y-24,5,8);
    g.fillStyle(0xffe8aa,.85);g.fillRect(x-16,y-22,2,3);g.fillRect(x+7,y-19,2,3);
    g.fillStyle(0x506763);g.fillRect(x-3,y-9,6,12);
    if(i<completed){g.fillStyle(0xb3e8ad);g.fillRect(x-5,y-59,10,7);g.lineStyle(1,0x355d47);g.lineBetween(x-5,y-52,x-5,y-40);}else{g.fillStyle(i<available?0xf3c77b:0xaebdb5);g.fillCircle(x,y-60,4);}
    const zone=this.add.zone(x,y-20,62,74).setInteractive({useHandCursor:true});zone.on('pointerup',()=>{if(i<available&&!this.busy)onSelect(i+1);});
   });
   const h=this.add.graphics();h.fillStyle(0x294938,.18);h.fillEllipse(0,1,14,6);h.fillStyle(0x28566a);h.fillRect(-4,-10,8,8);h.fillStyle(0x253d47);h.fillRect(-4,-3,3,5);h.fillRect(1,-3,3,5);h.fillStyle(0xf2cc9a);h.fillRect(-4,-19,8,9);h.fillStyle(0x524033);h.fillRect(-5,-21,10,5);h.fillRect(-5,-17,2,3);h.fillStyle(0xa6d8be);h.fillRect(-5,-10,2,7);const start=iso(3,7);this.hero=this.add.container(start.x,start.y,[h]);
   resolveReady();
  }
  move(stage:number){if(this.busy)return Promise.resolve();this.busy=true;const [u,v]=positions[stage-1],p=iso(u+0.5,v+0.8);return new Promise<void>(res=>{this.travelDone=res;this.tweens.add({targets:this.hero,x:p.x,y:p.y,duration:reduced?30:620,ease:'Sine.easeInOut',onComplete:()=>{this.busy=false;this.travelDone=null;res();}});});}
 }
 game=new Phaser.Game({type:Phaser.AUTO,parent,width:384,height:240,pixelArt:true,roundPixels:true,transparent:false,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[SchoolMap],audio:{noAudio:true},banner:false,render:{antialias:false}});
 await ready;let destroyed=false;return {travel:stage=>destroyed?Promise.resolve():active!.move(stage),destroy:()=>{destroyed=true;active?.travelDone?.();game.destroy(true);}};
}
