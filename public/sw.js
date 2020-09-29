const cacheName = 'bs-0-2-0';
const apiCacheName = 'api-0-1-1';

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
  const cacheRequestUrls = ['/search', '/songs'];

  const reqUrl = event.request.url;
  // 判断当前请求是否需要缓存
  const needCache = cacheRequestUrls.some((url) => reqUrl.indexOf(url) > -1);
  // console.log(`现在请求：${reqUrl}, 是否缓存：${needCache}`);

  if (needCache) {
    caches.open(apiCacheName).then((cache) => {
      // 使用 fetch 请求，同时将结果 clone 到 cache
      fetch(event.request).then((response) => {
        cache.put(reqUrl, response.clone());
        return response;
      });
    });
  }
  // 对于非 API 请求，直接在 cache 中查询
  else {
    // 如果有 cache 则直接返回，否则通过 fetch 请求
    event.respondWith(
      caches
        .match(event.request)
        .then((cache) => {
          return cache || fetch(event.request);
        })
        .catch((err) => {
          console.log(err);
          return fetch(event.request);
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  const cachePromise = caches.keys().then((keys) => {
    return Promise.all(
      keys.map((k) => {
        // 通过 cache 的 key 来判断是否更新 cache 中的静态资源
        if (k !== cacheName) {
          console.log('删除缓存');
          return caches.delete(k);
        }
      })
    );
  });

  event.waitUntil(cachePromise);
  return self.clients.claim();
});
