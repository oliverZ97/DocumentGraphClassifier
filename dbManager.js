const egc = require('./enapso-graphdb-client');
const prefix = 'dgc:'
var bugs = [];

module.exports = class DBManager {
    constructor() {

    }
    /******************************************************************************************************/
    /*
    *description: this function handles the transformation of the data given in the parameters to triples 
    *which are written into the database. The rdf schema has to be the first data written down. After that 
    *the locations and persons get written into the database. Last the information about the article and 
    *the connections to the corresponding entities is written down.
    *@param: setup {string} - a string containing multiple triples representing the rdf schema for the graph.
    *@param: persons {array} - an array containing the lemmas of the type person entities represented as strings.
    *@param: locations {array} - an array containing the lemmas of the type location entities represented as strings.
    *@param: articles {array} - an array containing all articles and their relevant information represented by objects.
    *@return: 
    */
    insertArticleQueries(setup, persons, locations, articles) {
        egc.insertTriple(setup);
        egc.insertLocations(locations);
        egc.insertPersons(persons)
        articles.forEach((elem) => {
            let triples = this.createArticleTriples(elem);
            egc.insertTriple(triples);
        })
        console.log(bugs);
    }
    /******************************************************************************************************/
    /*
    *description: transforms the property values of the given article object into triples and stores all of 
    *them in a string. In some cases spaces and special characters are replaced with an Underscore or a hyphen.
    *@param: article {object} - this object represents all relevant data about an article like 
    *                           id, author, language, title, entities, etc.
    *@return: triples {string} - contains the data of the article object transformed to multiple triples.
    */
    createArticleTriples(article) {
        let triples = ""
        let tri_type = prefix + article.id + " rdf:Type " + prefix + "Article . \n";
        let tri_id = prefix + article.id + " " + prefix + "hasId \"" + article.id + "\".\n";
        let tri_realCat = prefix + article.id + " " + prefix + "hasRealCategory \"" + article.realCategory + "\".\n";
        let tri_title = prefix + article.id + " " + prefix + "hasTitle \"" + article.title + "\".\n";
        let tri_lang = prefix + article.id + " " + prefix + "hasLanguage \"" + article.language + "\".\n";
        triples = tri_type + tri_id + tri_realCat + tri_title + tri_lang;
        if (article.authors !== undefined) {
            article.authors.forEach((elem) => {
                let tri_author = prefix + article.id + " " + prefix + "hasAuthor \"" + elem + "\". \n";
                triples = triples + tri_author;
            })
        }
        if (article.locations !== undefined) {
            article.locations.forEach((geo) => {
                let lemma = geo.lemma;
                let cleanGeo = lemma.replace(/ /g, "_").replace(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g, "-");
                let tri_geo = prefix + article.id + " " + prefix + "mentions " + prefix + cleanGeo + ". \n";
                let tri_geo_value = prefix + cleanGeo + " " + prefix + "hasValue \"" + lemma + "\". \n";
                let tri_geo_type = prefix + cleanGeo + " rdf:Type " + prefix + "Location. \n";
                triples = triples + tri_geo + tri_geo_value + tri_geo_type;
            })
        }
        if (article.persons !== undefined) {
            article.persons.forEach((pers) => {
                let lemma = pers.lemma;
                let cleanPers = lemma.replace(/ /g, "_").replace(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g, "-");
                let tri_pers = prefix + article.id + " " + prefix + "mentions " + prefix + cleanPers + ". \n";
                let tri_pers_value = prefix + cleanPers + " " + prefix + "hasValue \"" + lemma + "\". \n";
                let tri_pers_type = prefix + cleanPers + " rdf:Type " + prefix + "Person. \n";
                triples = triples + tri_pers + tri_pers_value + tri_pers_type;
            })
        }
        return triples;
    }
    /******************************************************************************************************/
    /*
    *description: this function starts a call to the database to receive all nodes existing in the database. 
    *Because of the async nature of a database the call is wrapped inside a promise.
    *@param: 
    *@return: if the call is successful the results of the call are returned. Otherwise the whole promise is returned.
    */
    getAllNodes() {
        let promise = new Promise(function (resolve, reject) {
            let nodes = egc.getAllNodes();
            nodes.then(function (result) {
                return resolve(result);
            })
                .catch(function (err) {
                    console.log(err);
                })

        })
        return (promise);
    }
    /******************************************************************************************************/
    /*
    *description: this function starts a call to the database to receive all triples of all articles which 
    *mentions the entity given by the parameter. Because of the async nature of a database the call is 
    *wrapped inside a promise.
    *@param: entity {string} - representing an entity of the article which needs to be classified. Spaces 
    *                          and special characters are already replaced to match the IRIs of the database.
    *@return: if the call is successful the results of the call are returned. Otherwise the whole promise is returned.
    */
    getEntitiesOfArticleWithEntity(entity) {
        let promise = new Promise(function (resolve, reject) {
            let nodes = egc.getEntitiesOfArticĺeWithEntity(entity);
            nodes.then(function (result) {

                return resolve(result);
            })
                .catch(function (err) {
                    console.log(err);
                })

        })
        return (promise);
    }
    /******************************************************************************************************/
    /*
    *description: this function creates triples for every property and it's value inside the object "centrality" 
    *given by the parameter. These triples are collected and a call to the database is started everytime an 
    *amount of 2000 triples is reached. A higher number could fail the call to the database and leads to gaps in 
    *the data. After the call was send the variable triples ist reset to "".
    *@param: centrality {object} - this object represents all nodes of the actual graph and the number of a 
    *                              specific metric. The name of the node is given by a property, while the number 
    *                              is given by the properties value.
    *@param: centralityType {string} - shows which metric is given and used to set the correct predicate for the 
    *                                  database triples
    *@return: 
    */
    insertCentrality(centrality, centralityType) {
        let allTriples = "";
        let object = JSON.parse(JSON.stringify(centrality));
        let keys = Object.keys(object)
        let values = Object.values(object);
        let triples = "";
        for (let i = 0; i < keys.length; i++) {
            let uri = keys[i].replace("uri-", prefix);
            let triple_new = '';
            let subject = uri;
            let predicate = prefix + centralityType;
            let object = values[i];
            triple_new = subject + ' ' + predicate + ' \"' + object + "\".\n"
            if (subject === undefined || subject === "" || subject === " ") {
                console.log("Empty")
                continue;
            }
            triples = triples + triple_new;
            if (i % 2000 === 0) {
                allTriples = allTriples + triples + "\n";
                egc.insertTriple(triples);
                triples = "";
            }
        }
        egc.insertTriple(triples);
        allTriples = allTriples + triples + "\n";
    }
}
