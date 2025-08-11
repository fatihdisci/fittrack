// sw.js — Versiyonlanmış önbellek + otomatik eski cache temizliği
// Sadece bu satırı artır: v3 → v4 gibi
const CACHE_VERSION = 'v2';
const CACHE_NAME = `fittrack-cache-${CACHE_VERSION}`;

// Uygulamanın offline çalışması için önceden önbelleğe alınacak temel dosyalar
const ASSETS = [
  './',
  './index.html',
  './sw.js',
  './icons/app-180.png'
];

// Install: temel dosyaları önbelleğe al ve yeni SW'yi hemen etkinleştir
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: eski versiyon cache'leri temizle ve kontrolü devral
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: öncelik cache -> yoksa ağ -> döneni cache'e koy (stale-while-revalidate benzeri)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Sadece GET ve aynı origin istekleri ele al
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          // Başarılı yanıtları cache'e koy
          if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
          }
          return networkRes;
        })
        .catch(() => {
          // Ağ yoksa ve cache de yoksa, ana sayfayı offline fallback olarak dön
          if (!cached) return caches.match('./index.html');
          return cached;
        });

      // Cache varsa hemen göster, arka planda ağı güncelle
      return cached || fetchPromise;
    })
  );
});
