import { DATA, SITES } from '../data/game';
import { nextPlacement, placementKey, type State } from './model';

export type PlaybackKind = 'scan' | 'timeline' | 'lab' | 'comparison' | 'apply';
export type DemoStep =
  | { type: 'scan'; site: string; record: boolean }
  | { type: 'contact'; node: number }
  | { type: 'lab'; lab: string; value: 0 | 1 }
  | { type: 'hand'; zone: string; key: string }
  | { type: 'apply'; key: string };

export const playbackSpeed = (value: number) => [.5, 1, 2].includes(value) ? value : 1;
export const playbackDelay = (speed: number) => 1000 / playbackSpeed(speed);

// Automatic steps demonstrate observations or carry out an already chosen plan.
// Evidence selection, predictions, explanations and strategy choices stay with the learner.
export function demonstrationSteps(s: State, kind: PlaybackKind, lab = ''): DemoStep[] {
  if (kind === 'scan') return SITES.flatMap(site => [
    { type: 'scan', site: site.id, record: false } as DemoStep,
    { type: 'scan', site: site.id, record: true } as DemoStep,
  ]);
  if (kind === 'lab') {
    if (lab === 'contact') return DATA.p05.nodes.map((_, node) => ({ type: 'contact', node }));
    if (['droplet', 'air', 'saliva'].includes(lab)) return [{ type: 'lab', lab, value: 0 }, { type: 'lab', lab, value: 1 }];
    return [];
  }
  if (kind === 'apply' && s.final.phase === 'apply') {
    const p = nextPlacement(s);
    if (!p) return [];
    // Keep the immutable plan's keys so a queued step cannot apply a different action.
    return s.strategy.placements.filter(p => !s.final.applied.includes(placementKey(p))).flatMap(p => {
      const key = placementKey(p);
      return p.actionId === 'washHands'
        ? ['palm', 'back', 'fingers'].filter(zone => !s.final.hands.includes(zone)).map(zone => ({ type: 'hand', zone, key } as DemoStep))
        : [{ type: 'apply', key }];
    });
  }
  return [];
}
