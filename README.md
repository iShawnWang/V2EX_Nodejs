![](https://travis-ci.org/iShawnWang/V2EX_Nodejs.svg?branch=master)![][node6x] [![GitHub stars][stars]][stargazers] [![GitHub forks][forks]][network] [![GitHub issues][issues]][issues_url] [![GitHub license][license]][lic_file]

# V2EX_Nodejs
V2EX 最近的文章, 登录, 注销接口
配合 [V2EX_Crawler](https://github.com/iShawnWang/V2EX_Crawler) Python Scrapy 爬虫抓取数据

# Requirement
- Node 6.x
- MongoDB or mlab

# Usage
1. 配置本地 MongoDB 或者 mlab, 替换 `mongodb://xxxx/v2ex` 为你本地或者 mlab 的 URI
2. `cd V2EX_Nodejs`
3. `node index.js`


# 已经部署在 [Heroku](https://www.heroku.com)

- 最近的文章 GET : https://v2ex-node.herokuapp.com/recent?page=1
- 登录 & 获取用户信息 POST : https://v2ex-node.herokuapp.com/signin 
    - body : 
        - username
        - password
- 登出 GET : https://v2ex-node.herokuapp.com/signout?once=566

# 数据库
使用 云 MongoDB [mlab](https://mlab.com)

# Contact

Email : iShawnWang2333@gmail.com  
Weibo : [王大屁帅2333](https://weibo.com/p/1005052848310723/home?from=page_100505&mod=TAB#place)

# License

V2EX_Nodejs is released under the GPL v3.0 license. See [LICENSE](https://github.com/iShawnWang/V2EX_Nodejs/blob/master/LICENSE) for details.

[forks]: https://img.shields.io/github/forks/iShawnWang/V2EX_Nodejs.svg[network]: https://github.com/iShawnWang/V2EX_Nodejs/network

[stars]: https://img.shields.io/github/stars/iShawnWang/V2EX_Nodejs.svg[stargazers]: https://github.com/iShawnWang/V2EX_Nodejs/stargazers

[issues]:https://img.shields.io/github/issues/iShawnWang/V2EX_Nodejs.svg
[issues_url]:https://github.com/iShawnWang/V2EX_Nodejs/issues

[issues_img]: https://img.shields.io/github/issues/iShawnWang/V2EX_Nodejs.svg[issues]: https://github.com/iShawnWang/V2EX_Nodejs/issues

[node6x]:https://img.shields.io/badge/node-v6.x-brightgreen.svg

[license]:https://img.shields.io/badge/license-GPL%20V3-red.svg

[lic_file]:https://raw.githubusercontent.com/xiyouMc/WebHubBot/master/LICENSE

