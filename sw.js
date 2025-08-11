const CACHE = 'fittrack-pro-v3'; // cache bust
const ASSETS = [
  './',
  './index.html',
  './sw.js',
  './icons/app-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).then(netRes => {
        const copy = netRes.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
        return netRes;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
