const request = require("request");
const fs = require("fs");

const graphURL = "http://localhost:7200/repositories/dgc"
//const graphURL = "http://192.168.99.100:7200/repositories/bachelor"

module.exports = class DBManager {
    constructor(){
        
    }

    dbGet(url) {
        let options = {
            url: url,
            headers: {
                'User-Agent': 'request',
                'Accept': 'application/sparql-results+json,*/*;q=0.9'
            }
        }
        let promise = new Promise(function(resolve, reject) {
            // Do async job
            console.log("Promise");
            request.get(options, function(err, resp, body) {
                if (err) {
                    console.log("Fail")
                    reject(err);
                } else {
                    console.log("Success");
                    setTimeout(() => resolve(body), 2000);
                }
            })
        })
        return promise;
    }

    dbPost(url) {
        let options = {
            url: url,
            headers: {
                'User-Agent': 'request',
                'content-type' : 'application/x-www-form-urlencoded',
                'Accept': 'application/sparql-results+json,*/*;q=0.9'
            }
        }
        let promise = new Promise(function(resolve, reject) {
            // Do async job
            console.log("Promise");
            request.post(options, function(err, resp, body) {
                if (err) {
                    console.log("Fail")
                    reject(err);
                } else {
                    console.log("Success");
                    setTimeout(() => resolve(body), 2000);
                }
            })
        })
        return promise;
    }

    createURLFromString(term) {
        let string = graphURL + "?query=" + term
        console.log("cufs" + string)
        return string;
    }

    insertArticleQuery(article) {
        let id = article.externalId;
        let author = article.authors; //Literal
        let category = article.category //IRI
        let persons = this.extractLemma(article.linguistics.persons)
        let locations = this.extractLemma(article.linguistics.geos)
        //let keywords = this.extractLemma(article.linguistics.keywords)
        let url = graphURL + "?name=&infer=true&sameAs=true&query=PREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX+dgc%3A+%3Chttp%3A%2F%2Fexample.org%2Fdgc%2Fdata%2F%23%3E%0AINSERT+DATA%7B%0A++++GRAPH+%3Chttp%3A%2F%2Fexample.org%2Fdgc%2Fdata%3E+%7B%0A++++++++%3Chttp%3A%2F%2Fexample.org%2Fdgc%2Fdata%2F%23" + id + "%3E+rdf%3AType+dgc%3AArticle%3B%0A++++++++++++++++++++++++++++++++++++++++++++++dgc%3AId+%22" + id + "%22.%0A++++%7D%0A%7D%0A";
        return url;
    }

    getAllTriples() {
        let url = graphURL + "?query=select+*+where+%7B+%0A%09%3Fs+%3Fp+%3Fo+.%0A%7D+limit+100+%0A";
        return url;
    }

    createTriple(subject, index, object, isLiteral) {
        let predicates = [
            "http://www.w3.org/1999/02/22-rdf-syntax-ns#Type",
            "http://example.org/dgc/data/#mentions",
            "http://example.org/dgc/data/#hasValue",
            "http://example.org/dgc/data/#hasAuthor",
            "http://example.org/dgc/data/#hasId",
            "http://example.org/dgc/data/#hasCategory",
            "http://example.org/dgc/data/#degree_in",
            "http://example.org/dgc/data/#degree_out"
        ]
        if(isLiteral){
            let triple = {
                subject: this.createIRI(subject),
                predicate: predicates[index],
                object: object
            }
        } else {
            let triple = {
                subject: this.createIRI(subject),
                predicate: predicates[index],
                object: this.createIRI(object)
            }
        }
        return triple;
    }

    createIRI(element) {
        let base = "http://example.org/dgc/data/#";
        let IRI = base + element;
        return IRI;
    }

    extractLemma(array) {
        let entities = [];
        array.forEach(element => {
            entities.push(element.lemma)
        });
        return entities;
    }

}

//Insert
//"?query=PREFIX+rdf%3A+%3Chttp%3A%2F%2Fwww.w3.org%2F1999%2F02%2F22-rdf-syntax-ns%23%3E%0APREFIX+dgc%3A+%3Chttp%3A%2F%2Fexample.org%2Fdgc%2Fdata%2F%23%3E%0AINSERT+%7B%0A++++GRAPH+%3Chttp%3A%2F%2Fexample.org%2Fdgc%2Fdata%3E+%7B%0A++++++++%3Chttp%3A%2F%2Fexample.org%2Fdgc%2Fdata%2F%23" + id + "%3E+rdf%3AType+dgc%3AArticle%3B%0A++++++++++++++++++++++++++++++++++++++++++++++dgc%3AId+%22" + id + "%22.%0A++++%7D%0A%7D%0A"