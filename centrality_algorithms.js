const centrality = require("ngraph.centrality");
const g = require("ngraph.graph")();
const dbManager = require("./dbManager")
var dbm = new dbManager();


function getAllNodesFromDB() {
    let nodes = dbm.getAllNodes()
    //console.log("NODES: ", nodes);
    nodes.then(function (result) {
        let nodeDegrees = dbm.getActualNodeDegree()
        nodeDegrees.then(function (degree_result){

            //All Nodes in the DB
            let nodeSets = result.results.bindings;
            //All Nodes with their NodeDegrees
            let degreeSets = degree_result.results.bindings;
            computeCentralityAlgorithms(nodeSets, degreeSets);
        })
    }).catch(function (err) {
        console.log(err);
    })
}

// function getActualNodeDegree() {
//     let nodes = dbm.getActualNodeDegree()
//     //console.log("NODES: ", nodes);
//     nodes.then(function (result) {
//         //console.log(result.results.bindings);
//         let nodeSets = result.results.bindings;
//         console.log(nodeSets);
//         updateNodeDegree(nodeSets)
//         //let keys = Object.keys(nodeSets);
//         //console.log(keys);
//     }).catch(function (err) {
//         console.log(err);
//     })
// }

// function updateNodeDegree(nodeSets) {
//     nodeSets.forEach(element => {
//         let triple_new = ''
//     })
// }

function computeCentralityAlgorithms(nodeSets, degreeSets) {
    nodeSets.forEach(element => {
        let subject = removeUri(element.s.value);
        let object = removeUri(element.o.value);

        g.addLink(subject, object);
    })
    var degreeCentrality = centrality.degree(g);
    var inDegreeCentrality = centrality.degree(g,"in");
    var outDegreeCentrality = centrality.degree(g, 'out')
    var betweenessCentrality = centrality.betweenness(g, true);

    dbm.insertDegreeCentrality(degreeCentrality, degreeSets);
}

function removeUri(string) {
    let newString = "";
    if (string.includes("http://example.org/dgc#")) {
        newString = string.replace("http://example.org/dgc#", "uri-")

    }
    return newString
}

getAllNodesFromDB()
