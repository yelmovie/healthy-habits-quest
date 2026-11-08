import {fresh,sanitize,type State} from '../simulation/model';
export const SAVE_KEY='invisible-traces-science-save-v1';
export const RESET_BACKUP_KEY=SAVE_KEY+':before-reset';
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
// Compare the exact last-read bytes before saving. A stale tab never replaces a newer record.
export function createSaveStore(io:StoragePort){
 let observed:string|null=null,ready=false,blocked=false,message:string|null=null;
 const fail=(text:string)=>{blocked=true;message=text;return false;};
 function read():{state:State;error:string|null}{
  try{observed=io.getItem(SAVE_KEY);ready=true;const state=observed?sanitize(JSON.parse(observed)):fresh();blocked=false;message=null;return {state,error:null};}
  catch{blocked=true;message='기존 기록을 읽지 못했어요. 원문을 보호하며 임시로 탐구해요.';return {state:fresh(),error:message};}
 }
 function unchanged(){if(!ready)return fail('저장소를 읽지 못해 임시로 탐구하고 있어요.');if(io.getItem(SAVE_KEY)!==observed)return fail('다른 창에서 기록이 바뀌었어요. 덮어쓰지 않도록 저장을 멈췄어요.');return true;}
 function write(s:State){if(blocked)return false;try{if(!unchanged())return false;const raw=JSON.stringify(s);io.setItem(SAVE_KEY,raw);observed=raw;message=null;return true;}catch{return fail('이 기기에 저장하지 못했어요. 창을 닫으면 지금 탐구가 사라질 수 있어요.');}}
 function reset(s:State){try{if(!unchanged())return false;if(observed!==null){let key=RESET_BACKUP_KEY,index=0;while(io.getItem(key)!==null)key=RESET_BACKUP_KEY+':'+(++index);io.setItem(key,observed);}const raw=JSON.stringify(s);io.setItem(SAVE_KEY,raw);observed=raw;blocked=false;message=null;return true;}catch{return fail('기존 기록을 백업하거나 새 기록을 저장하지 못해 초기화를 취소했어요.');}}
 return {read,write,reset,error:()=>message};
}
// Resolve browser storage lazily, so a blocked browser storage getter is handled too.
const store=createSaveStore({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)});
export const readSave=store.read,writeSave=store.write,resetSave=store.reset,saveError=store.error;
