const CACHE = 'organizeio-v1';
const ASSETS = [
  './agenda.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600&family=Roboto:wght@300;400;500&display=swap'
];

// Instala e faz cache dos arquivos principais
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS.filter(a => !a.startsWith('http'))))
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Serve do cache quando offline, busca da rede quando online
self.addEventListener('fetch', e => {
  // Deixa o sync do Google passar direto (precisa de rede)
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('fonts.googleapis.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('')));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Cache dinâmico para assets locais
        if (e.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE).then(cache => cache.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => caches.match('./agenda.html'));
    })
  );
});
