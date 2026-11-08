// 빌드 결과(dist)의 파일 목록을 precache-manifest.json으로 남긴다.
// 서비스워커가 설치될 때 이 목록을 모두 캐시해, 첫 방문 뒤에는 Wi-Fi가 끊겨도 앱이 열리게 한다.
import { appendFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const files = [];
const walk = dir => {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('._') || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(relative(dist, full).split('\\').join('/'));
  }
};
walk(dist);
const list = files.filter(f => f !== 'sw.js' && f !== 'precache-manifest.json').sort();
const version = Date.now().toString(36);
writeFileSync(join(dist, 'precache-manifest.json'), JSON.stringify({ version, files: ['./', ...list] }, null, 1));
// 서비스워커 파일 자체가 바뀌어야 브라우저가 새 버전을 설치한다. 배포마다 버전을 찍어 둔다.
appendFileSync(join(dist, 'sw.js'), `\n// build ${version}\n`);
console.log(`precache-manifest.json: ${list.length} files`);
