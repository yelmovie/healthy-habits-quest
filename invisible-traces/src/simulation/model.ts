import { DATA, LABS } from '../data/game';
export type Route = 'C00'|'C01'|`P${string}`;
export interface Placement { actionId:string; site:string }
export interface State {
 version:1; contentVersion:string; route:Route; lastRoute:Route;
 settings:{sound:boolean;reduced:boolean;large:boolean};
 found:string[]; clues:string[]; relations:Record<string,string>; impacts:Record<string,string>;
 timeline:{tick:number;source:string;intervention:number|null};
 labs:{done:string[];values:Record<string,number>;synthesis:string[]};
 experiment:{action:string;prediction:string;tick:number;pinned:string;explanation:string;baselineSeen:boolean};
 strategy:{asked:string[];placements:Placement[];simulated:boolean};
 final:{phase:'report'|'apply'|'restored'|'ending'|'certificate';applied:string[];hands:string[];coreClaimed:boolean};
 completed:string[]; evidence:string[];
}
export const fresh = ():State => ({version:1,contentVersion:DATA.contentVersion,route:'C00',lastRoute:'C01',settings:{sound:true,reduced:false,large:false},found:[],clues:[],relations:{},impacts:{},timeline:{tick:5,source:'',intervention:null},labs:{done:[],values:{},synthesis:[]},experiment:{action:'',prediction:'',tick:0,pinned:'',explanation:'',baselineSeen:false},strategy:{asked:[],placements:[],simulated:false},final:{phase:'report',applied:[],hands:[],coreClaimed:false},completed:[],evidence:[]});
export function contactAt(tick:number,intervention:number|null=null): Set<string> {
 const trace = new Set(DATA.p05.initialTrace);
 const events:({tick:number;id:string;from?:string;to?:string;wash?:boolean})[] = DATA.p05.events.map(e=>({...e}));
 if(intervention!==null) events.push({id:'wash',tick:intervention,wash:true});
 for(const e of events.sort((a,b)=>a.tick-b.tick||a.id.localeCompare(b.id))){if(e.tick>tick)break;if(e.wash)trace.delete('studentA');else if(e.from&&e.to&&trace.has(e.from))trace.add(e.to);}
 return trace;
}
export function branches(s:State) { return DATA.p03.acceptedBranches.filter(b=>b.requiresAll.every(([from,to])=>s.relations[from]===to)).length; }
export function planCost(p:Placement[]) { return p.reduce((sum,p)=>sum+(DATA.p09.actions.find(a=>a.id===p.actionId)?.cost??99),0); }
export const placementKey=(p:Placement)=>`${p.site}:${p.actionId}`;
export function validPlacement(p:Placement){return DATA.p09.actions.some(a=>a.id===p.actionId&&(a.sites as string[]).includes(p.site));}
export function planResult(p:Placement[]) {
 const keys=p.map(placementKey);const valid=keys.length===new Set(keys).size&&p.every(validPlacement)&&planCost(p)<=DATA.p09.energyBudget;
 const resolved=Object.entries(DATA.p09.requiredActions).filter(([site,actions])=>actions.every(actionId=>p.some(p=>p.site===site&&p.actionId===actionId))).map(([site])=>site);
 return {valid,resolved,success:valid&&resolved.length===3};
}
export function addPlacement(s:State,p:Placement):'ok'|'duplicate'|'wrong-site'|'budget' {
 if(!validPlacement(p))return 'wrong-site';if(s.strategy.placements.some(x=>placementKey(x)===placementKey(p)))return 'duplicate';
 if(planCost([...s.strategy.placements,p])>5)return 'budget';s.strategy.placements.push(p);s.strategy.simulated=false;return 'ok';
}
export function derive(s:State):State {
 const done:string[]=[]; const pass=(id:string,ok:boolean)=>{if(ok)done.push(id);return ok;};
 const one=pass('P01',DATA.p01.requiredSites.every(x=>s.found.includes(x)));
 const two=pass('P02',one&&s.clues.length===5&&DATA.p02.requiredClues.every(x=>s.clues.includes(x)));
 const three=pass('P03',two&&branches(s)>=2);
 const four=pass('P04',three&&DATA.p04.links.every(x=>s.impacts[x.domain]===x.id));
 const five=pass('P05',four&&s.timeline.source==='book'&&s.timeline.intervention===1.5);
 const six=pass('P06',five&&LABS.every(x=>s.labs.done.includes(x.id))&&['coughEtiquette','ventilation'].every(x=>s.labs.synthesis.includes(x)));
 const action=DATA.p07.actionPool.find(a=>a.id===s.experiment.action);
 const seven=pass('P07',six&&!!action&&['fewer','same','unsure'].includes(s.experiment.prediction)&&s.experiment.baselineSeen);
 const eight=pass('P08',seven&&!!action&&s.experiment.pinned===action.differenceEvent&&s.experiment.explanation===action.metric);
 const nine=pass('P09',eight&&s.strategy.simulated&&planResult(s.strategy.placements).success);
 const ten=pass('P10',nine&&s.strategy.placements.every(p=>s.final.applied.includes(placementKey(p))));
 s.completed=done;s.evidence=[two?'E1':'',four?'E2':'',six?'E3':'',eight?'E4':'',nine?'E5':''].filter(Boolean);
 if(ten){s.final.coreClaimed=true;if(s.final.phase==='apply'||s.final.phase==='report')s.final.phase='restored';}
 return s;
}
const uniq=(v:unknown,allowed:string[],max=100):string[]=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'&&allowed.includes(x)))].slice(0,max):[];
const record=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{};
const num=(v:unknown,min:number,max:number,def:number)=>typeof v==='number'&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):def;
const str=(v:unknown,allowed:string[],def='')=>typeof v==='string'&&allowed.includes(v)?v:def;
export function sanitize(input:unknown):State {
 const r=record(input);if(r.version!==1||r.contentVersion!==DATA.contentVersion)throw new Error('이전 형식의 기록이 있어요. 새 연구를 시작하거나 원래 버전에서 확인해 주세요.');
 const s=fresh(),settings=record(r.settings),tl=record(r.timeline),labs=record(r.labs),ex=record(r.experiment),st=record(r.strategy),fin=record(r.final);
 for(const k of ['sound','reduced','large'] as const)if(typeof settings[k]==='boolean')s.settings[k]=settings[k] as boolean;
 s.found=uniq(r.found,DATA.p01.requiredSites);s.clues=uniq(r.clues,DATA.clues.map(c=>c.id),5);
 for(const [a,b]of Object.entries(record(r.relations)))if(DATA.p03.sourceNodes.includes(a)&&['contact','shared-environment','respiratory','meal'].includes(String(b)))s.relations[a]=String(b);
 for(const [a,b]of Object.entries(record(r.impacts)))if(DATA.p04.links.some(x=>x.domain===a&&x.id===b))s.impacts[a]=String(b);
 s.timeline={tick:num(tl.tick,0,5,5),source:str(tl.source,DATA.p05.nodes),intervention:typeof tl.intervention==='number'&&DATA.p05.intervention.allowedTicks.includes(tl.intervention)?tl.intervention:null};
 s.labs.done=uniq(labs.done,LABS.map(l=>l.id));for(const [a,b]of Object.entries(record(labs.values)))if(['droplet','air','water','saliva'].includes(a))s.labs.values[a]=num(b,0,1,0);
 s.labs.synthesis=uniq(labs.synthesis,['coughEtiquette','ventilation','washHands']);
 const action=DATA.p07.actionPool.find(a=>a.id===ex.action);s.experiment={action:action?.id??'',prediction:str(ex.prediction,['fewer','same','unsure']),tick:num(ex.tick,0,5,0),pinned:str(ex.pinned,DATA.p07.events.map(e=>e.id)),explanation:str(ex.explanation,DATA.p07.actionPool.map(a=>a.metric)),baselineSeen:ex.baselineSeen===true};
 s.strategy.asked=uniq(st.asked,DATA.p09.questions.map(q=>q.id),3);
 if(Array.isArray(st.placements))for(const entry of st.placements.slice(0,20)){const p=record(entry);addPlacement(s,{actionId:String(p.actionId),site:String(p.site)});}
 s.strategy.simulated=st.simulated===true;
 s.final.applied=uniq(fin.applied,s.strategy.placements.map(placementKey));s.final.hands=uniq(fin.hands,['palm','back','fingers']);
 s.final.phase=str(fin.phase,['report','apply','restored','ending','certificate'],'report') as State['final']['phase'];derive(s);
 if(!s.completed.includes('P10')&&['restored','ending','certificate'].includes(s.final.phase))s.final.phase='apply';
 const route=str(r.route,['C00','C01',...DATA.pages.map(p=>p.id)],'C00') as Route;
 s.lastRoute=str(r.lastRoute,['C01',...DATA.pages.map(p=>p.id)],'C01') as Route;
 s.route=canEnter(s,route)?route:'C01';if(!canEnter(s,s.lastRoute))s.lastRoute='C01';return s;
}
export function canEnter(s:State,route:Route){if(route==='C00'||route==='C01')return true;const i=DATA.pages.findIndex(p=>p.id===route);return i===0||(i>0&&s.completed.includes(DATA.pages[i-1].id));}
export function fixtureFor(stage:number,settings:State['settings']):State {
 const s=fresh();s.settings={...settings};if(stage>1){s.found=[...DATA.p01.requiredSites];s.clues=[...DATA.p02.requiredClues];}
 if(stage>2){for(const b of DATA.p03.acceptedBranches)for(const [from,to]of b.requiresAll)s.relations[from]=to;for(const x of DATA.p04.links)s.impacts[x.domain]=x.id;}
 if(stage>3){s.timeline.source='book';s.timeline.intervention=1.5;s.labs.done=LABS.map(x=>x.id);s.labs.values={droplet:1,air:1,water:1,saliva:1};s.labs.synthesis=['coughEtiquette','ventilation'];}
 if(stage>4){s.experiment={action:'washHands',prediction:'fewer',tick:5,pinned:'before-meal',explanation:'hand-object-contact',baselineSeen:true};}
 s.route=DATA.stages[stage-1].pages[0] as Route;s.lastRoute=s.route;return derive(s);
}
