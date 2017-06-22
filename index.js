var express = require('express');
var utility = require('utility');
var request = require('request');
var cheerio = require('cheerio');

var Mongo = require('mongodb').MongoClient;

var topic = require('./Model/Topic');

var url = require('url');

var db;
var latestCollection;
Mongo.connect("mongodb://localhost:27017/V2EX",function(error,mongodb){
    db = mongodb;
    latestCollection = db.collection("latest");
});

var app = express();

var handleCallback = function(callback, err, value1, value2) {
    try {
        if(callback === null) return;
        if(callback) {
            return value2 ? callback(err, value1, value2) :  callback(err, value1);
        }
    } catch(err) {
        process.nextTick(function() { throw err; });
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
            if(docs.length == 0){
                handleCallback(callback, new Error('没有更多数据了...'));
                return;
            }
            handleCallback(callback,null,docs);
        });
    });
}

app.get('/latest',function(req,res){
    var page = parseInt(req.query.page) ? parseInt(req.query.page) : 0;
    fetchTopics(page,50,function (error,docs) {
        if(error !== null){
            res.send('数据错误');
            return;
        }
        res.send(JSON.stringify(docs));
    });

    request.get('https://www.v2ex.com',function(error,response,body){
        const html = cheerio.load(body.toString());

        var latest = [];
        var cells = html('.cell.item');
        cells.each(function(i,c){

            var t = topic.Topic.createFromHTML(html,c);

            if(t === null || isNaN(t.topicID)){
                return;
            }
            latest.push(t);
            latestCollection.update({topicID:{"$eq":t.topicID}},t,{'upsert':true},function (error,result) {
                if(error){
                    console.log("插入数据失败 !!! ~");
                }
            });
        });
    });
});



app.listen(3000, function (req, res) {
  console.log('app is running at port 3000');
});
