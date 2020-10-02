window.urlBase64ToUnit8Array = function (base64Str) {
  const padding = '='.repeat((4 - (base64Str.length % 4)) % 4);
  const base64 = (base64Str + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
