const request = require("request");

const graphURL = "http://localhost:7200/repositories/bachelor"
//const graphURL = "http://192.168.99.100:7200/repositories/bachelor"

module.exports = class DBManager {
    constructor(){
        
    }

    query(url) {
        let options = {
            url: url,
            headers: {
                'User-Agent': 'request',
                'Accept': 'application/sparql-results+json,*/*;q=0.9'
            }
        }
        console.log("query-method");
        let promise = new Promise(function(resolve, reject) {
            // Do async job
            request.get(options, function(err, resp, body) {
                if (err) {
                    reject(err);
                } else {
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
}



