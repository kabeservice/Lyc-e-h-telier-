// Service worker minimal — met l'app en cache pour un fonctionnement hors-ligne
// et pour que le navigateur propose "Installer l'application".
const CACHE_NAME = 'hotellerie-app-v11';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ne jamais intercepter Firestore / CDN / requêtes d'écriture : seules les
  // pages et fichiers de l'app (GET, même origine) passent par le cache.
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // Réseau d'abord, secours sur le cache si hors-ligne (les données réelles
  // viendront de Firestore, qui gère son propre cache/offline séparément).
  event.respondWith(
    fetch(event.request, {cache: 'no-store'})
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
