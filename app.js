const Koa = require('koa');
const Router = require('koa-router');
const serve = require('koa-static');

const PORT = 8080;
const app = new Koa();
const router = new Router();

// router.get('/book');

// app.use(router.routes());

app.use(serve(__dirname + '/public'));

app.listen(PORT, () => {
  console.log(`listen on port: ${PORT}`);
});
