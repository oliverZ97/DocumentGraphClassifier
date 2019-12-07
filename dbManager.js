const request = require("request");
const fs = require("fs");
const egc = require('./enapso-graphdb-client');
//const cenAlg = require("./centrality_algorithms");
const prefix = 'dgc:'

module.exports = class DBManager {
    constructor() {

    }

    insertArticleQueries(article) {
        //let prefix = 'dgc:';
        this.insertTypeOfArticle(prefix, article);
        let id = this.insertArticleWithId(prefix, article);
        let text = this.insertTextOfArticle(prefix, article);
        let author = this.insertArticleWithAuthor(prefix, article);
        let category = this.insertArticleWithCategory(prefix, article);
        //let persons = this.insertArticleWithPersons(prefix, article);
        //let locations = this.insertArticleWithLocations(prefix, article);
        let articleObj = {
            id: id,
            author: author,
            category: category,
            persons: persons,
            locations: locations,
            text: text,
        }
        //cenAlg.getAllNodesFromDB();
        return articleObj;
    }

    insertTypeOfArticle(prefix, article) {
        let triple = '';
        let subject = prefix + article.externalId;
        let predicate = 'rdf:Type';
        let object = prefix + 'Article';
        triple = subject + ' ' + predicate + ' ' + object + "."
        let insert = egc.demoInsert(triple);
    }

    insertArticleWithId(prefix, article) {
        let triple = '';
        let subject = prefix + article.externalId;
        let predicate = prefix + 'hasId';
        let object = article.externalId;
        triple = subject + ' ' + predicate + ' ' + object + "."
        let insert = egc.demoInsert(triple);
        return article.externalId;
    }

    insertArticleWithAuthor(prefix, article) {
        //console.log(article);
        let triple = '';
        let subject = prefix + article.externalId;
        let predicate = prefix + 'hasAuthor';
        let string = article.authors[0].replace(/ /g, '_') || '';
        let object = string;    //only the first author ist used!
        triple = subject + ' ' + predicate + ' \"' + object + "\"."
        let insert = egc.demoInsert(triple);
        return article.authors[0];
    }

    insertArticleWithCategory(prefix, article) {
        let triple = '';
        let subject = prefix + article.externalId;
        let predicate = prefix + 'hasCategory';
        let object = article.category;
        triple = subject + ' ' + predicate + ' \"' + object + "\"."
        let insert = egc.demoInsert(triple);
        return article.category;
    }

    insertArticleWithPersons(prefix, article) {
        let persons = this.extractLemma(article.linguistics.persons)
        for (let i = 0; i < persons.length; i++) {
            let subject = prefix + article.externalId;
            let predicate = prefix + 'mentions';
            let object = prefix + persons[i];
            let triple = subject + ' ' + predicate + ' ' + object + "."
            let insert = egc.demoInsert(triple);
        }
        this.insertTypeOfEntity(prefix, persons, "Person")
        this.insertLiteralValueForEntity(prefix, persons)
        return persons;
    }

    insertArticleWithLocations(prefix, article) {
        let locations = this.extractLemma(article.linguistics.geos)
        for (let i = 0; i < locations.length; i++) {
            let subject = prefix + article.externalId;
            let predicate = prefix + 'mentions';
            let object = prefix + locations[i];
            let triple = subject + ' ' + predicate + ' ' + object + ".";
            let insert = egc.demoInsert(triple);
        }
        this.insertTypeOfEntity(prefix, locations, "Location")
        this.insertLiteralValueForEntity(prefix, locations)
        return locations;
    }

    insertLiteralValueForEntity(prefix, array) {
        let triple = '';
        for (let i = 0; i < array.length; i++) {
            let subject = prefix + array[i];
            let predicate = prefix + 'hasValue';
            let object = array[i];
            triple = subject + ' ' + predicate + ' \"' + object + "\"."
            let insert = egc.demoInsert(triple);
        }

        return triple;
    }

    insertTypeOfEntity(prefix, array, type) {
        let triple = '';
        for (let i = 0; i < array.length; i++) {
            let subject = prefix + array[i];
            let predicate = "rdf:Type";
            let object = prefix + type;
            triple = subject + ' ' + predicate + ' ' + object + "."
            let insert = this.callInsertFunctionWithTimeout(triple);
        }

        return triple;
    }

    extractLemma(array) {
        let entities = [];
        array.forEach(element => {
            let entity = element.lemma.replace(/ /g, '_')
            entities.push(entity)
        });
        return entities;
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

    insertDegreeCentrality(degreeCentrality) {
        let object = JSON.parse(JSON.stringify(degreeCentrality));
        let keys = Object.keys(object)
        let values = Object.values(object);
        //console.log(keys);
        for (let i = 0; i < keys.length; i++) {
            setTimeout(function () {

                let uri = keys[i].replace("uri-", prefix);
                let triple_new = '';
                let subject = uri;
                let predicate = prefix + 'nodeDegree';
                let object = values[i];
                triple_new = subject + ' ' + predicate + ' \"' + object + "\"."

                console.log(triple_new);

                let deleteOld = egc.deleteWhere(subject, predicate);
                let insert = egc.demoInsert(triple_new);
            }, 1000)
        }
    }

    insertInDegreeCentrality(inDegreeCentrality) {
        let object = JSON.parse(JSON.stringify(inDegreeCentrality));
        let keys = Object.keys(object)
        let values = Object.values(object);
        //console.log(keys);
        for (let i = 0; i < keys.length; i++) {
            setTimeout(function () {

                let uri = keys[i].replace("uri-", prefix);
                let triple_new = '';
                let subject = uri;
                let predicate = prefix + 'inDegree';
                let object = values[i];
                triple_new = subject + ' ' + predicate + ' \"' + object + "\"."

                console.log(triple_new);

                let deleteOld = egc.deleteWhere(subject, predicate);
                let insert = egc.demoInsert(triple_new);
            }, 1000)
        }
    }

    insertOutDegreeCentrality(outDegreeCentrality) {
        let object = JSON.parse(JSON.stringify(outDegreeCentrality));
        let keys = Object.keys(object)
        let values = Object.values(object);
        //console.log(keys);
        for (let i = 0; i < keys.length; i++) {
            setTimeout(function () {

                let uri = keys[i].replace("uri-", prefix);
                let triple_new = '';
                let subject = uri;
                let predicate = prefix + 'outDegree';
                let object = values[i];
                triple_new = subject + ' ' + predicate + ' \"' + object + "\"."

                console.log(triple_new);

                let deleteOld = egc.deleteWhere(subject, predicate);
                let insert = egc.demoInsert(triple_new);
            }, 1000)
        }
    }

    insertBetweenessCentrality(betweenessCentrality) {
        let object = JSON.parse(JSON.stringify(betweenessCentrality));
        let keys = Object.keys(object)
        let values = Object.values(object);
        //console.log(keys);
        for (let i = 0; i < keys.length; i++) {
            setTimeout(function () {

                let uri = keys[i].replace("uri-", prefix);
                let triple_new = '';
                let subject = uri;
                let predicate = prefix + 'betweenessCentrality';
                let object = values[i];
                triple_new = subject + ' ' + predicate + ' \"' + object + "\"."

                console.log(triple_new);

                let deleteOld = egc.deleteWhere(subject, predicate);
                let insert = egc.demoInsert(triple_new);
            }, 1000)
        }
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

    callInsertFunctionWithTimeout(triple) {
        setTimeout(function () {
            egc.demoInsert(triple)
        }, 1000)
    }

}
