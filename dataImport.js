var fs = require('fs');
var dbManager = require('./dbManager');
let dbm = new dbManager();
var documents = [];
var locations = [];
var persons = [];
var articles = [];

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
    extractLocations();
    extractPersons();
    setArticles();
    dbm.insertArticleQueries(persons, locations, articles);
}

function setArticles() {
    documents.forEach((elem) => {
        let object = {
            id: elem.externalId,
            authors: elem.authors,
            realCategory: elem.category,
            locations: elem.linguistics.geos,
            persons: elem.linguistics.persons,
            language: elem.language,
            title: elem.title,
            publisher: elem.publisher
        }
        articles.push(object);
    })
    console.log(articles.length);
}

function extractDocuments(jsonobj) {
    let docs = jsonobj.documents;
    return docs;
}

function extractLocations() {
    let help_array = [];
    documents.forEach((art) => {
        let geos = art.linguistics.geos;
        geos.forEach((elem) => {
            help_array.push(elem);
        })
    })
    let unique = [...new Set(help_array)];
    locations = unique;
}

function extractPersons() {
    let help_array = [];
    documents.forEach((art) => {
        let pers = art.linguistics.persons;
        pers.forEach((elem) => {
            help_array.push(elem);
        })
    })
    let unique = [...new Set(help_array)];
    persons = unique;
}

parseJSONFile()




