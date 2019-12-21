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
    console.log(documents[0].linguistics.geos);
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
    let bugs = [];
    documents.forEach((art) => {
        let geos = art.linguistics.geos;
        geos.forEach((elem) => {
            // if(elem.lemma.match(/[\'|\+|\’|\,|\(\)|\/]/g)){
                // let lemma_space = elem.lemma.replace(/ /g, "_");
                // bugs.push(lemma_space);
            // } else {
                let lemma_space = elem.lemma.replace(/ /g, "_");
                help_array.push(lemma_space);
            // }
        })
    })
    let unique = [...new Set(help_array)];
    console.log(bugs)
    //escapeSpecialChars(bugs);
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

function escapeSpecialChars(bugs){
    for(let i = 0; i < bugs.length; i++){
        let index = bugs[i].search(/[\'|\+|\’|\,|\(\)|\/]/);
        console.log(bugs[i], index);
        let start = bugs[i].slice(0, index-1);
        let end = bugs[i].slice(index-1, -1);
        let newString = start + "\\" + end;
        console.log(newString);
        bugs[i] = newString
    }
    //console.log(bugs)
}

parseJSONFile()




