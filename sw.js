const CACHE = 'fittrack-v1';
const ASSETS = [
  './',
  './index.html',
  './sw.js',
  './icons/app-180.png'
];

// İlk kurulumda temel dosyaları cache’le
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

// Eski cache’leri temizle
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
});

// Ağdan isterken önce cache, yoksa ağ → cache
self.addEventListener('fetch', e=>{
  const req=e.request;
  e.respondWith(
    caches.match(req).then(cached=>{
      if (cached) return cached;
      return fetch(req).then(res=>{
        // Pyodide CDN dosyalarını da runtime cache’e al (opaque olabilir)
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match('./')); // offline fallback
    })
  );
});
