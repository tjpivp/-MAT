// sw.js — stale-while-revalidate cache for MyAiTeacher v5
const CACHE = 'mat-v5';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './lessons.js',
  './quizzes.js',
  './prompts.js',
  './resources.js',
  './videos.js',
  './future.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-256.png',
  './icon-384.png',
  './icon-512.png',
  './updates/feed.json'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE && k.startsWith('mat-')).map(k=>caches.delete(k))
  )));
});

self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(cacheRes=>{
      const fetchPromise = fetch(e.request).then(networkRes=>{
        const url = new URL(e.request.url);
        if(url.origin === location.origin){
          caches.open(CACHE).then(c=>c.put(e.request, networkRes.clone()));
        }
        return networkRes;
      }).catch(()=>cacheRes);
      return cacheRes || fetchPromise;
    })
  );
});
