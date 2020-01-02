var fs = require('fs');
var dbManager = require('./dbManager');
let dbm = new dbManager();
var documents = [];
var locations = [];
var persons = [];
var articles = [];

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
function readFromTrainingSet(){
    let filestring = fs.readFileSync("../results/trainingset.json");
    let fileobj = JSON.parse(filestring);
    console.log(fileobj);
    fileobj.forEach((elem) => {
        documents.push(elem);
    })
}
/******************************************************************************************************/
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
function extractDocuments(jsonobj) {
    let docs = jsonobj.documents;
    return docs;
}
/******************************************************************************************************/
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
function setupSchema() {
    let triples = "" +
    "dgc:Article rdf:Type rdf:Class. \n dgc:Location rdf:Type rdf:Class. \n dgc:Person rdf:Type rdf:Class. \n" +
    "dgc:mentions rdf:Type rdf:Property. \n dgc:hasId rdf:Type rdf:Property. \n dgc:hasAuthor rdf:Type rdf:Property. \n" +
    "dgc:hasRealCategory rdf:Type rdf:Property. \n dgc:hasLanguage rdf:Type rdf:Property. \n dgc:hasTitle rdf:Type rdf:Property. \n" +
    "dgc:nodeDegree rdf:Type rdf:Property. \n dgc:inDegree rdf:Type rdf:Property. \n dgc:outDegree rdf:Type rdf:Property. \n" +
    "dgc:betweenessCentrality rdf:Type rdf:Property. \n dgc:hasValue rdf:Type rdf:Property. \n" +
    "dgc:hasAuthor rdfs:domain dgc:Article. \n dgc:Author rdfs:range rdfs:Literal. \n dgc:mentions rdfs:domain dgc:Article. \n" +
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





