/*******************************************************************************************************/
/*******************************************************************************************************/
/*
*author: Oliver Ziemann
*description: this script calculates some general statistics about the article objects such as average 
*             number of words.
*/
/*******************************************************************************************************/
/*******************************************************************************************************/
var fs = require('fs');
var documents = [];
/******************************************************************************************************/
/*
*description: extract the value of the property documents of the given jsonobj and returns it.
*@param: jsonobj {object} - an object containing an amount of documents which is needed but also more 
*                           data which is not relevant for any other step of the whole classifier.
*@return: docs {array} - an array containing all article objects needed in the next steps.
*/
function extractDocuments(jsonobj) {
    let docs = jsonobj.documents;
    return docs;
}
/******************************************************************************************************/
/*
*description: reads in all files which are in the folder ../data and parses their content to a json object. 
*In the next step the value of the property "documents" is extracted. "documents" is an array containing 
*all article objects. Every single article object of each file gets pushed in the global documents array together.
*@param: 
*@return: 
*/
function readFromDirData(){
    let filedir = fs.readdirSync("../data");
    filedir.forEach((file) => {
        let filestring = fs.readFileSync("../data/" + file);
        let fileobj = JSON.parse(filestring);
        let docs = extractDocuments(fileobj);
        docs.forEach((elem) => {
            documents.push(elem);
        })
    })
    console.log(documents.length)
    calcStats();
}
/******************************************************************************************************/
/*
*description: calculates the average number of words and of entities and writes them to a txt file.
*@param: 
*@return: 
*/
function calcStats() {
    let sumOfWords = 0;
    let sumOfPersons = 0;
    let sumOfLocations = 0;
    let counter = 0
    documents.forEach((doc) => {
        let words = countWords(doc.content);
        sumOfWords += words;
        counter ++;
        let numberOfEntities = countEntities(doc.linguistics);
        sumOfPersons += numberOfEntities[0];
        sumOfLocations += numberOfEntities[1];
    })
    console.log("Average Number of Words: ",sumOfWords/counter);
    console.log("Average Number of Entities: ", (sumOfPersons + sumOfLocations) /counter);
    console.log("Average Number of Entities(Persons): ", sumOfPersons/counter);
    console.log("Average Number of Entities(Locations): ", sumOfLocations/counter);
    let string = "Number of Articles: " + documents.length + "\n" +
    "Average Number of Words: " + sumOfWords/counter + "\n" +
    "Average Number of Entities: " + (sumOfPersons + sumOfLocations) /counter + "\n" +
    "Average Number of Entities(Persons): " + sumOfPersons/counter + "\n" +
    "Average Number of Entities(Locations): " + sumOfLocations/counter
    
    fs.writeFileSync("../results/stats.txt", string);
}
/******************************************************************************************************/
/*
*description: counts all words in a string
*@param: doc {string} - the actual text of an article
*@return: {number} - number of words or null if undefined
*/
function countWords(doc) {
    if(doc !== undefined){
        return doc.split(" ").length;
    } else {
        return 0;
    }
}
/******************************************************************************************************/
/*
*description: counts all entities of type person and location
*@param: doc {object} - contains all enities of an article
*@return: {array}  an array countaining the numbers of entities
*/
function countEntities(doc) {
    let persons = doc.persons.length;
    let locations = doc.geos.length
    return [persons, locations];
}
/******************************************************************************************************/
readFromDirData()