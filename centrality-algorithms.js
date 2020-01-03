/*******************************************************************************************************/
/*******************************************************************************************************/
/*
*author: Oliver Ziemann
*description: this script is calculates different graph metrics like the node Degree of in- and outcoming 
*edges or the betweeness centrality of a node. The results of all metrics are written in the database as triples.
*/
/*******************************************************************************************************/
/*******************************************************************************************************/
const centrality = require("ngraph.centrality");
const g = require("ngraph.graph")();
const dbManager = require("./dbManager")
var dbm = new dbManager();
/******************************************************************************************************/
/*
*description: this function is the entrypoint of the script. It starts a call to the database by call 
*the dbManager to receive all nodes in the actual graph. The result is used in the next step.
*@param: 
*@return: 
*/
module.exports = getAllNodesFromDB = function() {
    let nodes = dbm.getAllNodes()
    nodes.then(function (result) {
        let nodeSets = result.results.bindings;
        computeCentralityAlgorithms(nodeSets);
    }).catch(function (err) {
        console.log(err);
    })
}
/******************************************************************************************************/
//https://www.npmjs.com/package/ngraph.graph
//https://www.npmjs.com/package/ngraph.centrality
/*
*description: this function handles the calculation of the graphs metrics and the insertion of the 
*results to the database. Using the addLink Method, a graph is created out of the objects given by nodeSets. 
*Using centrality different metrics are calculated on graph object g.
*@param: nodeSets {array} - containing multiple objects, each representing two nodes with a connection.
*@return: 
*/
function computeCentralityAlgorithms(nodeSets) {
    nodeSets.forEach(element => {
        let subject = removeUri(element.s.value);
        let object = removeUri(element.o.value);
        g.addLink(subject, object);
    })
    var degreeCentrality = centrality.degree(g);
    var inDegreeCentrality = centrality.degree(g, "in");
    var outDegreeCentrality = centrality.degree(g, 'out')
    var betweenessCentrality = centrality.betweenness(g, true);

    dbm.insertCentrality(degreeCentrality, "nodeDegree");
    dbm.insertCentrality(inDegreeCentrality, "inDegree");
    dbm.insertCentrality(outDegreeCentrality, "outDegree");
    dbm.insertCentrality(betweenessCentrality, "betweenessCentrality");
}
/******************************************************************************************************/
/*
*description: replaces the whole IRI except the fragment and replaces it with a placeholder.
*@param: string {string} - a string representing an IRI.
*@return: string {string} - the transformed IRI.
*/
function removeUri(string) {
    let newString = "";
    if (string.includes("http://example.org/dgc#")) {
        newString = string.replace("http://example.org/dgc#", "uri-")
    }
    return newString
}
/******************************************************************************************************/
getAllNodesFromDB()
