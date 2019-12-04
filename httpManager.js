const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const dbManager = require("./dbManager")
var dbm = new dbManager();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//GET Requests to get Articles with ID
app.get('/dgc/art', (req, res) => {
    console.log("url query: " + req.query.id);
    let term = req.query.id || "";
    let request = dbm.createURLFromString(term);
    let promise = dbm.dbGet(request);
    console.log(promise);
    promise.then((result) => {
        console.log("Result: " + result)
        return res.send(result)
    })
});

app.get('/dgc', (req, res) => {
    if(req.query.nr !== undefined) {
        let nr = req.query.nr;
        let promise = dbm.getUnclassifiedArticles(nr);
        promise.then(function (result) {
            let resultobj = {
                id: result
            }
            res.send(resultobj);
        }).catch(function (err) {
            console.log(err);
        })
    } else if(req.query.art !== undefined) {
        let art_id = req.query.art;
        console.log("id: ",art_id);
        let promise = dbm.getEntitiesOfArticle(art_id);
        promise.then(function (result) {
            //console.log("RESULT: ", result.results.bindings);
            res.send(result.results.bindings);
        }).catch(function (err) {
            console.log(err);
        })
    }

});


app.post('/dgc', (req, res) => {
    let article = req.body;
    let promise = dbm.insertArticleQueries(article);
    console.log("PROMISE: ", promise);
    return res.send(promise)
});

app.listen(3300, () =>
    console.log("Server listening on Port 3300")
);