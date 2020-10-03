(function () {
  /**
   * 注册 Service Worker
   * @param {string} file
   * @return {ServiceWorker Registration}
   */
  function registerSW(file) {
    navigator.serviceWorker.register(file, { scope: '/' });
    return navigator.serviceWorker.ready;
  }

  function createListItem(data) {
    let li = document.createElement('li');

    let name = document.createElement('div');
    let artist = document.createElement('div');
    let album = document.createElement('span');

    let artistName = data.artists.map((el) => el.name);

    name.className = 'name';
    artist.className = 'artist';
    album.className = 'album';

    name.innerText = data.name;
    artist.innerText = artistName;
    album.innerText = data.album.name;

    li.appendChild(name);
    li.appendChild(artist);
    li.appendChild(album);

    return li;
  }

  function renderList(list) {
    list.forEach((song) => {
      let node = createListItem(song);
      document.querySelector('#songsList').append(node);
    });
  }

  function loading(isShow) {
    let loadingEl = document.querySelector('#loadingIcon');
    if (isShow) {
      loadingEl.style.display = 'block';
    } else {
      loadingEl.style.display = 'none';
    }
  }

  function ajax(url) {
    // 拦截器，处理响应，直接返回 data
    axios.interceptors.response.use(
      (result) => result.data || result,
      (err) => Promise.reject(err)
    );

    return axios.get(url);
  }

  /**
   * 根据请求 url 获取缓存数据
   * @param {string} url
   * @return {*}
   */
  function getAPIDataFromCache(url) {
    if ('caches' in window) {
      return caches.match(url).then((cache) => {
        if (cache) {
          console.log('本地找到缓存');
          return cache.json();
        } else {
          return;
        }
      });
    } else {
      return Promise.resolve();
    }
  }

  function querySongs() {
    const iptEl = document.querySelector('#searchIpt');
    let query = iptEl.value;
    let url = `https://autumnfish.cn/search?keywords=${query}`;
    let cacheData;

    loading(true);
    // 请求资源
    const remotePromise = ajax(url);

    getAPIDataFromCache(url)
      .then((data) => {
        console.log('缓存中的数据', data);
        // 先使用缓存的数据来渲染页面
        if (data) {
          let { songs } = data.result;
          renderList(songs);

          loading(false);
        }

        cacheData = data || {};
        // 将 fetch 的数据返回，用于下一步的对比
        return remotePromise;
      })
      .then((data) => {
        console.log('请求的数据', data);
        if (JSON.stringify(data) !== JSON.stringify(cacheData)) {
          // 缓存和请求返回的数据不一致时，重新渲染页面
          console.log('本地缓存和请求不一致');
          let { songs } = data.result;
          renderList(songs);

          loading(false);
        }
      });
  }

  /**
   * 注册订阅的相关方法
   * @param {ServiceWorker Registration} registration
   * @param {string} publicKey
   * @return {Promise}
   */
  function subscribePushService(registration, publicKey) {
    const subsOptions = {
      userVisibleOnly: true,
      applicationServerKey: window.urlBase64ToUnit8Array(publicKey)
    };

    return registration.pushManager
      .subscribe(subsOptions)
      .then((pushSubscription) => pushSubscription);
  }

  // 将 subscription 发送给后端
  function sendSubscriptionToServer(body) {
    return axios.post('/subscription', body);
  }

  /**
   * 获取 Notification 权限
   * @param {ServiceWorker Registration} registration // 注册返回的对象
   * @return {ServiceWorker Registration}
   */
  function askForPermission(registration) {
    return Notification.requestPermission().then(() => registration);
  }

  function onNotifyBtnClick(registration) {
    let title = 'PWA DEMO';
    let options = {
      body: '邀请你一起听歌',
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

    registration.showNotification(title, options);
  }

  // 监听 notify 按钮
  function initNotifyListener(registration) {
    const notifyBtnEl = document.querySelector('#notifyBtn');
    notifyBtnEl.addEventListener(
      'click',
      onNotifyBtnClick.bind(this, registration)
    );
  }

  // 触发一个同步事件
  function onSyncBtnClick(registration) {
    const tag = 'sample_sync';
    registration.sync.register(tag).then(
      () => {
        console.log('同步已触发', tag);
      },
      (err) => {
        console.log('触发失败', err);
      }
    );
  }

  // 监听几个同步按钮
  function initSyncListener(registration) {
    const syncEventBtnEL = document.querySelector('#syncEventBtn'),
      syncDBBtnEl = document.querySelector('#syncDBBtn'),
      syncBtnEl = document.querySelector('#syncBtn');

    syncBtnEl.addEventListener(
      'click',
      onSyncBtnClick.bind(this, registration)
    );
  }

  const searchBtnEl = document.querySelector('#searchBtn');
  searchBtnEl.addEventListener('click', querySongs);

  window.onload = () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const publicKey =
        'BGlUEIPs0omLiluCRk5_Yyhaz5aAQ5zjiagnYDjbTaf4JObSEjL6SQkrHbrl4DeNHskWrDzpVQI5yqaQ1MVCY4U';

      // 注册 sw，并订阅推送
      registerSW('./sw.js')
        // 获取 Notification 权限
        .then((registration) => askForPermission(registration))
        .then((registration) => {
          initNotifyListener(registration);
          initSyncListener(registration);
          return subscribePushService(registration, publicKey);
        })
        .then((subscription) => {
          const body = { subscription, uid: new Date().getTime() };
          return sendSubscriptionToServer(body);
        })
        .then((res) => {
          res.status === 200 &&
            console.log('订阅信息 Subscription 存储到服务器');
        });
    }
  };

  // 处理用户和提醒交互
  function onHaveALookBtnClick() {
    console.log('去看看');
    window.open(
      'https://music.163.com/playlist?id=5200520415&userid=126735223'
    );
  }
  function onDoNotDisturbBtnClick() {
    console.log('不再提醒');
  }
  function onNotificationClick() {
    console.log('消息被点击了');
  }
  // SW 监听 message 事件
  navigator.serviceWorker.addEventListener('message', (e) => {
    let action = e.data;
    let actions = ['have-a-look', 'do-not-disturb'];
    let actionHandlers = [onHaveALookBtnClick, onDoNotDisturbBtnClick];
    const idx = actions.indexOf(action);
    if (idx > -1) {
      actionHandlers[idx]();
    } else {
      onNotificationClick();
    }
  });

  window.addEventListener('keypress', function (e) {
    if (e.code === 'Enter') {
      querySongs();
    }
  });
})();
