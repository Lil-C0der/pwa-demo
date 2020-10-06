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

// 公钥和私钥
const vapidKeys = {
  publicKey:
    'BGlUEIPs0omLiluCRk5_Yyhaz5aAQ5zjiagnYDjbTaf4JObSEjL6SQkrHbrl4DeNHskWrDzpVQI5yqaQ1MVCY4U',
  privateKey: 'FKb2AUb59pcAxIsKdvOGryS4jEsNKqL3XRm4WopDPsE'
};
// 设置 VAPID
webPush.setVapidDetails(
  'mailto:howtousegmai1@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

function pushMessage(subscription, data = {}) {
  // 发送请求到 Push Service
  webPush
    .sendNotification(subscription, data)
    .then((res) => {
      console.log('push service 的响应', JSON.stringify(res));
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

/* ====================== */
/*       后台同步相关      */
/* ====================== */

router.get('/sync', async (ctx, next) => {
  console.log(`Hello ${ctx.request.query.name}, I have received your msg`);

  ctx.response.body = {
    status: 0,
    data: `receive message from ${ctx.request.query.name}`
  };
});

app.use(router.routes());

// // 使用 koa-static 设置响应头，Prefetch 相关
// app.use(
//   serve(__dirname + '/public', {
//     maxage: 1000 * 60 * 60,
//     setHeaders: (res, path, stats) => {
//       if (/index.html/.test(path)) {
//         res.setHeader('Link', '</detail.js>; rel="prefetch"; as="script"');
//       }
//     }
//   })
// );

app.use(serve(__dirname + '/public'));

app.listen(PORT, () => {
  console.log(`listen on port: ${PORT}`);
});
