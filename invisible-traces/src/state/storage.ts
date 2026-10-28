import {fresh,sanitize,type State} from '../simulation/model';
export const SAVE_KEY='invisible-traces-science-save-v1';
export function readSave():{state:State;error:string|null} {try{const raw=localStorage.getItem(SAVE_KEY);return {state:raw?sanitize(JSON.parse(raw)):fresh(),error:null};}catch(e){return {state:fresh(),error:e instanceof Error?e.message:'저장 기록을 읽지 못했어요.'};}}
export function writeSave(s:State):boolean {try{localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{return false;}}
