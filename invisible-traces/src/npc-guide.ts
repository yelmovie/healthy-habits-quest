export function mountNpcGuide(host:Element|null,{text}:{text:string}){
 if(!host)return ()=>{};
 const trigger=document.createElement('button');trigger.type='button';trigger.textContent='안내자 목소리 듣기';trigger.className='btn secondary';trigger.setAttribute('aria-haspopup','dialog');host.append(trigger);
 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','탐험 안내 음성');dialog.style.cssText='max-width:min(480px,calc(100vw - 32px));max-height:85dvh;overflow:auto;padding:24px;border:2px solid #789;border-radius:20px;color:#172b40;background:#fff';
 const caption=document.createElement('p');caption.textContent=text;caption.style.lineHeight='1.7';
 const label=document.createElement('p');label.textContent='AI로 만든 안내 음성 · 자막은 소리 없이도 볼 수 있어요.';
 const close=document.createElement('button');close.type='button';close.className='btn secondary';close.textContent='닫기';dialog.append(caption,label,close);document.body.append(dialog);
 trigger.onclick=()=>dialog.showModal();close.onclick=()=>dialog.close();dialog.onclose=()=>{if(trigger.isConnected)trigger.focus();};
 return ()=>{dialog.remove();trigger.remove();};
}
