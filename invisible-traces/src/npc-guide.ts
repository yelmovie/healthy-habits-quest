import './npc-scene.css';

type GuideOptions={text:string;stop:()=>void;reduced:()=>boolean;closed?:()=>void};
const names=['과학 조사원','기록 파트너'] as const;
const sheets=['detective','recorder'] as const;
const lineIds=['intro-1','title-1'] as const;

// 설정의 「조사팀과 대화하기」가 연다. 닫으면 대화창을 지운다. 돌려주는 함수는 열린 대화창을 닫고 지운다.
export function openNpcGuide({text,stop,reduced,closed}:GuideOptions){
  const makeButton=(label:string,cls:string)=>Object.assign(document.createElement('button'),{type:'button',textContent:label,className:cls});
  const dialog=document.createElement('dialog');dialog.className='npc-stage-dialog';dialog.setAttribute('aria-labelledby','investigation-npc-name');
  const stage=document.createElement('section');stage.className='npc-stage';stage.dataset.speaking='false';
  const art=document.createElement('div');art.className='npc-stage-art';
  const portrait=document.createElement('span');portrait.className='npc-stage-portrait';portrait.setAttribute('aria-hidden','true');art.append(portrait);
  const panel=document.createElement('div');panel.className='npc-stage-panel';
  const name=document.createElement('h2');name.id='investigation-npc-name';
  const caption=document.createElement('p');caption.className='npc-stage-caption';
  const footer=document.createElement('div');footer.className='npc-stage-actions';footer.dataset.narrationHost='';
  const change=makeButton('기록 파트너에게 묻기','npc-stage-button');change.dataset.npcSwitch='';
  const close=makeButton('닫기','npc-stage-button npc-stage-primary');
  footer.append(change,close);panel.append(name,caption,footer);stage.append(art,panel);dialog.append(stage);document.body.append(dialog);
  let i=0,disposed=false;
  const texts=[text,'우리 학교에 남은 흔적을 찾아 줘!'];
  function showLine(){
    stage.dataset.lineId=lineIds[i];stage.dataset.speaking='false';
    name.textContent=names[i];caption.textContent=texts[i];
    const sheet = new URL(`${import.meta.env.BASE_URL}assets/dialogue/${sheets[i]}.webp`, document.baseURI);
    portrait.style.setProperty('--npc-portrait', `url("${sheet.href}")`);
    change.textContent=(i===0?'기록 파트너':'과학 조사원')+'에게 묻기';
  }
  change.onclick=()=>{if(change.disabled)return;stop();i=1-i;showLine();close.focus({preventScroll:true});};
  close.onclick=()=>{stop();dialog.close();};dialog.oncancel=stop;
  dialog.onclick=e=>{if(e.target===dialog){stop();dialog.close();}};
  dialog.onclose=()=>{stop();dialog.remove();if(!disposed)closed?.();};
  stage.dataset.reduced=String(reduced());showLine();dialog.showModal();close.focus({preventScroll:true});
  return ()=>{disposed=true;if(dialog.open){stop();dialog.close();}dialog.remove();};
}
