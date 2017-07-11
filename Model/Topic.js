var url = require('url');

function Topic(){
    this.topicID;
    this.title;
    this.author = new User();
    this.lastReplayUser = new User();
    this.url;
    this.tag;
    this.tagHref;
    this.lastReplayTime;
}

function User(){
    this.avatar;
    this.userName;
}

exports.Topic = Topic;
exports.User = User;

var cheerio = require('cheerio');

Topic.createFromHTML = function(html,cell){
    var t = new Topic();

    var avatar = html('.avatar',cell).attr('src');
    if(avatar.startsWith('//')){
        t.author.avatar = "https:" + avatar;
    }
    var title = html('.item_title a',cell).text();
    t.title = title;


    var userName = html('.small.fade strong',cell).first().children('a').text();
    t.author.username = userName;
    var tag = html('.small.fade a',cell).text();
    t.tag = tag;

    var lastReplayUserName = html('.small.fade strong',cell).first().next().text();
    var lastReplayTime = html('.small.fade',cell).first().text().split('•')[2];
    t.lastReplayUser.username = lastReplayUserName;
    t.lastReplayTime = lastReplayTime;


    var tagHref = html('.small.fade a',cell).attr('href');
    tagHref = url.resolve("https://www.v2ex.com",tagHref);
    t.tagHref = tagHref;

    var detailHref = html('.item_title a',cell).attr('href');
    detailHref = url.resolve("https://www.v2ex.com",detailHref);
    t.url = detailHref;

    var detailHrefUrl = url.parse(detailHref);
    var paths = detailHrefUrl.path.split('/');
    var topicID = paths[paths.length-1];
    t.topicID = topicID;

    return t;
};

