var fs = require('fs');
var fetch = require("node-fetch");
var dbManager = require('./dbManager');
let dbm = new dbManager();
var documents = [];
var locations = [];
var persons = [];

function parseJSONFile() {
    let filedir = fs.readdirSync("./data");
    filedir.forEach((file) => {
        let filestring = fs.readFileSync("./data/" + file);
        let fileobj = JSON.parse(filestring);
        let docs = extractDocuments(fileobj);
        docs.forEach((elem) => {
            documents.push(elem);
        })
    })
    console.log(documents.length);
    extractLocations();
    extractPersons();
    dbm.insertArticleQueries(persons, locations);
}

function extractDocuments(jsonobj) {
    let docs = jsonobj.documents;
    return docs;
}

function extractLocations() {
    let help_array = [];
    let bugs = [];
    documents.forEach((art) => {
        let geos = art.linguistics.geos;
        geos.forEach((elem) => {
            if(elem.lemma.match(/[\'|\+|\’|\,|\(\)|\/]/g)){
                let lemma_space = elem.lemma.replace(/ /g, "_");
                bugs.push(lemma_space);
            } else {
                let lemma_space = elem.lemma.replace(/ /g, "_");
                help_array.push(lemma_space);
            }
        })
    })
    let unique = [...new Set(help_array)];
    console.log("BUGS: ", bugs)
    locations = unique;
}

function extractPersons() {
    let help_array = [];
    let bugs = [];
    documents.forEach((art) => {
        let pers = art.linguistics.persons;
        pers.forEach((elem) => {
            if(elem.lemma.match(/[\'|\+|\’|\,|\(|\)|\/|\.|\"|\&quot]/g)){
                let lemma_space = elem.lemma.replace(/ /g, "_");
                bugs.push(lemma_space);
            } else {
                let lemma_space = elem.lemma.replace(/ /g, "_");
                help_array.push(lemma_space);
            }
        })
    })
    let unique = [...new Set(help_array)];
    persons = unique;
}

function callPost(article) {
    var params = article;
    //console.log("PARAMS: ", params);Loading...

    let url = "http://localhost:3300/dgc"
    fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })
    return function() {
        if(err) {
            console.log ("err")
        }
    }
    //.then(res => res.json())
    //.then(json => console.log(json))
}

function callGet() {
    let url = "http://localhost:3300/dgc/data"
    fetch(url, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

parseJSONFile()




