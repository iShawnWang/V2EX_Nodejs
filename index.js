var express = require('express');
var bodyParser = require('body-parser');
var utility = require('utility');
var request = require('request');
var cheerio = require('cheerio');
var cookies = require('request-cookies');
var cron = require('cron');
var async = require('async');

var Mongo = require('mongodb').MongoClient;

var topic = require('./Model/Topic');

var db;
var latestCollection;
Mongo.connect("mongodb://ishawnwang:ws19940415@ds145312.mlab.com:45312/v2ex",function(error,mongodb){
    db = mongodb;
    latestCollection = db.collection("latest");
});

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

function isEmpty(str) {
    return (!str || 0 === str.length);
}

var handleCallback = function(callback, err, value1, value2) {
    try {
        if(callback === null) return;
        if(callback) {
            return value2 ? callback(err, value1, value2) :  callback(err, value1);
        }
    } catch(err) {
        return false;
    }
    return true;
};

function fetchTopics(page,length,callback){

    var firstPage = page === 0;
    var topicsPerPage = length;
    latestCollection.find({}).limit(firstPage ? topicsPerPage :topicsPerPage * page).toArray(function(err,docs){

        if(firstPage){
            handleCallback(callback,null,docs);
            return;
        }

        if(docs.length === 0){
            handleCallback(callback,new Error('咋没数据捏'));
            return;
        }

        //继续查分页数据
        var lastID = docs[docs.length-1]._id;
        latestCollection.find({_id : { "$gt" : lastID } }).limit(topicsPerPage).toArray(function(err,docs){
            if(docs.length === 0){
                handleCallback(callback, new Error('没有更多数据了...'));
                return;
            }
            handleCallback(callback,null,docs);
        });
    });
}

// 全局中间件, Measure all requests
app.use(function (req,res,next) {
    next();
});

// 错误处理中间件
app.use(function(err, req, res, next) {
    console.error(" 66666666666   Error Date : " + new Date());
    res.status(500).send(JSON.stringify({"status":"Something broke!"}));
});

app.get('/latest',function(req,res){
    if(isEmpty(req.query.page)){
        res.send({"status":"参数错误"});
        return;
    }
    var page = parseInt(req.query.page);
    fetchTopics(page,50,function (error,docs) {
        if(error !== null){
            res.send(JSON.stringify({"status":"数据错误"}));
            return;
        }
        res.send(JSON.stringify(docs));
    });
});

app.post("/signin",function (req,res) {

    var username = req.body.username;
    var pwd = req.body.password;
    if(isEmpty(username) || isEmpty(pwd)){
        res.send(JSON.stringify({"status":"参数错误"}));
        return;
    }

    signin(username,pwd,function (error,json) {
        if(isEmpty(json)){
            res.send(JSON.stringify({"status":error.message}));
            return;
        }
        res.send(json);
    });
});

function signin(username,password,callback) {
    //1. 先 Get 获取 userNameKey 和 pwdKey
    request.get({url:"https://www.v2ex.com/signin",jar:true},function (error,response,body) {
        const $ = cheerio.load(body.toString());

        var form = {};

        var input = $('input.sl');
        input.each(function (i, c) {
            if(i===0){
                var userNameKey = $(c).attr('name');
                form[userNameKey] = username;
            }
            if(i===1){
                var pwdKey = $(c).attr('name');
                form[pwdKey] = password;
            }
        });

        var once = $('input.super.normal.button').prev()[0];

        form["next"] = '\\';
        form["once"] = once.attribs['value'];

        var headers = {'Referer':'https://www.v2ex.com/signin'};

        //2. 再post 用户名密码,登录
        request.post({url:'https://www.v2ex.com/signin',jar:true,form: form, headers:headers},function (error,response,body) {

            //3. 再发下面的请求判断登录 成功\失败, 跳转主页, 获取用户信息
            request.get({url:'https://www.v2ex.com/?tab=all',jar:true},function (error,response,body) {
                const $ = cheerio.load(body.toString());
                var a = $('span.bigger').first().children().first();
                var href = a.attr('href');
                if(isEmpty(href)){
                    handleCallback(callback,new Error('登录失败'));
                    return;
                }
                var split = href.split('/');
                var userName = split[split.length-1];
                if(isEmpty(userName)){
                    handleCallback(callback,new Error('登录失败'));
                    return;
                }
                //4. V2用户信息接口
                request.get({url:'https://www.v2ex.com/api/members/show.json?username='+userName,jar:true},function (error,response,body) {
                    var json = JSON.parse(body.toString());
                    if(isEmpty(json)){
                        handleCallback(callback,new Error('获取用户信息失败了'));
                        return;
                    }
                    handleCallback(callback,null,json);
                });
            });
        })
    });
}

// 登出 https://www.v2ex.com/signout?once=62472
app.get('/signout',function (req,res) {
    var once = req.query.once;
    if(isEmpty(once)){
        res.send(JSON.stringify({'status':'failed'}));
        return;
    }
    request.get({url:'https://www.v2ex.com/signout?once='+ once ,jar:true},function (error,response,body) {
        if(response.statusCode === 200){
            res.send(JSON.stringify({'status':'success'}));
        }
    });
});

function crawlingV2ExRecent(i,callback) {
    request.get({url:'https://www.v2ex.com/recent?p=' + String(i),jar:true}, function (error, response, body) {
        const $ = cheerio.load(body.toString());

        var latest = [];
        var cells = $('.cell.item');
        if(cells.length<=0){
            handleCallback(callback,new Error("抓取数据错误"));
            return;
        }
        cells.each(function (i, c) {

            var t = topic.Topic.createFromHTML($, c);
            if (t === null || isNaN(t.topicID)) {
                return;
            }
            latest.push(t);
            latestCollection.update({topicID: {"$eq": t.topicID}}, t, {'upsert': true}, function (error, result) {
                if (error) {
                    handleCallback(callback,new Error("插入数据失败"));
                    return;
                }
                handleCallback(callback);
            });
        });
    });
}

app.get("/",function (req,res) {
   res.send("Hello V2EX ~");
});

app.listen(process.env.PORT || 3000, function (req, res) {
  console.log('app is running at port 3000');
});

var cronJob = cron.job("0 */15 * * * *", function(){

    signin("ishawnwang@outlook.com","ws19940415",function (error,json) {
        if(!json || isEmpty(json["username"])){
            console.log("登录出问题了.. 终止抓取");
            return;
        }

        db.collection('latest').drop(function (error, response) {
            //登录成功, 抓取每一页数据
            var count = 0;
            async.whilst(
                function () { return count < 20; },
                function (callback) {
                    count++;

                    console.log("抓取第 " + count + " 页数据~");
                    crawlingV2ExRecent(count,function (error) {
                        if(error){
                            callback(error);
                            return;
                        }
                        callback();
                    });
                },
                function (err) {
                    if(err){
                        console.log("爬虫任务失败 : " + err);
                        return;
                    }
                    console.log("完成一次爬虫任务");
                }
            );
        });
    });
});

cronJob.start();
