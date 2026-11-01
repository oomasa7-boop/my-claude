// バージョンを上げてアップロードすると、スマホ側が自動で新しい版に切り替わります
const VERSION = 'v4';
const CACHE = 'claude-pwa-' + VERSION;
const FILES = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  // 1つ失敗しても他は保存する（インストール自体は失敗させない）
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))
  ));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return; // API通信には触らない
  // ネット優先（ブラウザのキャッシュも使わない）：つながれば常に最新、圏外ならキャッシュ
  e.respondWith(
    fetch(e.request, { cache: 'no-store' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
