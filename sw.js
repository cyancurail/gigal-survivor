// 기갈 서바이버 서비스 워커 — 배포할 때마다 VERSION을 올린다
const VERSION='v133';
const CACHE = 'gigal-' + VERSION;
const BGM = 'gigal-bgm-1'; // 배경음 mp3는 버전이 바뀌어도 다시 받지 않게 따로 보관 (V131) — 곡 파일을 바꾸면 이름을 올린다
const ASSETS = ['./', './index.html', './wiki.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-512-maskable.png', './icons/apple-touch-icon.png', './fx/pstar.png', './fx/pimp.png', './fx/rune.png', './fx/ghost.png', './fx/cubeB.png', './fx/fnova.png', './fx/scharge.png', './fx/amiss.png', './fx/lsteal.png', './fx/pet_slime.png', './fx/pet_wisp.png', './fx/pet_butterfly.png', './fx/pet_ghost.png', './fx/iris.png', './fx/hx_polaris.png', './fx/hx_soulwed.png', './fx/hx_glass.png', './fx/pcore.png', './fx/pmana.png', './fx/pplasma.png', './fx/pimpact.png', './fx/pwarpb.png', './fx/pquake.png', './fx/lres.png', './fx/lsmite.png', './fx/lbless.png', './fx/lfeath.png', './fx/langel.png', './fx/lland.png', './fx/lrisha.png', './fx/lcirc.png', './fx/sfall.png', './fx/sfire.png', './fx/srune.png', './msk2/01.png', './msk2/02.png', './msk2/03.png', './msk2/04.png', './msk2/05.png', './msk2/06.png', './msk2/07.png', './msk2/08.png', './msk2/09.png', './msk2/10.png', './msk2/11.png', './msk2/12.png', './msk2/13.png', './msk2/14.png', './msk2/15.png', './msk2/16.png', './msk2/17.png', './msk2/18.png', './msk2/19.png', './msk2/20.png', './msk2/21.png', './msk2/22.png', './msk2/23.png', './msk2/24.png', './msk2/25.png', './msk2/26.png', './msk2/27.png', './msk2/28.png', './msk2/29.png', './msk2/30.png'];
// GitHub Pages는 HTTP 캐시(10분)를 쓰므로 반드시 cache:'reload'로 새 파일을 받는다
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('gigal-') && k !== CACHE && k !== BGM).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return; // 폰트 등 외부는 브라우저에 맡김
  if (r.headers.has('range') || /\.mp4$/.test(u.pathname)) return; // 영상은 부분 요청(206)이라 캐시하지 않고 그대로 받는다
  if (/\/bgm\/[^/]+\.mp3$/.test(u.pathname)) { e.respondWith(caches.open(BGM).then(c => c.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; })))); return; }
  const wk = /\/wiki\.html$/.test(u.pathname); // 위키는 ?ingame=1 같은 쿼리가 붙어도 wiki.html로 (V127)
  const key = wk ? './wiki.html' : r.mode === 'navigate' ? './index.html' : r;
  e.respondWith(caches.open(CACHE).then(c => c.match(key).then(hit => hit || fetch(r).then(res => { if (res.ok && r.mode !== 'navigate') c.put(r, res.clone()); return res; }))));
});
