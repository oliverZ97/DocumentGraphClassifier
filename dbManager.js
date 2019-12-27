const request = require("request");
const fs = require("fs");
const egc = require('./enapso-graphdb-client');
//const cenAlg = require("./centrality_algorithms");
const prefix = 'dgc:'
var bugs = [];

module.exports = class DBManager {
    constructor() {

    }

    insertArticleQueries(setup, persons, locations, articles) {
        egc.demoInsert(setup);
        egc.insertLocations(locations);
        egc.insertPersons(persons)
        articles.forEach((elem) => {
            let triples = this.createArticleTriples(elem);
            egc.demoInsert(triples);
        })
        console.log(bugs);
    }

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
                // if (lemma.match(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g)) {
                //     let bug = {
                //         id: article.id,
                //         lemma: lemma,
                //         type: "location"
                //     };
                //     bugs.push(bug);
                // } else {
                    let cleanGeo = lemma.replace(/ /g, "_").replace(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g, "-");
                    let tri_geo = prefix + article.id + " " + prefix + "mentions " + prefix + cleanGeo + ". \n";
                    let tri_geo_value = prefix + cleanGeo + " " + prefix + "hasValue \"" + lemma + "\". \n";
                    let tri_geo_type = prefix + cleanGeo + " rdf:Type " + prefix + "Location. \n";
                    triples = triples + tri_geo + tri_geo_value + tri_geo_type;
                // }
            })
        }
        if (article.persons !== undefined) {
            article.persons.forEach((pers) => {
                let lemma = pers.lemma;
                // if (lemma.match(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g)) {
                //     let bug = {
                //         id: article.id,
                //         lemma: lemma,
                //         type: "person"
                //     };
                //     bugs.push(bug);
                // } else {
                    let cleanPers = lemma.replace(/ /g, "_").replace(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g, "-");
                    let tri_pers = prefix + article.id + " " + prefix + "mentions " + prefix + cleanPers + ". \n";
                    let tri_pers_value = prefix + cleanPers + " " + prefix + "hasValue \"" + lemma + "\". \n";
                    let tri_pers_type = prefix + cleanPers + " rdf:Type " + prefix + "Person. \n";
                    triples = triples + tri_pers + tri_pers_value + tri_pers_type;
                // }
            })
        }
        return triples;
    }

    getUnclassifiedArticles(nr) {
        let promise = new Promise(function (resolve, reject) {
            let un_art = egc.getUnclassifiedArticles();
            let rdm_art = 'test';
            un_art.then(function (result) {
                rdm_art = result.results.bindings[nr].article.value;
                return resolve(rdm_art);
            })

        })
        return (promise);
    }

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

    getEntitiesOfArticle(art_id) {
        let promise = new Promise(function (resolve, reject) {
            let nodes = egc.getEntitiesOfArticĺe(prefix + art_id);
            nodes.then(function (result) {

                return resolve(result);
            })
                .catch(function (err) {
                    console.log(err);
                })

        })
        return (promise);
    }

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

    insertCentrality(centrality, centralityType) {
        let allTriples = "";
        let object = JSON.parse(JSON.stringify(centrality));
        let keys = Object.keys(object)
        let values = Object.values(object);
        let triples = "";
        //let deleteTriples = ""
        for (let i = 0; i < keys.length; i++) {
            let uri = keys[i].replace("uri-", prefix);
            let triple_new = '';
            let subject = uri;
            let predicate = prefix + centralityType;
            let object = values[i];
            triple_new = subject + ' ' + predicate + ' \"' + object + "\".\n"
            if(subject === undefined || subject === "" || subject === " "){
                console.log("Empty")
                continue;
            }

            //let tri_del = subject + ' ' + predicate + '?o.\n';
            //deleteTriples = deleteTriples + tri_del;
            triples = triples + triple_new;
            if (i % 2000 === 0) {
                allTriples = allTriples + triples + "\n";
                //let deleteOld = egc.deleteTriples(deleteTriples);
                let insert = egc.demoInsert(triples);
                triples = "";
                //deleteTriples = ""
            }
        }
        //let deleteOld = egc.deleteTriples(deleteTriples);
        let insert = egc.demoInsert(triples);
        allTriples = allTriples + triples + "\n";
        fs.writeFileSync("test.txt", allTriples);
    }

    getSumOfArticlesInCategoryWithEntity(entity) {
        console.log("TEEEEST!")
        let promise = new Promise(function (resolve, reject) {
            let wirtschaft = egc.getSumOfArticlesInCategoryWithEntity(entity, "Wirtschaft");
            let politik = egc.getSumOfArticlesInCategoryWithEntity(entity, "Politik");
            let kultur = egc.getSumOfArticlesInCategoryWithEntity(entity, "Kultur");
            let sport = egc.getSumOfArticlesInCategoryWithEntity(entity, "Sport");

            wirtschaft.then(function (result_w) {
                console.log("Wirtschaft", result_w);
                politik.then(function (result_p) {
                    kultur.then(function (result_k) {
                        sport.then(function (result_s) {
                            console.log("Wirtschaft", result_w);
                            console.log("Politik", result_p);
                            console.log("Kultur", result_k);
                            console.log("Sport", result_s);
                            return resolve(result);
                        })
                    })
                })
            })
                .catch(function (err) {
                    console.log(err);
                })

        })
        return (promise);
    }

}
