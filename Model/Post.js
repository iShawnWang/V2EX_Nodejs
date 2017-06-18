function Post(){
    this.title;
    this.author = new Author();
    this.url;
}

function Author(){
    this.avatar;
}

exports.Post = Post;
exports.Author = Author;