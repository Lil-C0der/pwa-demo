const utils = require('./utils');

const Koa = require('koa');
const koaBody = require('koa-body');
const Router = require('koa-router');
const serve = require('koa-static');
const webPush = require('web-push');

const PORT = 8080;
const app = new Koa();
const router = new Router();

/* ====================== */
/*  web-push 消息推送相关  */
/* ====================== */

const options = {
  // proxy: 'http://localhost:1087' // 使用FCM（Chrome）需要配置代理
};

// 公钥和私钥
const vapidKeys = {
  publicKey:
    'BOEQSjdhorIf8M0XFNlwohK3sTzO9iJwvbYU-fuXRF0tvRpPPMGO6d_gJC_pUQwBT7wD8rKutpNTFHOHN3VqJ0A',
  privateKey: 'TVe_nJlciDOn130gFyFYP8UiGxxWd3QdH6C5axXpSgM'
};
// 设置 VAPID
webPush.setVapidDetails(
  'mailto:howtousegmai1@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function pushMessage(subscription, data = {}) {
  webPush
    .sendNotification(subscription, data, options)
    .then((res) => {
      console.log('push service 的数据', JSON.stringify(res));
      return;
    })
    .catch((err) => {
      // 判断状态码，440和410表示失效
      if ([410, 404].includes(err.statusCode)) {
        return utils.remove(subscription);
      } else {
        console.log(subscription);
        console.log(err);
      }
    });
}

// 保存订阅信息 subscription
router.post('/subscription', koaBody(), async (ctx) => {
  let body = ctx.request.body;
  console.log('订阅信息', body);
  await utils.saveRecord(body);
  ctx.response.body = {
    status: 0
  };
});

// 消息推送 API，简单的通过 POST 一个请求来实现
router.post('/push', koaBody(), async (ctx) => {
  let { uid, payload } = ctx.request.body;
  let list = uid ? await utils.find({ uid }) : await utils.findAll();
  let status = list.length > 0 ? 0 : -1;

  for (let i = 0; i < list.length; i++) {
    let subscription = list[i].subscription;
    pushMessage(subscription, JSON.stringify(payload));
  }

  ctx.response.body = {
    status
  };
});

app.use(router.routes());

app.use(serve(__dirname + '/public'));

app.listen(PORT, () => {
  console.log(`listen on port: ${PORT}`);
});
