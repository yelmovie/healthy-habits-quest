import {bindDirectionPad,mapKeyDirection} from '../map-controls.js';
import Phaser from 'phaser';
import { mountMapEncounters,type MapReaction } from '../map-encounters.js';
import { encounterLook,encounterStage } from '../map-encounter-theme.js';
import {schoolBuildingPatch,schoolCelebration} from './school-restoration';
import { asset } from '../data/game';
import { MAP_SIZE, NODES, PLACES, START_NODE, type Point, nearestOnRoad, placeAt, placeHit, pointAlong, routeBetween, routeLength, step } from './school-map';

export interface MapOptions {
 start:Point|null;overview:boolean;reduced:boolean;signal?:AbortSignal;
 /** 미션 번호(0부터)별 입장 가능 여부와, 지금 해야 할 미션 번호(없으면 -1). */
 open:boolean[];next:number;done:boolean[];newly:number[];celebration:boolean;
 mapHits:Record<string,number>;encountersEnabled:boolean;onEncounterSave:(patch:Record<string,number>)=>void;onEncounterSound:(kind:'hit'|'finish'|'contact',hits:number)=>void;
 onSelect:(stage:number)=>void;onMove:(p:Point)=>void;onView:(mode:'follow'|'free'|'overview')=>void;onStop:(place:number)=>void;
}
export interface MapHandle { travel:(stage:number)=>Promise<boolean>;cancel:()=>void;destroy:()=>void }
type Direction = 'up'|'down'|'left'|'right';

const VECTORS:Record<Direction,Point> = {up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
const KEYS:Record<string,Direction> = {ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
const LABEL_TOP = 132, ROAD_TAP = 22, PAVEMENT_TAP = 70, WALK_SPEED = 150, TRAVEL_SPEED = 190, TRAVEL_MAX_SECONDS = 1.8, STRIDE = 13, MATE_GAP = 38, DRAG_START = 6;
const FRAME = {width:48,height:58}, HERO_STAND = 0, HERO_STEP = [1,2], MATE = 3;
const TEAM_OUTLINE='team-map-outline', PAD=2;
function outlineTeam(textures:Phaser.Textures.TextureManager){
 if(textures.exists(TEAM_OUTLINE))return;
 const source=textures.get('team').getSourceImage() as HTMLImageElement;
 const atlas=document.createElement('canvas'),mask=document.createElement('canvas');
 const width=FRAME.width+PAD*2,height=FRAME.height+PAD*2;
 atlas.width=width*4;atlas.height=mask.height=height;mask.width=width;
 const ctx=atlas.getContext('2d'),silhouette=mask.getContext('2d');if(!ctx||!silhouette)return;
 for(let i=0;i<4;i++){
  silhouette.clearRect(0,0,width,height);silhouette.globalCompositeOperation='source-over';
  silhouette.drawImage(source,i*FRAME.width,0,FRAME.width,FRAME.height,PAD,PAD,FRAME.width,FRAME.height);
  silhouette.globalCompositeOperation='source-in';silhouette.fillStyle='#fff4d2';silhouette.fillRect(0,0,width,height);
  for(let j=0;j<8;j++){const angle=j*Math.PI/4;ctx.drawImage(mask,i*width+Math.round(Math.cos(angle)),Math.round(Math.sin(angle)));}
  ctx.drawImage(source,i*FRAME.width,0,FRAME.width,FRAME.height,i*width+PAD,PAD,FRAME.width,FRAME.height);
 }
 const texture=textures.addCanvas(TEAM_OUTLINE,atlas);
 if(texture)for(let i=0;i<4;i++)texture.add(i,0,i*width,0,width,height);
}

export async function createMap(parent:HTMLElement,options:MapOptions):Promise<MapHandle>{
 const page=parent.parentElement!,labels=[...page.querySelectorAll<HTMLElement>('.map-place')];
 let resolveReady:()=>void=()=>{},rejectReady:(e:Error)=>void=()=>{};
 const ready=new Promise<void>((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 let active:SchoolMap|undefined;
 const encounters=mountMapEncounters({host:parent,stages:options.encountersEnabled?PLACES.flatMap((place,i)=>{
  const p=NODES[place.node],toward=NODES['plazaMid'],d=Math.hypot(toward.x-p.x,toward.y-p.y)||1;
  return options.done[i]?[encounterStage(i,i,place.name,{x:p.x+(toward.x-p.x)/d*18,y:p.y+(toward.y-p.y)/d*18})]:[];
 }):[],progress:options.mapHits,onSave:options.onEncounterSave,reduced:()=>options.reduced,
 blocked:()=>!!parent.closest('[inert]')||!!page.querySelector('.window-restoration[open]'),tone:options.onEncounterSound,reach:68,contact:19,...encounterLook});

 class SchoolMap extends Phaser.Scene {
  hero!:Phaser.GameObjects.Sprite;mate!:Phaser.GameObjects.Sprite;heroShadow!:Phaser.GameObjects.Ellipse;mateShadow!:Phaser.GameObjects.Ellipse;ring!:Phaser.GameObjects.Ellipse;
  pos:Point=options.start??NODES[START_NODE];held=new Map<string,Direction>();trail:Point[]=[];walked=0;facing=1;
  route:Point[]|null=null;routeDone=0;routeSpeed=TRAVEL_SPEED;arrived:((reached:boolean)=>void)|null=null;
  mode:'follow'|'free'|'overview'=options.overview?'overview':'follow';lastPlace=placeAt(this.pos);
  center:Point={...this.pos};freeZoom=1;
  prior:{mode:'follow'|'free';center:Point;zoom:number}|null=null;
  grab:{id:number;x:number;y:number;center:Point;moved:boolean}|null=null;
  fingers=new Map<number,Point>();pinch:{gap:number;ratio:number;point:Point}|null=null;
  constructor(){super('SchoolMap');}
  preload(){
   this.load.image('school',asset('school-map'));this.load.spritesheet('team',asset('map-team'),{frameWidth:FRAME.width,frameHeight:FRAME.height});
   if(options.encountersEnabled&&options.done.some(Boolean)){
    for(const name of ['hero','ally'])this.load.spritesheet('encounter-'+name,asset('map-encounters/'+name+'-redraw').replace(/\.webp$/,'.png'),{frameWidth:112,frameHeight:112});
   }
   this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR,(file:Phaser.Loader.File)=>{if(!file.key.startsWith('encounter-'))rejectReady(new Error('map asset failed'));});
  }
  create(){
   active=this;
   this.add.image(0,0,'school').setOrigin(0);
   this.drawRestoration();
   this.drawRoad();
   this.ring=this.add.ellipse(0,0,44,20).setStrokeStyle(2,0xffb545).setVisible(false);
   this.heroShadow=this.add.ellipse(0,0,28,9,0x12332f,.3);this.mateShadow=this.add.ellipse(0,0,26,8,0x12332f,.3);
   outlineTeam(this.textures);
   const art=this.textures.exists(TEAM_OUTLINE)?TEAM_OUTLINE:'team', foot=art===TEAM_OUTLINE?1-PAD/(FRAME.height+2*PAD):1;
   this.hero=this.add.sprite(0,0,art,HERO_STAND).setOrigin(.5,foot);this.mate=this.add.sprite(0,0,art,MATE).setOrigin(.5,foot);
   this.trail=[{x:this.pos.x-MATE_GAP*.6,y:this.pos.y+6}];
   this.placeTeam();
   if(options.next>=0&&!options.reduced){
    const stop=NODES[PLACES[options.next].node];this.ring.setPosition(stop.x,stop.y).setVisible(true);
    this.tweens.add({targets:this.ring,scale:{from:.7,to:1.25},alpha:{from:1,to:.15},duration:1100,repeat:-1});
   }
   this.input.on('pointerdown',this.pointerDown,this);this.input.on('pointermove',this.pointerMove,this);this.input.on('pointerup',this.pointerUp,this);this.input.on('pointerupoutside',this.pointerCancel,this);
   this.input.on('wheel',this.wheel,this);
   this.scale.on(Phaser.Scale.Events.RESIZE,this.applyView,this);
   this.game.events.on(Phaser.Core.Events.POST_RENDER,this.syncLabels,this);
   this.applyView();
   resolveReady();
  }
  drawRestoration(){
   const art=this.textures.get('school').getSourceImage() as HTMLImageElement;
   const lit=options.done.filter(Boolean).length;
   const tint=this.add.rectangle(0,0,MAP_SIZE.width,MAP_SIZE.height,0x223c61,.13*(1-lit/PLACES.length)).setOrigin(0).setDepth(2);
   if(!options.reduced&&options.newly.some(i=>i<5))this.tweens.add({targets:tint,alpha:{from:.13*(1-Math.max(0,lit-options.newly.filter(i=>i<5).length)/PLACES.length),to:.13*(1-lit/PLACES.length)},duration:1300,ease:'Sine.Out'});
   for(const [i,done] of options.done.entries()){
    const fresh=done&&!options.reduced&&options.newly.includes(i);
    const layer=(complete:boolean)=>{
     const {canvas,x,y}=schoolBuildingPatch(art,i,complete),key=`school-building-${i}-${complete}`;
     this.textures.addCanvas(key,canvas);
     return this.add.image(x,y,key).setOrigin(0).setDepth(complete?1:.5);
    };
    const current=layer(done);
    if(fresh){
     const before=layer(false).setDepth(1.5);
     this.tweens.add({targets:before,alpha:0,duration:900,ease:'Sine.Out',onComplete:()=>before.destroy()});
     this.tweens.add({targets:current,alpha:{from:0,to:1},duration:1000,ease:'Sine.Out'});
    }
   }
   if(options.celebration){
    const flags=schoolCelebration(this,{x:532,y:290});
    if(options.newly.includes(5)&&!options.reduced)this.tweens.add({targets:flags,alpha:{from:0,to:1},duration:1000,ease:'Sine.Out'});
   }
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
  coverZoom(){return Math.max(this.scale.width/MAP_SIZE.width,this.scale.height/MAP_SIZE.height);}
  followZoom(){return Math.max(1,this.coverZoom()*1.15);}
  paintCamera(target:Point,zoom:number,blend=1){
   const cam=this.cameras.main;
   const hw=this.scale.width/2/zoom,hh=this.scale.height/2/zoom;
   const x=this.center.x+(target.x-this.center.x)*blend,y=this.center.y+(target.y-this.center.y)*blend;
   this.center={x:hw*2>=MAP_SIZE.width?MAP_SIZE.width/2:Phaser.Math.Clamp(x,hw,MAP_SIZE.width-hw),y:hh*2>=MAP_SIZE.height?MAP_SIZE.height/2:Phaser.Math.Clamp(y,hh,MAP_SIZE.height-hh)};
   cam.setZoom(zoom);cam.centerOn(this.center.x,this.center.y);
  }
  applyView(){
   const cam=this.cameras.main;cam.setSize(this.scale.width,this.scale.height);
   if(this.mode==='overview')this.paintCamera({x:MAP_SIZE.width/2,y:MAP_SIZE.height/2},this.fitZoom());
   else if(this.mode==='free')this.paintCamera(this.center,this.followZoom()*this.freeZoom);
   else this.paintCamera({x:this.pos.x,y:this.pos.y+this.scale.height*.06/this.followZoom()},this.followZoom(),options.reduced?1:0);
   parent.classList.toggle('hand-on',this.mode==='free');
   page.querySelector('[data-action="map-hand"]')?.setAttribute('aria-pressed',String(this.mode==='free'));
   page.querySelector('[data-action="map-view"]')?.setAttribute('aria-pressed',String(this.mode==='overview'));
   options.onView(this.mode);
  }
  setMode(mode:'follow'|'free'|'overview',restore=false){
   if(this.mode===mode)return;
   if(mode==='overview'&&this.mode!=='overview')this.prior={mode:this.mode,center:{...this.center},zoom:this.freeZoom};
   if(restore&&this.prior){mode=this.prior.mode;this.center=this.prior.center;this.freeZoom=this.prior.zoom;}
   else if(mode==='free')this.freeZoom=this.cameras.main.zoom/this.followZoom();
   else if(mode==='follow')this.freeZoom=1;
   if(mode!=='overview')this.prior=null;
   this.mode=mode;this.applyView();
  }
  toggleView(){this.stopWalking();this.pointerCancel();this.setMode(this.mode==='overview'?'follow':'overview',this.mode==='overview');}
  zoomAt(ratio:number,world:Point,screen:Point){
   this.freeZoom=Phaser.Math.Clamp(ratio,this.fitZoom()/this.followZoom(),1.7);
   const zoom=this.followZoom()*this.freeZoom;
   this.paintCamera({x:world.x-(screen.x-this.scale.width/2)/zoom,y:world.y-(screen.y-this.scale.height/2)/zoom},zoom);
  }
  stopWalking(){this.held.clear();this.route=null;const done=this.arrived;this.arrived=null;done?.(false);}
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
  reaction(sprite:Phaser.GameObjects.Sprite,name:string,pose:MapReaction|null){
   const key='encounter-'+name,walkArt=this.textures.exists(TEAM_OUTLINE)?TEAM_OUTLINE:'team';
   if(!pose||!this.textures.exists(key)){if(sprite.texture.key!==walkArt)sprite.setTexture(walkArt).setScale(1).setOrigin(.5,walkArt===TEAM_OUTLINE?1-PAD/(FRAME.height+2*PAD):1);return;}
   const frame=pose.kind==='attack'?4+Number(pose.frame>0):pose.frame;
   sprite.setTexture(key,frame).setScale((name==='hero'?61:51)/(.84*112)).setOrigin(.5,.935);
   sprite.setFlipX(pose.direction>0);sprite.x+=pose.dx;
  }
  update(_time:number,delta:number){
   if(parent.closest('[inert]'))this.stopWalking(); // 안내창을 열면 지도 이동을 취소한다
   const dt=Math.min(delta,50)/1000;let walking=false;
   if(this.route){
    this.routeDone+=this.routeSpeed*dt;walking=this.moveTo(pointAlong(this.route,this.routeDone));
    if(this.routeDone>=routeLength(this.route)){this.route=null;const done=this.arrived;this.arrived=null;walking=false;this.notePlace(!done);done?.(true);}
   }else if(this.held.size){
    const dir=[...new Set(this.held.values())].reduce((sum,d)=>({x:sum.x+VECTORS[d].x,y:sum.y+VECTORS[d].y}),{x:0,y:0});
    walking=this.moveTo(step(this.pos,dir,WALK_SPEED*dt));this.notePlace(true);
   }
   // 걸음은 시간이 아니라 간 거리로 바꿔 어떤 화면에서도 발이 미끄러지지 않게 한다.
   const stride=Math.floor(this.walked/STRIDE)%2;
   this.reaction(this.hero,'hero',null);this.reaction(this.mate,'ally',null);
   this.hero.setFrame(walking?HERO_STEP[stride]:HERO_STAND).setFlipX(walking?this.facing>0:this.facing<0);
   this.mate.setFlipX(this.facing<0);
   this.placeTeam();
   if(walking){this.hero.y-=stride;this.mate.y-=1-stride;if(this.mode==='free')this.setMode('follow');}
   if(this.mode==='follow'){
    const zoom=this.followZoom(),ease=options.reduced?1:-Math.expm1(-delta/145);
    this.paintCamera({x:this.pos.x,y:this.pos.y+this.scale.height*.06/zoom},zoom,ease);
   }
   const cam=this.cameras.main;
   const reactions=encounters.update({hero:this.pos,ally:this.trail[0],scale:cam.zoom,project:p=>({x:(p.x-this.center.x)*cam.zoom+this.scale.width/2,y:(p.y-this.center.y)*cam.zoom+this.scale.height/2})});
   if(reactions.hero)this.reaction(this.hero,'hero',reactions.hero);if(reactions.ally)this.reaction(this.mate,'ally',reactions.ally);
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
  press(dir:Direction,source:string=dir){if(this.route)this.stopWalking();this.pointerCancel();this.held.set(source,dir);if(this.mode!=='follow')this.setMode('follow');}
  nudge(dir:Direction){if(this.route)this.stopWalking();this.pointerCancel();this.setMode('follow');const target=step(this.pos,VECTORS[dir],34);if(target!==this.pos)this.walkTo(target);}
  enter(){const here=placeAt(this.pos);if(here>=0&&options.open[here])options.onSelect(here+1);}
  travel(stage:number){this.stopWalking();const stop=NODES[PLACES[stage-1].node];if(placeAt(this.pos)===stage-1)return Promise.resolve(true);return new Promise<boolean>(resolve=>{this.arrived=resolve;this.walkTo(stop);});}
  gesture(){const [a,b]=this.fingers.values();return {x:(a.x+b.x)/2,y:(a.y+b.y)/2,gap:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))};}
  pointerDown(pointer:Phaser.Input.Pointer){
   if(pointer.button!==0||parent.closest('[inert]'))return;
   this.fingers.set(pointer.id,{x:pointer.x,y:pointer.y});
   if(this.fingers.size===1)this.grab={id:pointer.id,x:pointer.x,y:pointer.y,center:{...this.center},moved:false};
   if(this.fingers.size===2){const at=this.gesture(),cam=this.cameras.main;this.pinch={gap:at.gap,ratio:cam.zoom/this.followZoom(),point:cam.getWorldPoint(at.x,at.y)};this.grab=null;this.stopWalking();this.setMode('free');parent.classList.add('grabbing');}
  }
  pointerMove(pointer:Phaser.Input.Pointer){
   if(!pointer.isDown||!this.fingers.has(pointer.id)||parent.closest('[inert]'))return;
   this.fingers.set(pointer.id,{x:pointer.x,y:pointer.y});
   if(this.pinch&&this.fingers.size>=2){const at=this.gesture();this.zoomAt(this.pinch.ratio*at.gap/this.pinch.gap,this.pinch.point,at);return;}
   const grab=this.grab;if(!grab||grab.id!==pointer.id||this.mode==='overview')return;
   const dx=pointer.x-grab.x,dy=pointer.y-grab.y;if(!grab.moved&&Math.hypot(dx,dy)<DRAG_START)return;
   const cam=this.cameras.main;
   if(!grab.moved){grab.moved=true;this.stopWalking();this.setMode('free');parent.classList.add('grabbing');}
   this.paintCamera({x:grab.center.x-dx/cam.zoom,y:grab.center.y-dy/cam.zoom},cam.zoom);
  }
  wheel(pointer:Phaser.Input.Pointer,_objects:unknown[],_dx:number,dy:number,_dz:number){
   if(parent.closest('[inert]'))return;
   const cam=this.cameras.main,point=cam.getWorldPoint(pointer.x,pointer.y),ratio=cam.zoom/this.followZoom();
   this.stopWalking();this.setMode('free');this.zoomAt(ratio*Math.exp(-dy*.0015),point,pointer);
  }
  pointerCancel(pointer?:Phaser.Input.Pointer){
   if(pointer)this.fingers.delete(pointer.id);else this.fingers.clear();
   if(this.fingers.size<2)this.pinch=null;
   if(!pointer||this.grab?.id===pointer.id)this.grab=null;
   if(!this.fingers.size)parent.classList.remove('grabbing');
  }
  pointerUp(pointer:Phaser.Input.Pointer){
   const grab=this.grab;this.pointerCancel(pointer);if(!grab||grab.id!==pointer.id||grab.moved||this.mode==='free')return;
   const world=this.cameras.main.getWorldPoint(pointer.x,pointer.y),road=nearestOnRoad(world);
   // 길을 정확히 누르지 않아도 걷게 하되, 건물을 누르면 그 장소로 간다.
   const place=road.gap>ROAD_TAP?placeHit(world):-1;
   if(place>=0){if(options.open[place])options.onSelect(place+1);else options.onStop(place);}
   else if(road.gap<=PAVEMENT_TAP){this.stopWalking();this.walkTo(road.point);}
  }
  syncLabels(){
   const cam=this.cameras.main,cx=cam.midPoint.x,cy=cam.midPoint.y,w=this.scale.width/2,h=this.scale.height/2;
   // 위쪽 도구 줄 아래로만 내려오게 해서 이름표가 버튼에 가리지 않게 한다.
   const blocked=[...document.querySelectorAll<HTMLElement>('.topbar,.map-controls,.map-next,.window-restoration,.map-status')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());
   const placed:DOMRect[]=[];
   const overlaps=(a:DOMRect,b:DOMRect)=>a.left<b.right+6&&a.right>b.left-6&&a.top<b.bottom+6&&a.bottom>b.top-6;
   labels.forEach((label,i)=>{const p=PLACES[i].label,x=Math.round((p.x-cx)*cam.zoom+w),y=Math.max(LABEL_TOP,Math.round((p.y-cy)*cam.zoom+h));label.style.transform=`translate(${x}px,${y}px) translate(-50%,-100%)`;const r=label.getBoundingClientRect();const clear=r.left>=8&&r.right<=innerWidth-8&&r.top>=8&&r.bottom<=innerHeight-8&&!blocked.some(b=>overlaps(r,b))&&!placed.some(b=>overlaps(r,b));label.style.visibility=clear?'visible':'hidden';if(clear)placed.push(r);});
  }
 }

 const game=new Phaser.Game({type:Phaser.AUTO,parent,width:parent.clientWidth||MAP_SIZE.width,height:parent.clientHeight||MAP_SIZE.height,pixelArt:true,backgroundColor:'#103e43',scale:{mode:Phaser.Scale.RESIZE},input:{activePointers:3},scene:[SchoolMap],audio:{noAudio:true},banner:false,render:{antialias:false}});
 const controls=new AbortController(),{signal}=controls;let destroyed=false;
 const destroy=()=>{if(destroyed)return;destroyed=true;encounters.destroy();controls.abort();active?.stopWalking();game.destroy(true);};
 const cancel=()=>rejectReady(new Error('map cancelled'));
 if(options.signal?.aborted)cancel();
 else options.signal?.addEventListener('abort',cancel,{once:true});
 try{await ready;}catch(error){destroy();throw error;}
 finally{options.signal?.removeEventListener('abort',cancel);}
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
 addEventListener('blur',()=>{scene.stopWalking();scene.pointerCancel();},{signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){scene.stopWalking();scene.pointerCancel();}},{signal});
 page.classList.add('ready');
 return {travel:stage=>destroyed?Promise.resolve(false):scene.travel(stage),cancel:()=>scene.stopWalking(),destroy};
}
