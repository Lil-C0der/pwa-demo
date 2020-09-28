const cacheName = 'bs-0-2-0';

const cacheFiles = [
  '/',
  './index.html',
  // './base64util.js',
  './index.js',
  './style.css',
  './img/book.png',
  './img/loading.svg'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker 状态： install');

  const cacheOpenPromise = caches
    .open(cacheName)
    .then((cache) => {
      // 往 cache 中添加资源
      return cache.addAll(cacheFiles);
    })
    .catch((err) => {
      console.log(err);
    });
  event.waitUntil(cacheOpenPromise);
});

self.addEventListener('fetch', (event) => {
  // 如果有 cache 则直接返回，否则通过 fetch 请求
  event.respondWith(
    caches
      .match(event.request)
      .then((cache) => {
        console.log('cache', cache);
        return cache || fetch(event.request);
      })
      .catch((err) => {
        console.log(err);
        return fetch(event.request);
      })
  );
});
