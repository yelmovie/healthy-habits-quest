import { DATA, asset } from '../data/game';
import { labAssets } from '../data/lab-assets';
import { icon } from './icons';
import type { View } from './render';

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
  return `<img class="window-illustration" src="${art.src}" width="${art.width}" height="${art.height}" alt="${open ? '왼쪽 창짝을 오른쪽으로 밀어 연 창문' : '닫힌 창문'}" draggable="false"><div class="air-streams" aria-hidden="true">${icon('arrow',70)}${icon('arrow',70)}</div>`;
}

export function playbackControls(v: View, kind: string): string {
  const active = v.playing && v.autoMode === kind;
  return `<div class="playback-controls" aria-label="실험 자동재생"><button class="btn ${active ? 'selected' : 'secondary'} playback-toggle" data-action="auto-play" data-kind="${kind}" aria-pressed="${active}">${icon(active ? 'pause' : 'play', 20)}<span>${active ? '직접 해보기' : '자동재생'}</span></button><label class="playback-speed"><span>속도</span><select aria-label="자동재생 속도" data-select="playback-speed">${[.5,1,2].map(speed=>`<option value="${speed}" ${v.speed===speed?'selected':''}>${speed}배</option>`).join('')}</select></label><span class="playback-state" role="status">${active ? '과정을 함께 관찰해요' : '직접 조작할 수도 있어요'}</span></div>`;
}
