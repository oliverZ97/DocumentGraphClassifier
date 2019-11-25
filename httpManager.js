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

app.get('/dgc/data',(req,res) => {
    let request = dbm.getAllTriples()
    let promise = dbm.dbGet(request);
    promise.then((result) => {
        console.log(result);
        return res.send(result)
    })
});


app.post('/dgc',(req,res) => {
    let article = req.body;
    //let request = dbm.insertArticleWithId(article);
    //let promise = dbm.dbPost(request);
    let promise = dbm.insertArticleQueries(article);
    console.log("PROMISE: ",promise);
    //promise.then((result) => {
        return res.send(promise)
    //})
});

app.listen(3300, () =>
    console.log("Server listening on Port 3300")
);