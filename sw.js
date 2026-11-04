// 기갈 서바이버 서비스 워커 — 배포할 때마다 VERSION을 올린다
const VERSION = 'v111';
const CACHE = 'gigal-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png', './fx/pstar.png', './fx/pimp.png', './fx/rune.png', './fx/ghost.png', './fx/cubeB.png', './fx/fnova.png', './fx/scharge.png', './fx/amiss.png', './fx/lsteal.png', './fx/pet_slime.png', './fx/pet_wisp.png', './fx/pet_butterfly.png', './fx/pet_ghost.png', './fx/iris.png', './fx/hx_polaris.png', './fx/hx_soulwed.png', './fx/hx_glass.png'];
// GitHub Pages는 HTTP 캐시(10분)를 쓰므로 반드시 cache:'reload'로 새 파일을 받는다
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('gigal-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return; // 폰트 등 외부는 브라우저에 맡김
  if (r.headers.has('range') || /\.mp4$/.test(u.pathname)) return; // 영상은 부분 요청(206)이라 캐시하지 않고 그대로 받는다
  const key = r.mode === 'navigate' ? './index.html' : r;
  e.respondWith(caches.open(CACHE).then(c => c.match(key).then(hit => hit || fetch(r).then(res => { if (res.ok && r.mode !== 'navigate') c.put(r, res.clone()); return res; }))));
});
