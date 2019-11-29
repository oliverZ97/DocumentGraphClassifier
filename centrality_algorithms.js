const centrality = require("ngraph.centrality");
const g = require("ngraph.graph")();
const dbManager = require("./dbManager")
var dbm = new dbManager();


function getAllNodesFromDB() {
    let nodes = dbm.getAllNodes()
    //console.log("NODES: ", nodes);
    nodes.then(function (result) {
        //console.log(result.results.bindings);
        let nodeSets = result.results.bindings;
        computeDegreeCentrality(nodeSets);
    }).catch(function (err) {
        console.log(err);
    })
}

function computeDegreeCentrality(nodeSets) {
    nodeSets.forEach(element => {
        let subject = removeUri(element.s.value);
        let object = removeUri(element.o.value);

        console.log(subject, object)
        //console.log(object.replace(/\'g/, ""))
        g.addLink(subject, object);
    })
    var degreeCentrality = centrality.degree(g);
    console.log(degreeCentrality);
    dbm.insertDegreeCentrality(degreeCentrality);
}

function removeUri(string) {
    let newString = "";
    if(string.includes("http://example.org/dgc#")){
        newString = string.replace("http://example.org/dgc#", "uri-")

    }
    return newString
}

getAllNodesFromDB()
