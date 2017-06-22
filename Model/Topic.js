var url = require('url');

function Topic(){
    this.topicID;
    this.title;
    this.author = new Author();
    this.url;
}

function Author(){
    this.avatar;
}

exports.Topic = Topic;
exports.Author = Author;

var cheerio = require('cheerio');

Topic.createFromHTML = function(html,cell){
    var t = new Topic();

    var avatar = html('.avatar',cell).attr('src');
    if(avatar.startsWith('//')){
        t.author.avatar = "https:" + avatar;
    }
    var title = html('.item_title a',cell).text();
    t.title = title;

    var detailHref = html('.item_title a',cell).attr('href');
    detailHref = url.resolve("https://www.v2ex.com",detailHref);
    t.url = detailHref;

    var detailHrefUrl = url.parse(detailHref);
    var paths = detailHrefUrl.path.split('/');
    var topicID = paths[paths.length-1];
    t.topicID = topicID;

    return t;
};

