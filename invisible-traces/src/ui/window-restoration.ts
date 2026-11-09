import type {State} from '../simulation/model';
import {STAGES} from '../data/game';
export function advanceWindowRestoration(state:State,key:string,step:number){
 if(!state.evidence.includes(key)||step!==(state.restoration?.[key]??0)+1||step>2)return false;
 state.restoration={...state.restoration,[key]:step};return true;
}
export function mountWindowRestoration(host:HTMLElement,state:State,save:()=>void,sound:()=>void){
 if(!host||!state.evidence.length)return;
 let key=state.evidence.find(k=>(state.restoration?.[k]??0)<2)??state.evidence[0],opening=0;
 const panel=document.createElement('details');panel.className='window-restoration';host.append(panel);
 function draw(){const step=state.restoration?.[key]??0,stage=Number(key.slice(1))-1;
 panel.innerHTML=`<summary>☀ ${step===2?'건강 실천 표지 완성':'건강한 학교 복구'} · ${step}/2</summary><div class="window-work"><label>복구할 조사 장소 <select aria-label="복구할 조사 장소">${state.evidence.map(k=>`<option value="${k}" ${k===key?'selected':''}>${STAGES[Number(k.slice(1))-1].name}</option>`).join('')}</select></label><div class="school-window ${step>0?'open':''} ${step===2?'healthy':''}"><div class="window-view" aria-hidden="true">☀ <span>〰 〰 〰</span></div><div class="window-pane" style="transform:perspective(300px) rotateY(-${step>0?75:opening*.75}deg)" aria-hidden="true"><i></i></div>${step===2?'<div class="practice-sign">✓ 환기해요<br><small>예방 실천을 함께해요</small></div>':''}</div>${step===0?'<label class="window-handle">창문 손잡이 밀기 <input type="range" aria-label="창문 열기" min="0" max="100" step="10" value="0"></label><button data-open>손잡이를 잡아 창문 열기 ↗</button>':step===1?'<button data-sign class="practice-card">✓ 환기해요<br><small>창문 옆에 실천 표지 붙이기</small></button>':'<p class="window-success">햇빛과 바람이 들어왔어!</p>'}<p role="status">${step===0?'창문을 열어 공기가 드나들게 해 줘.':step===1?'환기는 감염 예방에 도움이 되는 실천이야. 표지를 붙여 친구들에게 알려 줘.':'실천 표지를 완성했어. 손 씻기와 기침 예절도 함께 실천해 줘.'}</p><button data-fold>지도 계속 보기</button></div>`;
 const focus=(selector:string)=>panel.querySelector<HTMLElement>(selector)?.focus();
 function advance(){if(!advanceWindowRestoration(state,key,step+1))return;save();sound();draw();focus(step===0?'[data-sign]':'[data-fold]');}
 panel.querySelector('select')!.onchange=e=>{key=(e.target as HTMLSelectElement).value;opening=0;draw();focus('select');};
 const slider=panel.querySelector<HTMLInputElement>('input');if(slider)slider.oninput=()=>{opening=+slider.value;panel.querySelector<HTMLElement>('.window-pane')!.style.transform=`perspective(300px) rotateY(-${opening*.75}deg)`;if(opening===100)advance();};
 const open=panel.querySelector<HTMLButtonElement>('[data-open]');if(open)open.onclick=advance;
 const sign=panel.querySelector<HTMLButtonElement>('[data-sign]');if(sign)sign.onclick=advance;
 panel.querySelector<HTMLButtonElement>('[data-fold]')!.onclick=()=>{panel.open=false;focus('summary');};
 }
 panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){panel.open=false;panel.querySelector('summary')?.focus();}});draw();
}
