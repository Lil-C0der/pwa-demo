const request = require('request');
const Datastore = require('nedb');

const db = new Datastore();

module.exports.saveRecord = function (obj) {
  let { uid, subscription } = obj;
  return new Promise((r, j) => {
    db.findOne(
      { 'subscription.endpoint': subscription.endpoint },
      (err, res) => {
        if (err) {
          j(err);
          return;
        }
        if (res) {
          console.log('已存在');
          res.uid = uid;
          db.update({ subscription }, res, {}, (err) => {
            if (err) {
              j(err);
              return;
            }
            r(obj);
          });
          return;
        }
        db.insert(obj, (err, item) => {
          if (err) {
            j(err);
            return;
          }
          console.log('存储完毕');
          r(obj);
        });
      }
    );
  });
};

module.exports.find = function (query) {
  return new Promise((r, j) => {
    db.find(query, (err, list) => {
      if (err) {
        j(err);
        return;
      }
      r(list);
    });
  });
};

module.exports.findAll = function () {
  return new Promise((r, j) => {
    db.find({}, (err, list) => {
      if (err) {
        j(err);
        return;
      }
      r(list);
    });
  });
};

module.exports.remove = function (obj) {
  return new Promise((r, j) => {
    db.remove(obj, { multi: true }, (err, num) => {
      if (err) {
        j(err);
        return;
      }
      r(num);
    });
  });
};
