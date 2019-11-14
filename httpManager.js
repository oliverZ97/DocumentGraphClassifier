const express = require("express");
const app = express();
//import { query, createURLFromString } from "./dbManager";
const dbManager = require("./dbManager")
var dbm = new dbManager();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

//GET Requests to get Articles with ID
app.get('/dgc/art', (req, res) => {
    console.log("url query: " + req.query.id);
    let term = req.query.id || "";
    let request = dbm.createURLFromString(term);
    let promise = dbm.query(request);
    promise.then((result) => {
        console.log("Result: " + result)
        return res.send(result)
    })
});

app.listen(3300, () =>
    console.log("Server listening on Port 3300")
);