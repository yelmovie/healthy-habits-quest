import { DATA, asset } from '../data/game';
import { labAssets } from '../data/lab-assets';
import { icon } from './icons';
import type { View } from './render';

// 제작·저작권 표기: 시작 화면·설정 앱 정보·인증서에 같은 문구를 쓴다.
export const CREDIT='기획·제작: 옐샘 &amp; ⓒ 아이스크림미디어';

export const btn = (label: string, action: string, cls = 'secondary', extra = '') =>
  `<button class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
export const chip = (name: string, label: string, cls = '') =>
  `<span class="chip ${cls}">${icon(name, 17)}${label}</span>`;
export const image = (name: string, cls = '', alt = '') =>
  `<img class="${cls}" src="${asset(name)}" alt="${alt}" draggable="false">`;
export const note = (text: string) =>
  `<div class="note">${icon('info', 19)}<span>${text}</span></div>`;
export const actionName = (id: string) => DATA.p07.actionPool.find(a => a.id === id)?.name ?? id;

export function windowIllustration(open: boolean): string {
  const art = open ? labAssets.windowOpen : labAssets.windowClosed;
  return `<img class="window-illustration" src="${art.src}" width="${art.width}" height="${art.height}" alt="${open ? '왼쪽 창짝을 오른쪽으로 밀어 연 창문' : '닫힌 창문'}" draggable="false"><span class="air-streams" aria-hidden="true">${icon('arrow',70)}${icon('arrow',70)}</span>`;
}

export function playbackControls(v: View, kind: string): string {
  const active = v.playing && v.autoMode === kind;
  // 관찰용 재생만 남긴다(과학34 공통 표기: 자동재생 ↔ 직접 해보기). 속도 선택은 버튼을 늘리기만 해서 뺐다.
  return `<div class="playback-controls" aria-label="과정 재생"><button class="btn ${active ? 'selected' : 'secondary'} playback-toggle" data-action="auto-play" data-kind="${kind}" aria-pressed="${active}">${icon(active ? 'pause' : 'play', 20)}<span>${active ? '직접 해보기' : '자동재생'}</span></button><span class="playback-state" role="status">${active ? '과정을 함께 관찰해요' : '직접 조작할 수도 있어요'}</span></div>`;
}
