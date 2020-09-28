(function () {
  function registerSW(file) {
    return navigator.serviceWorker.register(file, { scope: '/' });
  }

  window.onload = () => {
    registerSW('./sw.js');
  };
})();
