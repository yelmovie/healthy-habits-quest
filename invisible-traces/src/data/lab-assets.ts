// Independent educational image; keep URLs compatible with subdirectory builds.
const base = import.meta.env?.BASE_URL ?? '/';
export const labAssets = Object.freeze({
  coughBefore: { src: base + 'assets/cough-before-20261108.webp', width: 427, height: 640 },
  coughCovered: { src: base + 'assets/cough-covered-20261108.webp', width: 427, height: 640 },
  waterGlass: { src: base + 'assets/water-glass-20261108.webp', width: 600, height: 657 },
});
