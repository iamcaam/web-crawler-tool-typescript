// app.ts
import express from 'express';
import { reqApi } from './utils/axios';
import * as mongodb from 'mongodb';
import _http, { request } from 'http';
import dotenv from 'dotenv';
import path from 'path';

const app = express();
const http = _http.createServer(app);
const port = 3000;
const mongoClient = mongodb.MongoClient;
const ObjectID = mongodb.ObjectId;

dotenv.config({path: path.resolve(__dirname, ``)});


// app.set('view engine', 'ejs');

app.set('views', __dirname +'/views');
app.set('view engine', 'ejs');

app.use("/public", express.static(__dirname + '/public'));

import formidableMiddleware from 'express-formidable';
app.use(formidableMiddleware());
import requestModule from 'request';
import cheerio from 'cheerio';
// import htmlspecialchars from 'htmlspecialchars';
import * as utils from './utils/index'
import * as HTMLParser from 'node-html-parser';
import { Server } from 'socket.io';

// utils.default.htmlspecialchars("")

const io = new Server(http, {
  "cors": {
    "origin": "*"
  }
});

let database: mongodb.Db;

function getTagContent(querySelector: string, content: HTMLParser.HTMLElement, pageUrl: string): string[] {
  let tags = content.querySelectorAll(querySelector);
  let innerHTMLs = [];
  for(let a = 0; a < tags.length; a++) {
    let content = "";

    let anchorTag = tags[a].querySelector("a");

    if(anchorTag != null) {
      content = anchorTag.innerHTML;
    } else {
      content = tags[a].innerHTML;
    }

    content = content.replace(/\s+/g, ' ').trim();

    if(content.length > 0) {
      innerHTMLs.push(content);
    }
  }
  return innerHTMLs;
}

function crawlPage(url: string, callBack?:((...args: any[]) => void | null | undefined)) {
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  const baseUrl = protocol + '//' + host;

  io.emit("crawl_update", "Crawling page: " + url);

  requestModule(url, async function (error, response, html) {
    if(!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      const page = await database.collection("pages").
            findOne({
              "url": url
            });
      if(page == null) {
        const html = $.html();
        const htmlContent = HTMLParser.parse(html);

        let allAnchors = htmlContent.querySelectorAll("a");
        let anchors = [];
        for(let a = 0; a < allAnchors.length; a++) {
          let href = allAnchors[a].getAttribute("href");
          let title = allAnchors[a].innerHTML;
          let hasAnyChildTag = (allAnchors[a].querySelector("div") != null) ||
                               (allAnchors[a].querySelector("img") != null) ||
                               (allAnchors[a].querySelector("p") != null) ||
                               (allAnchors[a].querySelector("span") != null) ||
                               (allAnchors[a].querySelector("svg") != null) ||
                               (allAnchors[a].querySelector("strong") != null);
          if(hasAnyChildTag) {
            continue;
          }
          
          if(href != null) {
            if(href == "#" || href.search("javascript:void(0)") != -1) {
              continue;
            }

            let first4Words = href.substr(0, 4);

            if(href.search(url) == -1 && first4Words != "http") {
              if(href[0] == "/")
                href = baseUrl + href;
              else
                href = baseUrl + "/" + href;  
            }

            anchors.push({
              "href": href,
              "text": title
            });
          }
        }
        io.emit("crawl_update", utils.default.htmlspecialchars("<a>") + " tags has been crawled");
        let titles = await getTagContent("title", htmlContent, url);
        let title = titles.length > 0 ? titles[0] : "";
        io.emit("crawl_update", utils.default.htmlspecialchars("<title>") + " tags has been crawled");
        let h1s = await getTagContent("h1", htmlContent, url);
        io.emit("crawl_update", utils.default.htmlspecialchars("<h1>") + " tags has been crawled");
        let h2s = await getTagContent("h2", htmlContent, url);
        io.emit("crawl_update", utils.default.htmlspecialchars("<h2>") + " tags has been crawled");
        let h3s = await getTagContent("h3", htmlContent, url);
        io.emit("crawl_update", utils.default.htmlspecialchars("<h3>") + " tags has been crawled");
        let h4s = await getTagContent("h4", htmlContent, url);
        io.emit("crawl_update", utils.default.htmlspecialchars("<h4>") + " tags has been crawled");
        let h5s = await getTagContent("h5", htmlContent, url);
        io.emit("crawl_update", utils.default.htmlspecialchars("<h5>") + " tags has been crawled");
        let h6s = await getTagContent("h6", htmlContent, url);
        io.emit("crawl_update", utils.default.htmlspecialchars("<h6>") + " tags has been crawled");

        let ps = await getTagContent("p", htmlContent, url);
        io.emit("crawl_update", utils.default.htmlspecialchars("<p>") + " tags has been crawled");

        let object ={
          "url": url,
          "anchors": anchors,
          "title": title,
          "h1s": h1s,
          "h2s": h2s,
          "h3s": h3s,
          "h4s": h4s,
          "h5s": h5s,
          "h6s": h6s,
          "ps": ps,
          "time": new Date().getTime()
        };

        try {
          await database.collection("pages").insertOne(object);
        } catch (error) {
          console.log(error);
        }
        io.emit("page_crawled", object);
        io.emit("crawl_update", "Page crawled.");
      }else {
        io.emit("crawl_update", "Page already crawled.");
      }

      if(callBack != null) {
        callBack();
      }
    }
  });
}

http.listen(port, () => {
  console.log(`server is listening on ${port} !!!`);

  mongoClient.connect("mongodb://root:root@localhost:27017/?authSource=admin&readPreference=primary&directConnection=true&ssl=false", { connectTimeoutMS: 30000 }, function (error, client) {
    if(error)
      throw error;

      

    if(!client) {
      throw new Error("Database connect failed");
    } else {
      database = client?.db("web_crawler");
      console.log("Database connected");
    }

    app.post("/reindex", async function (request, result) {
      let url = request.fields?.url;

      await database.collection("pages").deleteOne({"url": url});
      io.emit("page_deleted", url);

      crawlPage(url as string, function () {
        console.log("reindex");
        let backURL = request.header('Referer') || '/';
        result.redirect(backURL);
      });


    });

    app.post("/delete-page", async function (request, result) {
      let url = request.fields?.url;

      await database.collection("pages").deleteOne({"url": url});
      io.emit("page_deleted", url);

      let backURL = request.header('Referer') || '/';
      result.redirect(backURL);
    });

    app.get("/page/:url", async function (request, result) {
      let url = request.params.url;
      let page = await database.collection("pages").findOne({
        "url": url
      });

      if(page == null) {
        result.render("404", {
          "message": "This page has not been crawled"
        });
        return false;
      }

      result.render("page", {
        "page": page
      });

    });

    app.post("/crawl-page", async (request: Express.Request, result) => {
      var url = request.fields?.url;

      if(url)
        crawlPage(url as string, undefined);

      result.json({
        "status": "success",
        "message": "Page has been crawled.",
        "url": url
      });
    })

    app.get('/', async(req, res) => {
      let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      let pages = await database.collection("pages").find({}).toArray();

      for (let index in pages) {
        let date = new Date(pages[index].time);
        let time = date.getDate() + " " + months[date.getMonth() + 1] + ", " + date.getFullYear() + " - " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        pages[index].time = time;
      }

      res.render('index', {
        "pages": pages
      });
    });
    

  })


});

// const a =  async() => { return await reqApi("https://blog.csdn.net/phoenix/web/v1/is-zero-article-user").then(data =>  console.log(data['data']));}

// a()
