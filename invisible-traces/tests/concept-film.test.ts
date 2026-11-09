import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');

test('개념 영상: 연구 기록이 같은 이름의 webm·mp4·포스터를 쓰고 파일이 있다', () => {
  const recall = read('src/ui/concept-recall.ts');
  assert.match(recall, /assets\/cough-etiquette-film/);
  for (const ext of ['webm', 'mp4']) assert.match(recall, new RegExp(`\\$\\{film\\}\\.${ext}`));
  assert.match(recall, /poster="\$\{film\}-poster\.webp"/);
  for (const f of ['cough-etiquette-film.webm', 'cough-etiquette-film.mp4', 'cough-etiquette-film-poster.webp']) {
    const size = statSync(new URL(`public/assets/${f}`, root)).size;
    assert.ok(size > 10_000 && size < 2.5 * 1024 * 1024, `${f} ${size}`);
  }
});

test('개념 영상: 안내 문구의 길이가 HyperFrames 소스 길이와 맞다', () => {
  const html = readFileSync(new URL('../films/cough-etiquette/index.html', root), 'utf8');
  const seconds = Number(html.match(/data-composition-id="main"[^>]*data-duration="([\d.]+)"/)![1]);
  const recall = read('src/ui/concept-recall.ts');
  const label = Number(recall.match(/\((\d+)초, 소리 없음\)/)![1]);
  assert.equal(label, Math.floor(seconds));
  assert.match(recall, new RegExp(`${label}초 영상`));
});
