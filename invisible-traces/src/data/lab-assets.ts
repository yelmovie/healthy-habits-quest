// Independent educational image; keep URLs compatible with subdirectory builds.
const base = import.meta.env?.BASE_URL ?? '/';
export const labAssets = Object.freeze({
  coughBefore: { src: base + 'assets/cough-before-20261108.webp', width: 427, height: 640 },
  coughUncovered: { src: base + 'assets/cough-uncovered-20261110.webp', width: 427, height: 640 },
  coughCovered: { src: base + 'assets/cough-covered-20261108.webp', width: 427, height: 640 },
  waterGlass: { src: base + 'assets/water-glass-20261108.webp', width: 600, height: 657 },
  windowClosed: { src: base + 'assets/window-closed-20261112.webp', width: 720, height: 480 },
  windowOpen: { src: base + 'assets/window-open-20261112.webp', width: 720, height: 480 },
  servingBowl: { src: base + 'assets/serving-bowl-20261112.webp', width: 720, height: 480 },
  personalPlate: { src: base + 'assets/personal-plate-20261112.webp', width: 720, height: 480 },
  handwashing: { src: base + 'assets/handwashing-20261112.webp', width: 720, height: 480 },
  handPalm: { src: base + 'assets/hand-palm-20261112.webp', width: 658, height: 720 },
});
