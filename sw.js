/* Service Worker: App offline verfügbar machen. Erzeugt von werkzeuge/web_bauen.py */
const SHELL = 'cp-shell-bc5e4e246a', SOUNDS = 'cp-sounds';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'sounds/index.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k.startsWith('cp-shell-') && k !== SHELL).map(k => caches.delete(k))))
  .then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== location.origin) return;
  /* Tonbündel: erst aus dem Speicher, sonst laden und merken (alte Fassungen derselben Datei löschen) */
  if (u.pathname.endsWith('.mp3')){
    e.respondWith(caches.open(SOUNDS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok){
        const old = await c.keys();
        await Promise.all(old.filter(q => q.url !== req.url && q.url.split('?')[0] === req.url.split('?')[0]).map(q => c.delete(q)));
        await c.put(req, r.clone());
      }
      return r;
    }));
    return;
  }
  /* Alles andere: erst aus dem Netz (damit Updates ankommen), ohne Netz aus dem Speicher */
  e.respondWith(fetch(req).then(r => {
    if (r.ok){ const cl = r.clone(); caches.open(SHELL).then(c => c.put(req, cl)); }
    return r;
  }).catch(() => caches.match(req, {ignoreSearch:true}).then(r => r || caches.match('index.html'))));
});
