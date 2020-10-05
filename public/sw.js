const cacheName = 'bs-0-2-0';
const apiCacheName = 'api-0-1-1';

const cacheFiles = [
  '/',
  './index.html',
  './base64Utils.js',
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

// 监听 Push Service 的 Push 推送
self.addEventListener('push', (e) => {
  let { data } = e;
  if (data) {
    data = data.json();
    console.log('push 的消息为：', data);
    let title = 'PWA DEMO';
    let options = {
      body: data,
      icon: '/img/icons/yandhi-128.png',
      actions: [
        {
          action: 'have-a-look',
          title: '去看看'
        },
        {
          action: 'do-not-disturb',
          title: '免打扰'
        }
      ],
      tag: 'pwa-starter',
      renotify: true
    };
    // 显示提醒消息，属于 Notification
    self.registration.showNotification(title, options);
  } else {
    console.log('push 的消息为空');
  }
});

// 监听消息提醒的点击事件，Notification 相关
self.addEventListener('notificationclick', (e) => {
  let { action } = e;
  e.waitUntil(
    self.clients.matchAll().then((clients) => {
      if (clients?.length) {
        // 在其他标签页时，自动切换到当前站点的标签页
        clients[0].focus();
        // 使用 postMessage 与前端通信
        clients.forEach((client) => {
          client.postMessage(action);
        });
      } else {
        // 当不存在 client 时，打开我们的网站
        self.clients.openWindow('http://127.0.0.1:8080');
      }
    })
  );
});

function sampleSyncHandler(e) {
  const options = {
    method: 'GET'
  };
  const request = new Request(`sync?name=Lil-C0der`, options);
  e.waitUntil(
    fetch(request)
      .then((response) => response.json())
      .then(console.log('response from server', res))
  );
}

class EventBus {
  constructor() {
    this.listeners = [];
  }
  on(tag, cb) {
    if (!this.listeners[tag]) {
      this.listeners[tag] = [];
    }
    this.listeners[tag].push(cb);
  }

  trigger(tag, data) {
    if (!this.listeners[tag]) {
      this.listeners[tag] = [];
    }
    while (this.listeners[tag]?.length) {
      let fn = this.listeners[tag].pop();
      fn(data);
    }
  }
}

// 监听前端代码通过 postMessage 发来的消息
const bus = new EventBus();

function sampleSyncEventHandler(e) {
  // 因为 e.waitUtil 接收 Promise 作为参数
  // 所以这里把向 bus 注册监听的方法包装成 Promise
  let msgPromise = new Promise((resolve) => {
    // callback 被调用后这个 Promise 被 resolve，才会发出请求
    function onBgSync(data = {}) {
      resolve(data);
    }
    // 在 bus 中添加对 bgSync 事件的监听
    bus.on('bgSync', onBgSync);
    // 五秒后超时，resolve
    setTimeout(resolve, 5000);
  });

  e.waitUntil(
    // trigger 后把数据发送到后端
    msgPromise.then((data) => {
      const options = {
        method: 'GET'
      };
      const name = data?.name || 'anonymous';
      const request = new Request(`sync?name=${name}`, options);

      fetch(request)
        .then((response) => response.json())
        .then((res) => {
          console.log('response from server', res);
        });
    })
  );
}

self.addEventListener('message', (e) => {
  let { type } = e.data;
  let { msg } = e.data;
  // 使用 bus 来解耦 message 事件和 sync 事件
  // 触发 callback，resolve Promise
  bus.trigger(type, msg);
});

// 监听 sync 事件，后台同步相关
self.addEventListener('sync', (e) => {
  let { tag } = e;
  // 断网后 SW 监听不到 sync 事件
  console.log(`Service Worker 需要进行后台同步，tag: ${tag}`);

  let tags = ['sample_sync', 'sample_sync_event'];
  let syncHandlers = [sampleSyncHandler, sampleSyncEventHandler];

  let idx = tags.indexOf(tag);
  syncHandlers[idx](e);
});
