import {bindDirectionPad,mapKeyDirection} from '../map-controls.js';
import Phaser from 'phaser';
import { asset } from '../data/game';
import { MAP_SIZE, NODES, PLACES, START_NODE, type Point, nearestOnRoad, placeAt, placeHit, pointAlong, routeBetween, routeLength, step } from './school-map';

export interface MapOptions {
 start:Point|null;overview:boolean;reduced:boolean;
 /** 미션 번호(0부터)별 입장 가능 여부와, 지금 해야 할 미션 번호(없으면 -1). */
 open:boolean[];next:number;
 onSelect:(stage:number)=>void;onMove:(p:Point)=>void;onView:(mode:'follow'|'free'|'overview')=>void;onStop:(place:number)=>void;
}
export interface MapHandle { travel:(stage:number)=>Promise<void>;destroy:()=>void }
type Direction = 'up'|'down'|'left'|'right';

const VECTORS:Record<Direction,Point> = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
const KEYS:Record<string,Direction> = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
const LABEL_TOP = 132, ROAD_TAP = 22, PAVEMENT_TAP = 70, WALK_SPEED = 150, TRAVEL_SPEED = 190, TRAVEL_MAX_SECONDS = 1.8, STRIDE = 13, MATE_GAP = 38, DRAG_START = 6;
const FRAME = {width:48,height:58}, HERO_STAND = 0, HERO_STEP = [1,2], MATE = 3;

export async function createMap(parent:HTMLElement,options:MapOptions):Promise<MapHandle>{
 const page=parent.parentElement!,labels=[...page.querySelectorAll<HTMLElement>('.map-place')];
 let resolveReady:()=>void=()=>{},rejectReady:(e:Error)=>void=()=>{};
 const ready=new Promise<void>((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 let active:SchoolMap|undefined;

 class SchoolMap extends Phaser.Scene {
  hero!:Phaser.GameObjects.Sprite;mate!:Phaser.GameObjects.Sprite;heroShadow!:Phaser.GameObjects.Ellipse;mateShadow!:Phaser.GameObjects.Ellipse;ring!:Phaser.GameObjects.Ellipse;
  pos:Point=options.start??NODES[START_NODE];held=new Map<string,Direction>();trail:Point[]=[];walked=0;facing=1;
  route:Point[]|null=null;routeDone=0;routeSpeed=TRAVEL_SPEED;arrived:(()=>void)|null=null;
  mode:'follow'|'free'|'overview'=options.overview?'overview':'follow';lastPlace=placeAt(this.pos);grab:{x:number;y:number;scrollX:number;scrollY:number;moved:boolean}|null=null;
  constructor(){super('SchoolMap');}
  preload(){
   this.load.image('school',asset('school-map'));this.load.spritesheet('team',asset('map-team'),{frameWidth:FRAME.width,frameHeight:FRAME.height});
   this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR,()=>rejectReady(new Error('map asset failed')));
  }
  create(){
   active=this;
   this.add.image(0,0,'school').setOrigin(0);
   this.drawRoad();
   this.ring=this.add.ellipse(0,0,44,20).setStrokeStyle(2,0xffb545).setVisible(false);
   this.heroShadow=this.add.ellipse(0,0,28,9,0x12332f,.3);this.mateShadow=this.add.ellipse(0,0,26,8,0x12332f,.3);
   this.hero=this.add.sprite(0,0,'team',HERO_STAND).setOrigin(.5,1);this.mate=this.add.sprite(0,0,'team',MATE).setOrigin(.5,1);
   this.trail=[{x:this.pos.x-MATE_GAP*.6,y:this.pos.y+6}];
   this.placeTeam();
   if(options.next>=0&&!options.reduced){
    const stop=NODES[PLACES[options.next].node];this.ring.setPosition(stop.x,stop.y).setVisible(true);
    this.tweens.add({targets:this.ring,scale:{from:.7,to:1.25},alpha:{from:1,to:.15},duration:1100,repeat:-1});
   }
   this.input.on('pointerdown',this.pointerDown,this);this.input.on('pointermove',this.pointerMove,this);this.input.on('pointerup',this.pointerUp,this);this.input.on('pointerupoutside',this.pointerCancel,this);
   this.scale.on(Phaser.Scale.Events.RESIZE,this.applyView,this);
   this.game.events.on(Phaser.Core.Events.POST_RENDER,this.syncLabels,this);
   this.applyView();
   resolveReady();
  }
  // 걸을 수 있는 길을 점선으로 보여 준다.
  drawRoad(){
   const g=this.add.graphics();
   const seen=new Set<string>();
   for(const place of PLACES){
    const route=routeBetween(NODES[START_NODE],NODES[place.node]),length=routeLength(route);
    for(let d=0;d<length;d+=13){const p=pointAlong(route,d),x=Math.round(p.x),y=Math.round(p.y),key=`${Math.round(x/7)},${Math.round(y/7)}`;if(seen.has(key))continue;seen.add(key);g.fillStyle(0x0b7a74);g.fillRect(x-2,y-1,5,3);g.fillRect(x-1,y-2,3,5);g.fillStyle(0xffffff);g.fillRect(x-1,y-1,3,3);}
   }
  }
  fitZoom(){return Math.min(this.scale.width/MAP_SIZE.width,this.scale.height/MAP_SIZE.height);}
  followZoom(){return Math.max(1,Math.ceil(Math.max(this.scale.width/MAP_SIZE.width,this.scale.height/MAP_SIZE.height)*1.15));}
  applyView(){
   const cam=this.cameras.main;
   if(this.mode==='overview'){cam.stopFollow();cam.removeBounds();cam.setZoom(this.fitZoom());cam.centerOn(MAP_SIZE.width/2,MAP_SIZE.height/2);}
   else{cam.stopFollow();cam.setBounds(0,0,MAP_SIZE.width,MAP_SIZE.height);cam.setZoom(this.followZoom());if(this.mode==='follow'){cam.startFollow(this.hero,true,options.reduced?1:.14,options.reduced?1:.14,0,this.scale.height*.06/cam.zoom);}}
   parent.classList.toggle('hand-on',this.mode==='free');
   page.querySelector('[data-action="map-hand"]')?.setAttribute('aria-pressed',String(this.mode==='free'));
   page.querySelector('[data-action="map-view"]')?.setAttribute('aria-pressed',String(this.mode==='overview'));
   options.onView(this.mode);
  }
  setMode(mode:'follow'|'free'|'overview'){if(this.mode===mode)return;this.mode=mode;this.applyView();}
  toggleView(){this.setMode(this.mode==='overview'?'follow':'overview');}
  stopWalking(){this.held.clear();this.route=null;const done=this.arrived;this.arrived=null;done?.();}
  placeTeam(){
   this.hero.setPosition(Math.round(this.pos.x),Math.round(this.pos.y));this.heroShadow.setPosition(this.hero.x,this.hero.y-1);
   const mate=this.trail[0];this.mate.setPosition(Math.round(mate.x),Math.round(mate.y));this.mateShadow.setPosition(this.mate.x,this.mate.y-1);
   this.hero.setDepth(this.hero.y+2);this.heroShadow.setDepth(this.hero.y);this.mate.setDepth(this.mate.y+2);this.mateShadow.setDepth(this.mate.y);
  }
  moveTo(next:Point){
   const moved=Math.hypot(next.x-this.pos.x,next.y-this.pos.y);if(moved<.01)return false;
   if(Math.abs(next.x-this.pos.x)>.05)this.facing=next.x>this.pos.x?1:-1;
   this.trail.push(next);while(this.trail.length>2&&routeLength(this.trail)>MATE_GAP)this.trail.shift();
   this.pos=next;this.walked+=moved;options.onMove(next);return true;
  }
  update(_time:number,delta:number){
   if(parent.closest('[inert]'))this.held.clear(); // 안내창이 떠 있는 동안에는 걷지 않는다
   const dt=Math.min(delta,50)/1000;let walking=false;
   if(this.route){
    this.routeDone+=this.routeSpeed*dt;walking=this.moveTo(pointAlong(this.route,this.routeDone));
    if(this.routeDone>=routeLength(this.route)){this.route=null;const done=this.arrived;this.arrived=null;walking=false;this.notePlace(!done);done?.();}
   }else if(this.held.size){
    const dir=[...this.held.values()].reduce((sum,d)=>({x:sum.x+VECTORS[d].x,y:sum.y+VECTORS[d].y}),{x:0,y:0});
    walking=this.moveTo(step(this.pos,dir,WALK_SPEED*dt));this.notePlace(true);
   }
   // 걸음은 시간이 아니라 간 거리로 바꿔 어떤 화면에서도 발이 미끄러지지 않게 한다.
   const stride=Math.floor(this.walked/STRIDE)%2;
   this.hero.setFrame(walking?HERO_STEP[stride]:HERO_STAND).setFlipX(walking?this.facing>0:this.facing<0);
   this.mate.setFlipX(this.facing<0);
   this.placeTeam();
   if(walking){this.hero.y-=stride;this.mate.y-=1-stride;if(this.mode==='free')this.setMode('follow');}
  }
  // 다음 미션 장소에 걸어 들어가면 바로 입장한다. 지나온 장소는 멈춰 알려 주기만 한다.
  notePlace(mayEnter:boolean){
   const here=placeAt(this.pos);if(here===this.lastPlace)return;this.lastPlace=here;options.onStop(here);
   if(mayEnter&&here>=0&&here===options.next&&options.open[here]){this.held.clear();options.onSelect(here+1);}
  }
  walkTo(target:Point,seconds=TRAVEL_MAX_SECONDS){
   const route=routeBetween(this.pos,target),length=routeLength(route);
   this.held.clear();this.route=route;this.routeDone=0;this.routeSpeed=options.reduced?length/.03:Math.max(TRAVEL_SPEED,length/seconds);
   if(this.mode!=='follow')this.setMode('follow');
  }
  press(dir:Direction,source:string=dir){if(!this.route)this.held.set(source,dir);}
  nudge(dir:Direction){if(this.route)return;const target=step(this.pos,VECTORS[dir],34);if(target!==this.pos)this.walkTo(target);}
  enter(){const here=placeAt(this.pos);if(here>=0&&options.open[here])options.onSelect(here+1);}
  travel(stage:number){const stop=NODES[PLACES[stage-1].node];if(placeAt(this.pos)===stage-1){this.route=null;return Promise.resolve();}return new Promise<void>(resolve=>{this.arrived?.();this.arrived=resolve;this.walkTo(stop);});}
  pointerDown(pointer:Phaser.Input.Pointer){const cam=this.cameras.main;this.grab={x:pointer.x,y:pointer.y,scrollX:cam.scrollX,scrollY:cam.scrollY,moved:false};}
  pointerMove(pointer:Phaser.Input.Pointer){
   const grab=this.grab;if(!grab||!pointer.isDown||this.mode==='overview')return;
   const dx=pointer.x-grab.x,dy=pointer.y-grab.y;if(!grab.moved&&Math.hypot(dx,dy)<DRAG_START)return;
   const cam=this.cameras.main;
   if(!grab.moved){grab.moved=true;if(this.mode==='follow'){cam.stopFollow();grab.scrollX=cam.scrollX;grab.scrollY=cam.scrollY;this.mode='free';this.applyView();}parent.classList.add('grabbing');}
   cam.setScroll(grab.scrollX-dx/cam.zoom,grab.scrollY-dy/cam.zoom);
  }
  pointerCancel(){this.grab=null;parent.classList.remove('grabbing');}
  pointerUp(pointer:Phaser.Input.Pointer){
   const grab=this.grab;this.pointerCancel();if(!grab||grab.moved||this.arrived)return;
   const world=this.cameras.main.getWorldPoint(pointer.x,pointer.y),road=nearestOnRoad(world);
   // 길을 정확히 누르지 않아도 걷게 하되, 건물을 누르면 그 장소로 간다.
   const place=road.gap>ROAD_TAP?placeHit(world):-1;
   if(place>=0){if(options.open[place])options.onSelect(place+1);else options.onStop(place);}
   else if(road.gap<=PAVEMENT_TAP)this.walkTo(road.point);
  }
  syncLabels(){
   const cam=this.cameras.main,cx=cam.midPoint.x,cy=cam.midPoint.y,w=this.scale.width/2,h=this.scale.height/2;
   // 위쪽 도구 줄 아래로만 내려오게 해서 이름표가 버튼에 가리지 않게 한다.
   const blocked=[...document.querySelectorAll<HTMLElement>('.topbar,.map-controls,.map-next,.window-restoration,.map-status')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());
   const placed:DOMRect[]=[];
   const overlaps=(a:DOMRect,b:DOMRect)=>a.left<b.right+6&&a.right>b.left-6&&a.top<b.bottom+6&&a.bottom>b.top-6;
   labels.forEach((label,i)=>{const p=PLACES[i].label,x=Math.round((p.x-cx)*cam.zoom+w),y=Math.max(LABEL_TOP,Math.round((p.y-cy)*cam.zoom+h));label.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;const r=label.getBoundingClientRect();const clear=r.left>=8&&r.right<=innerWidth-8&&r.top>=8&&r.bottom<=innerHeight-8&&!blocked.some(b=>overlaps(r,b))&&!placed.some(b=>overlaps(r,b));label.style.visibility=clear?'visible':'hidden';if(clear)placed.push(r);});
   // Off-camera or HUD-covered destinations remain available in the numbered map-pips.

  }
 }

 const game=new Phaser.Game({type:Phaser.AUTO,parent,width:parent.clientWidth||MAP_SIZE.width,height:parent.clientHeight||MAP_SIZE.height,pixelArt:true,backgroundColor:'#103e43',scale:{mode:Phaser.Scale.RESIZE},scene:[SchoolMap],audio:{noAudio:true},banner:false,render:{antialias:false}});
 const controls=new AbortController(),{signal}=controls;let destroyed=false;
 const destroy=()=>{if(destroyed)return;destroyed=true;controls.abort();active?.stopWalking();game.destroy(true);};
 try{await ready;}catch(error){destroy();throw error;}
 const scene=active!,blocked=()=>!!parent.closest('[inert]');
 bindDirectionPad(page,'[data-map-direction]',b=>b.dataset.mapDirection as Direction,{signal,blocked:()=>blocked()||document.hidden||!!document.querySelector('dialog[open]'),press:d=>scene.press(d),release:d=>scene.held.delete(d),tap:d=>scene.nudge(d)});
 page.querySelector('[data-action="map-hand"]')?.addEventListener('click',()=>{scene.stopWalking();scene.setMode(scene.mode==='free'?'follow':'free');},{signal});
 page.querySelector('[data-action="map-view"]')?.addEventListener('click',()=>scene.toggleView(),{signal});
 document.addEventListener('keydown',e=>{
  if(blocked()||e.ctrlKey||e.altKey||e.metaKey||(e.target instanceof HTMLElement&&(e.target.isContentEditable||e.target.closest('input,textarea,select'))))return;
  const dir=mapKeyDirection(e);
  if(dir){e.preventDefault();scene.press(dir,e.code||e.key);}
  else if(e.key==='Enter'&&!(e.target as HTMLElement).closest('button,a,input,select')){e.preventDefault();scene.enter();}
 },{signal});
 document.addEventListener('keyup',e=>{const dir=mapKeyDirection(e);if(dir)scene.held.delete(e.code||e.key);},{signal});
 addEventListener('blur',()=>scene.held.clear(),{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)scene.held.clear();},{signal});
 page.classList.add('ready');
 return {travel:stage=>destroyed?Promise.resolve():scene.travel(stage),destroy};
}
