// 引入依赖
const express = require('express');
const utility = require('utility');
const request = require('request');
const cheerio = require('cheerio');

var MongoClient = require('mongodb').MongoClient;

const post = require('./Model/Post');

var url = require('url')


MongoClient.connect("mongodb://localhost:27017/test",function(error,db){
  console.log("Connected correctly to server.");
  db.collection("heheda").insertOne({
      "hehe":"da"
  },function(err,result){
      console.log(result);
        db.close();
  });
});

// 建立 express 实例
var app = express();

app.get('/', function (req, res) {
  // 从 req.query 中取出我们的 q 参数。
  // 如果是 post 传来的 body 数据，则是在 req.body 里面，不过 express 默认不处理 body 中的信息，需要引入 https://github.com/expressjs/body-parser 这个中间件才会处理，这个后面会讲到。
  // 如果分不清什么是 query，什么是 body 的话，那就需要补一下 http 的知识了
  var q = req.query.q;

  // 调用 utility.md5 方法，得到 md5 之后的值
  // 之所以使用 utility 这个库来生成 md5 值，其实只是习惯问题。每个人都有自己习惯的技术堆栈，
  // 我刚入职阿里的时候跟着苏千和朴灵混，所以也混到了不少他们的技术堆栈，仅此而已。
  // utility 的 github 地址：https://github.com/node-modules/utility
  // 里面定义了很多常用且比较杂的辅助方法，可以去看看
  var md5Value = utility.md5(q);

  res.send(md5Value);
});

app.get('/latest',function(req,res){
    request.get('https://www.v2ex.com',function(error,response,body){
        const $ = cheerio.load(body.toString());

        var latest = [];
        var cells = $('.cell.item');
        cells.each(function(i,c){

            var p = new post.Post();

            var avatar = $('.avatar',this).attr('src');
            if(avatar.startsWith('//')){
                avatar = avatar.slice(2);
                p.author.avatar = avatar;
            }
            var title = $('.item_title a',this).text();
            p.title = title;
            var detailHref = $('.item_title a',this).attr('href');
            p.url = url.resolve("https://www.v2ex.com",detailHref);

            latest.push(p);
        });
        res.send(JSON.stringify(latest));
    });
});

app.listen(3000, function (req, res) {
  console.log('app is running at port 3000');
});
