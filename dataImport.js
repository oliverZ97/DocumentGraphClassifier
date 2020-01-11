/*******************************************************************************************************/
/*******************************************************************************************************/
/*
*author: Oliver Ziemann
*description: this script is responsible for reading in data from files, sort them and pass them to the dbManager.
*/
/*******************************************************************************************************/
/*******************************************************************************************************/
var fs = require('fs');
var dbManager = require('./dbManager');
let dbm = new dbManager();
var documents = [];
var locations = [];
var persons = [];
var articles = [];
/******************************************************************************************************/
/*
*description: this function is the entrypoint of this script. Depending on the chosed option it gets 
*the data saved in the directory ../data or the file from ../results/trainingset.json. After the extraction 
*of all relevant data it calls the dbManager.js for the next steps. In the end the data gets written in the database.
*@param: 
*@return: 
*/
module.exports = parseJSONFile = function() {
    let isTrainingset = true;
    if(isTrainingset){
        readFromTrainingSet()
    } else {
        readFromDirData()
    }
    let setup = setupSchema();
    extractLocations();
    extractPersons();
    setArticles();
    dbm.insertArticleQueries(setup, persons, locations, articles);
}
/******************************************************************************************************/
/*
*description: reads in all files which are in the folder ../data and parses their content to a json object. 
*In the next step the value of the property "documents" is extracted. "documents" is an array containing 
*all article objects. Every single article object of each file gets pushed in the global documents array together.
*@param: 
*@return: 
*/
function readFromDirData(){
    let filedir = fs.readdirSync("../data");
    filedir.forEach((file) => {
        let filestring = fs.readFileSync("../data/" + file);
        let fileobj = JSON.parse(filestring);
        let docs = extractDocuments(fileobj);
        docs.forEach((elem) => {
            documents.push(elem);
        })
    })
}
/******************************************************************************************************/
/*
*description: the file "trainingset.json" is read in and is parsed to a json object. All article objects 
*inside the json object is pushed into the global documents array above.
*@param: 
*@return: 
*/
function readFromTrainingSet(){
    let filestring = fs.readFileSync("../results/trainingset.json");
    let fileobj = JSON.parse(filestring);
    console.log(fileobj);
    fileobj.forEach((elem) => {
        documents.push(elem);
    })
}
/******************************************************************************************************/
/*
*description: this function creates new article objects for each article object in documents. 
*Only the relevant data is taken from the old objects to reduce the amount of data that needs to be worked with 
*in the next steps. The new objects gets pushed into a global array called article.
*@param: 
*@return: 
*/
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
/******************************************************************************************************/
/*
*description: extract the value of the property documents of the given jsonobj and returns it.
*@param: jsonobj {object} - an object containing an amount of documents which is needed but also more 
*                           data which is not relevant for any other step of the whole classifier.
*@return: docs {array} - an array containing all article objects needed in the next steps.
*/
function extractDocuments(jsonobj) {
    let docs = jsonobj.documents;
    return docs;
}
/******************************************************************************************************/
/*
*description: this function extracts all entities of the type geo of each article and pushes their lemma 
*to an help array. Thereafter the duplicate entities are removed and the remaining entities get saved in 
*the global array locations.
*@param: 
*@return: 
*/
function extractLocations() {
    let help_array = [];
    documents.forEach((art) => {
        let geos = art.linguistics.geos;
        geos.forEach((elem) => {
            help_array.push(elem.lemma);
        })
    })
    let unique = [...new Set(help_array)];
    locations = unique;
}
/******************************************************************************************************/
/*
*description: this function extracts all entities of the type person of each article and pushes their lemma 
*to an help array. Thereafter the duplicate entities are removed and the remaining entities get saved in 
*the global array persons.
*@param: 
*@return: 
*/
function extractPersons() {
    let help_array = [];
    let bugs = [];
    documents.forEach((art) => {
        let pers = art.linguistics.persons;
        pers.forEach((elem) => {
            help_array.push(elem.lemma);
        })
    })
    let unique = [...new Set(help_array)];
    persons = unique;
}
/******************************************************************************************************/
/*
*description: this function simply contains an amount of triples representing the rdf schema for the 
*graph that is written in the next step. 
*@param: 
*@return: triples {string} - contains triples which represent the rules of a rdf graph, called a rdf schema.
*/
function setupSchema() {
    let triples = "" +
    "dgc:Article rdf:Type rdf:Class. \n dgc:Location rdf:Type rdf:Class. \n dgc:Person rdf:Type rdf:Class. \n" +
    "dgc:mentions rdf:Type rdf:Property. \n dgc:hasId rdf:Type rdf:Property. \n dgc:hasAuthor rdf:Type rdf:Property. \n" +
    "dgc:hasRealCategory rdf:Type rdf:Property. \n dgc:hasLanguage rdf:Type rdf:Property. \n dgc:hasTitle rdf:Type rdf:Property. \n" +
    "dgc:nodeDegree rdf:Type rdf:Property. \n dgc:inDegree rdf:Type rdf:Property. \n dgc:outDegree rdf:Type rdf:Property. \n" +
    "dgc:betweenessCentrality rdf:Type rdf:Property. \n dgc:hasValue rdf:Type rdf:Property. \n" +
    "dgc:hasAuthor rdfs:domain dgc:Article. \n dgc:hasAuthor rdfs:range rdfs:Literal. \n dgc:mentions rdfs:domain dgc:Article. \n" +
    "dgc:mentions rdfs:range dgc:Person. \n dgc:mentions rdfs:range dgc:Location. \n dgc:hasId rdfs:domain dgc:Article. \n" +
    "dgc:hasId rdfs:range rdfs:Literal. \n dgc:hasRealCategory rdfs:domain dgc:Article. \n dgc:hasRealCategory rdfs:range rdfs:Literal. \n" +
    "dgc:hasLanguage rdfs:domain dgc:Article. \n dgc:hasLanguage rdfs:range rdfs:Literal. \n dgc:hasTitle rdfs:domain dgc:Article. \n" + 
    "dgc:hasTitle rdfs:range rdfs:Literal. \n dgc:nodeDegree rdfs:domain dgc:Article. \n dgc:nodeDegree rdfs:domain dgc:Person. \n " +
    "dgc:nodeDegree rdfs:domain dgc:Location. \n dgc:nodeDegree rdfs:domain rdf:Class. dgc:nodeDegree rdfs:range rdfs:Literal. \n " +
    "dgc:inDegree rdfs:domain dgc:Article. \n dgc:inDegree rdfs:domain dgc:Person. \n dgc:inDegree rdfs:domain dgc:Location. \n " +
    "dgc:inDegree rdfs:domain rdf:Class. \n dgc:inDegree rdfs:range rdfs:Literal. \n dgc:outDegree rdfs:domain dgc:Article. \n " +
    "dgc:outDegree rdfs:domain dgc:Person. \n dgc:outDegree rdfs:domain dgc:Location. \n dgc:outDegree rdfs:domain rdf:Class. \n" +
    "dgc:outDegree rdfs:range rdfs:Literal. \n dgc:betweenessCentrality rdfs:domain dgc:Article. \n dgc:betweenessCentrality rdfs:domain dgc:Person. \n" +
    "dgc:betweenessCentrality rdfs:domain dgc:Location. \n dgc:betweenessCentrality rdfs:domain rdf:Class. \n dgc:betweenessCentrality rdfs:range rdfs:Literal. \n" +
    "dgc:hasValue rdfs:domain dgc:Person. \n dgc:hasValue rdfs:domain dgc:Location. \n dgc:hasValue rdfs:range rdfs:Literal. \n";
    return triples;
}
/******************************************************************************************************/
parseJSONFile()





