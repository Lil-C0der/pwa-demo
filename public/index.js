// import Axios from '../node_modules/axios';

(function () {
  function registerSW(file) {
    return navigator.serviceWorker.register(file, { scope: '/' });
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

  const searchBtnEl = document.querySelector('#searchBtn');

  searchBtnEl.addEventListener('click', querySongs);

  window.onload = () => {
    registerSW('./sw.js');
  };

  window.addEventListener('keypress', function (e) {
    if (e.code === 'Enter') {
      querySongs();
    }
  });
})();
