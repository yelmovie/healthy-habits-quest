// 오프라인 대비 서비스워커. 프로덕션 빌드에서만 등록된다(src/main.ts).
// HTML·JS·CSS·JSON은 네트워크 우선(새 배포가 바로 반영), 그림은 캐시 우선.
const PREFIX = 'invisible-traces-';
let cacheName = PREFIX + 'runtime';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const res = await fetch('./precache-manifest.json', { cache: 'no-store' });
    const { version, files } = await res.json();
    cacheName = PREFIX + version;
    const cache = await caches.open(cacheName);
    await cache.addAll(files);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // 버전 이름은 빌드 시각(36진수)이라 정렬하면 마지막이 최신이다.
    const current = keys.filter(k => k.startsWith(PREFIX) && k !== PREFIX + 'runtime').sort().pop();
    if (current) cacheName = current;
    // 새 버전이 켜지면 이전 버전 캐시와 런타임 캐시를 비운다(새 목록이 이미 전부 캐시돼 있다).
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== current).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isImage = req.destination === 'image' || /\.(webp|png|jpg|svg)$/.test(new URL(req.url).pathname);
  event.respondWith(isImage ? cacheFirst(req) : networkFirst(req));
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) (await caches.open(PREFIX + 'runtime')).put(req, res.clone());
    return res;
  } catch {
    const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate', ignoreVary: true });
    return hit ?? (req.mode === 'navigate' ? caches.match('./', { ignoreVary: true }) : Response.error());
  }
}

async function cacheFirst(req) {
  const hit = await caches.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(PREFIX + 'runtime')).put(req, res.clone());
  return res;
}
