var fs = require('fs');

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
    let filestring = fs.readFileSync("./data/kultur.json");
    let fileobj = JSON.parse(filestring);
    extractDocuments(fileobj);
}

function extractDocuments(jsonobj) {
    let documents = jsonobj.documents;
    documents.forEach(element => {
        let IRI = createIRI(element);
        console.log(IRI);
    });
}

function createIRI(element) {
    let base = "www.example.org/dgc/data/#";
    let IRI = base + element.id;
    return IRI;
}

parseJSONFile();