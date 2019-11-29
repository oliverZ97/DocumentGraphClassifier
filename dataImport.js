var fs = require('fs');
var fetch = require("node-fetch");
var dbManager = require('./dbManager');
let dbm = new dbManager();

/*var methods = {
    
    parseJSONFile: function(file) {
        let filestring = fs.readFile(file);
        let fileobj = JSON.parse(filestring);
        console.log(fileobj);
    }
} 

exports.data = methods;
*/

//How to pass the files from index.html to this Method?


function parseJSONFile() {
    let filestring = fs.readFileSync("./data/wirtschaft.json");
    let fileobj = JSON.parse(filestring);
    extractDocuments(fileobj);
}

function extractDocuments(jsonobj) {
    let documents = jsonobj.documents;
    let element = documents[1];
    callPost(element);
    // documents.forEach(element => {
    //     setTimeout(callPost(element), 2000);
    // });

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




