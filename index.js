'use strict';

const port = process.env.PORT || 3000;

const request = require('request');
const cheerio = require('cheerio');
const Mongo = require('mongodb').MongoClient;
const express = require('express');
const bodyParser = require('body-parser');
const app = new express();

app.use(bodyParser.urlencoded({ extended: false }))

var db;
var recentCollection;
Mongo.connect("mongodb://ishawnwang:ws19940415@ds145312.mlab.com:45312/v2ex",function(error,mongodb){ //连接 数据库
    db = mongodb;
    recentCollection = db.collection("Topics");
});

app.get("/",function (req,res) {
    res.send("Hello V2EX ~");
});

// 全局中间件, Measure all requests
app.use(function (req,res,next) {
    next();
});

// 错误处理中间件
app.use(function(err, req, res, next) {
    res.status(500).send(JSON.stringify({"status":"Something broke!"}));
});

app.listen(process.env.PORT || 3000, function (req, res) {
    console.log('app is running at port 3000');
});

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
    recentCollection.find({}).limit(firstPage ? topicsPerPage :topicsPerPage * page).toArray(function(err,docs){

        if(firstPage){
            handleCallback(callback,null,docs);
            return;
        }

        if(docs.length === 0){
            handleCallback(callback,new Error('没数据捏'));
            return;
        }

        //继续查分页数据
        var lastID = docs[docs.length-1]._id;
        recentCollection.find({_id : { "$gt" : lastID } }).limit(topicsPerPage).toArray(function(err,docs){
            if(docs.length === 0){
                handleCallback(callback, new Error('没有更多数据了...'));
                return;
            }
            handleCallback(callback,null,docs);
        });
    });
}

app.get('/recent',function(req,res){
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


// 登录
function signin(username,password,callback) {

    //1. 先 Get 获取 userNameKey 和 pwdKey
    request.get({url:"https://www.v2ex.com/signin",jar:true},function (error,response,body) {
        var bodyString = body.toString();
        if(bodyString.indexOf('Access Denied') >= 0){
            console.log("抓取终止 : Access Denied at :" + new Date());

            return;
        }
        const $ = cheerio.load(bodyString);

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