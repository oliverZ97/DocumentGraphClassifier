const cosine = require("calculate-cosine-similarity");
const fs = require("fs");
var dbManager = require('./dbManager');
let dbm = new dbManager();

let centralities = [];
let allArt = [];
let successfulIds = [];
/******************************************************************************************************/
/*
*description: this function is the entrypoint of the classifier.js script. It reads a json file and parses
*the content to a json object to work with. A loop iterates all articles in the json object. All entities 
*which are of type person or location get collected in an array. All elements of this array get iterated 
*to calculate necessary values. If all entities are iterated, the final category gets calculated. In the end 
*the most likely category and other informations about the article are written down in a file. 
*@param:
*@return:
*/
module.exports = getEntitiesOfArticleWithEntity = function () {
    let resultData = [];
    let entityWOArts = []
    let testSet = JSON.parse(fs.readFileSync("../results/testset.json"));
    console.log(testSet.length);
    testSet.forEach((art) => {
        allArt.push(art);
        let sim_results = [];
        let dataSet = [];
        let help = art.linguistics.geos.concat(art.linguistics.persons);
        help.forEach((elem) => {
            dataSet.push(elem.lemma);
        })
        console.log("DATASET LENGTH AT %s: %s", art.externalId, dataSet.length)
        for (let index = 0; index < dataSet.length; index++) {
            let entity = dataSet[index].replace(/ /g, "_").replace(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g, "-");
            let articles = dbm.getEntitiesOfArticleWithEntity(entity);
            if (articles === undefined) {
                continue;
            } else {
                articles.then((result) => {
                    console.log("RESULT of Entity %s: %s", entity, result.results.bindings.length)
                    if (result.results === undefined || result.results.bindings.length === 0) {
                        console.log("NUMBER OF ARTICLES WITH ENTITY " + entity + ": " + result.results.bindings.length);
                        entityWOArts.push(entity);
                    } else {
                        let statements = result.results.bindings;
                        let resultOfRound = classifierController(statements, entity, dataSet, art);
                        sim_results.push(resultOfRound);
                        if (sim_results.length === dataSet.length) {
                            result = computeFinalAvgSim(sim_results);
                            let correct = false;
                            if (result.category === art.category && result.value !== 0) {
                                correct = true;
                            }
                            let resultString = art.externalId + "," + art.category + "," + result.category + "," + result.value + "," + correct;
                            if (result.category !== undefined && result.value !== undefined) {
                                successfulIds.push(art.externalId);
                                resultData.push(resultString);
                                writeLogData(resultData, entityWOArts);
                            }
                        }
                    }

                })
            }
        }

    })
}
/******************************************************************************************************/
/*
*description: this function handles the writing of relevant information to files. 
*@param: resultData {array} - each element represents a csv string with id, real category, 
*        calculated category, calculated value and indicator if classification of an article was correct.
*@param: entityWOArts {array} - contains all entities which aren't mentioned in any article in the database.
*@return:
*/
function writeLogData(resultData, entityWOArts) {
    writeResultDataToCSV(resultData);
    writeFailedIdsToTxt();
    writeEntitiesWOArtsToTxt(entityWOArts);
}
/******************************************************************************************************/
/*
*description: sets the values of inDegree and betweeness Centrality of the actual entity and handles the 
*creation of an array containing the ids of all articles which containing the actual entity. Create article 
*objects from the statements is the next step.
*@param: statements {array} - contains an object for each triple that is returned by the database.
*@param: entity {string} - a representation of the entity in the actual iteration.
*@param: dataSet {array} - an array of type string containing all entities mentioned in the article 
*        to classify.
*@param: art {object} - the actual article which gets classified at the moment.
*@return: resultOfRound {object} - an object containing the entity and the values of the average cosine similarities.
*/
function classifierController(statements, entity, dataSet, art) {
    let inDegree = statements[0].inDegree.value;
    let betweeness = statements[0].betweeness.value;
    let allarticles = []
    let help = [];
    createCentralityObject(entity, inDegree, betweeness)
    statements.forEach((elem) => {
        help.push(elem.s.value);
    })
    let ids = [...new Set(help)]
    let articles = createArrayWithArticleObjects(ids, statements);
    allarticles = articles
    let resultOfRound = splitArticlesToCategory(allarticles, entity, dataSet, art) //split all articles to arrays with same category
    return resultOfRound;
}
/******************************************************************************************************/
/*
*description: this function sorts all statements by their ids and creates an array with properties
*for each id.
*@param: ids {array} - contains the id of each article which mentions the entity of the actual iteration.
*@param: statements {array} - contains an object for each triple that is returned by the database.
*@return: articles {array} - contains an object with data about each id in ids.
*/
function createArrayWithArticleObjects(ids, statements) {
    articles = []
    ids.forEach((id) => {
        let properties = [];
        statements.forEach((elem) => {
            let cleanS = replaceIriPrefix(elem);
            if (id.match(cleanS)) {
                properties.push(elem);
            }
        })
        let article = createArticleObject(properties);
        articles.push(article);
    })
    return articles;
}
/******************************************************************************************************/
/*
*description: creates an object and fills it with the relevant information of the properties given by the parameter.
*@param: properties {array} - contains objects, each representing one triple. All triples mentions the same IRI. 
*@return: article {object} - an object representing an article filled with id, category and all entities.
*/
function createArticleObject(properties) {
    let article = {}
    let entities = []
    let art_id = "";
    let cat = "";
    properties.forEach((prop) => {
        if (prop.p.value.match(/mentions/)) {
            let cleanO = prop.o.value.split("#")[1];
            entities.push(cleanO);
        }
        if (prop.p.value.match(/hasId/)) {
            art_id = prop.o.value;
        }
        if (prop.p.value.match(/hasRealCategory/)) {
            cat = prop.o.value;
        }
    })
    article.id = art_id;
    article.category = cat;
    article.entities = entities;
    return article;
}
/******************************************************************************************************/
/*
*description: removes the IRI prefix of the given element.
*@param: elem {object} - a object representing a triple.
*@return: {string} - the IRI of the triple's subject but everything except the IRI fragment is removed before.
*/
function replaceIriPrefix(elem) {
    return elem.s.value.replace("http://example.org/dgc#", "");
}
/******************************************************************************************************/
/*
*description: creates an object containing the entity and their inDegree and Betweeness Centrality 
*             and add it to an array.
*@param: entity {string} - a representation of the entity in the actual iteration.
*@param: inDegree {string} - the number of incoming edges of the entities IRI in the database.
*@param: betweeness {string} - a calculated value of how important the entities IRI is in the database
*@return: 
*/
function createCentralityObject(entity, inDegree, betweeness) {
    let centrality = {
        value: entity,
        inDegree: inDegree,
        betweeness: betweeness
    };
    centralities.push(centrality);
}
/******************************************************************************************************/
/*
*description: calculates the most likely category of the actual article. It is calculated by compute 
*the average cosine similarity between all entities of the actual article and each category. 
*The highest value of these is chosen and written to an object.
*@param: sim_results {array} - every element containing the average cosine similarities of an entity 
*        for each possible category and the inDegree and betweeness Centrality of this entity.
*@return: category {object} - contains the calculated category if sim_results is not empty. 
*         Otherwise an object with message "Not Available" is returned.
*/
function computeFinalAvgSim(sim_results) {
    let index = 0;
    let sum_p = 0;
    let sum_e = 0;
    let sum_c = 0;
    let sum_s = 0;
    let sum_inDegree = 0;
    let sum_bc = 0
    let avg_sim_p = 0;
    let avg_sim_e = 0;
    let avg_sim_c = 0;
    let avg_sim_s = 0;
    sim_results.forEach((set) => {
        if (set.number !== "empty") {
            sum_p += set.politic;
            sum_e += set.economy;
            sum_c += set.culture;
            sum_s += set.sport;
            sum_inDegree += parseFloat(set.inDegree);
            sum_bc += parseFloat(set.betweeness);
            index++;
            console.log("SUM_P: %s SUM_E: %s SUM_C: %s SUM_S: %s INDEGREE: %s BC: %s at %s", sum_p, sum_e, sum_c, sum_s, sum_inDegree, sum_bc, set.value)
            //consider only average cosine similarity
            avg_sim_p = sum_p / index;
            avg_sim_e = sum_e / index;
            avg_sim_c = sum_c / index;
            avg_sim_s = sum_s / index;

            //consider average cosine similarity, average inDegree and average betweeness Centrality
            // let avg_sim_p = (sum_p / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;
            // let avg_sim_e = (sum_e / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;
            // let avg_sim_c = (sum_c / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;
            // let avg_sim_s = (sum_s / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;

            //consider average cosine similarity and average inDegree
            // let avg_sim_p = (sum_p / index) * 0.5 + (sum_inDegree / index) * 0.5;
            // let avg_sim_e = (sum_e / index) * 0.5 + (sum_inDegree / index) * 0.5;
            // let avg_sim_c = (sum_c / index) * 0.5 + (sum_inDegree / index) * 0.5;
            // let avg_sim_s = (sum_s / index) * 0.5 + (sum_inDegree / index) * 0.5;
        }
    })
    let final_sims = [
        {
            category: "Politik",
            value: avg_sim_p
        },
        {
            category: "Wirtschaft",
            value: avg_sim_e
        },
        {
            category: "Kultur",
            value: avg_sim_c
        },
        {
            category: "Sport",
            value: avg_sim_s
        }
    ]
    let max = (Math.max(final_sims[0].value, final_sims[1].value, final_sims[2].value, final_sims[3].value));
    let category = {};
    if (final_sims !== undefined) {
        for (let i = 0; i < final_sims.length; i++) {
            if (final_sims[i].value === max) {
                category.category = final_sims[i];
                break;
            }
        }
    } else {
        category = {
            category: "Not Available",
            value: 0
        }
    }
    return category;
}
/******************************************************************************************************/
/*
*description: seperates all articles in the iteration of the actual entity by their categories. In the 
*next step the average cosine similarity for each entity with one of the categories is calculated.
*@param: articles {array} - contains objects of all articles which mentions the entity of the actual iteration.
*@param: entity {string} - a representation of the entity in the actual iteration.
*@param: dataSet {array} - an array of type string containing all entities mentioned in the article 
*        to be classified.
*@param: art {object} - the actual article which gets classified at the moment.
*@return: result {object} - object containing all values of the average cosine similarities of an entity 
*         and the categeory or the value "empty" if no articles exist. 
*/
function splitArticlesToCategory(articles, entity, dataSet, art) {
    if (articles.length !== 0) {
        let politic = [];
        let economy = [];
        let culture = [];
        let sport = [];
        //console.log("Start Sorting Articles with Entity ", data)
        articles.forEach((art) => {
            switch (art.category) {
                case "Politik":
                    politic.push(art);
                    break;
                case "Wirtschaft":
                    economy.push(art);
                    break;
                case "Kultur":
                    culture.push(art);
                    break;
                case "Sport":
                    sport.push(art);
                    break;
            }
        })
        //console.log("Found P: " + politic.length + " E: " + economy.length + " C: " + culture.length + " S: " + sport.length + " at " + data);
        let sim_p = cosinePreparation(politic, dataSet, art);
        let sim_e = cosinePreparation(economy, dataSet, art);
        let sim_c = cosinePreparation(culture, dataSet, art);
        let sim_s = cosinePreparation(sport, dataSet, art);
        let inDegree = 0;
        let betweeness = 0;
        centralities.forEach((c) => {
            if (c.value === entity) {
                inDegree = c.inDegree;
                betweeness = c.betweeness
            }
        })
        let result = {
            value: entity,
            politic: sim_p,
            economy: sim_e,
            culture: sim_c,
            sport: sim_s,
            inDegree: inDegree,
            betweeness: betweeness
        }
        return result;
    }
    return {
        value: entity,
        result: "empty"
    };
}
/******************************************************************************************************/
//https://www.npmjs.com/package/calculate-cosine-similarity?activeTab=readme
/*
*description: calculates the cosine similarity between all entities of the article to classify
*             and the entities of a given articles object.
*@param: article {object} - one article object created from the triples returned from the database.
*@param: dataSet {array} - an array containing all entities of the article to classify.
*@param: art {object} - the whole article object to classify.
*@return: similarity {number} - the calculated cosine similarity.
*/
function computeCosineSimilarity(article, dataSet, art) {
    let similarity = cosine(dataSet, article.entities);
    if (Number.isNaN(similarity)) {
        similarity = 0;
        console.log("SIM is NaN at ", art.externalId)
    }
    return similarity;
}
/******************************************************************************************************/
/*
*description: calculates the average cosine similarity between all articles of a specific category which mentions the entity of the 
*             actual iteration and all entities of the article to classify.
*@param: array {array} - containing all articles of a specific category who mentions the entity of the actual iteration.
*@param: dataSet {array} - an array containing all entities of the article to classify.
*@param: art {object} - the actual article which gets classified at the moment.
*@return: averageCosineSimilarity {number} - the calculated average cosine similarity between a 
*         category and the entities of dataSet.
*/
function cosinePreparation(array, dataSet, art) {
    let sum = 0;
    let index = 0;
    let averageCosineSimilarity = 0;
    array.forEach((art) => {
        let similarity = computeCosineSimilarity(art, dataSet); //the Method gets the actual Article and an Array with all Entities from the Article to classify
        sum += similarity
        index++;
    })

    averageCosineSimilarity = sum / index;
    if (Number.isNaN(averageCosineSimilarity) || averageCosineSimilarity === undefined) {
        console.log("NaN or undefined at ", art.externalId)
    }

    if (index === 0 && sum === 0) {
        averageCosineSimilarity = 0;
    }
    console.log("ACS: %s", averageCosineSimilarity)
    return averageCosineSimilarity;
}
/******************************************************************************************************/
/*
*description: creates a .csv file containing id, real category, calculated category, calculated value 
*             and a indicator if the classification was successful of each article where the calculation was without any errors. 
*@param: resultData {array} - every element containing a string with the above mentioned informations seperated by a comma.
*@return: 
*/
function writeResultDataToCSV(resultData) {
    let csv = "";
    resultData.forEach((elem) => {
        csv += elem + "\n"
    })
    fs.writeFileSync("../results/dgc_resultData.csv", csv);
}
/******************************************************************************************************/
/*
*description: creates a .txt file containing the id and category of every article whose classification was unsuccessful.
*@param: 
*@return: 
*/
function writeFailedIdsToTxt() {
    let failedIds = [];
    allArt.forEach((art) => {
        let isSuccessful = false;
        successfulIds.forEach((sid) => {
            if (art.externalId === sid) {
                isSuccessful = true;
            }
        })
        if (!isSuccessful) {
            let idString = art.externalId + ", " + art.category + "\n";
            failedIds.push(idString);
        }
    })
    fs.writeFileSync("../results/failedIds.txt", failedIds);
}
/******************************************************************************************************/
/*
*description: creates or updates a .txt file which contains the names of all entities that aren't mentioned 
*             in any article of the database.
*@param: array {array} - contains all names of entities not mentioned in any article of the database.
*@return: 
*/
function writeEntitiesWOArtsToTxt(array) {
    let path = "../results/entity_wo.txt";
    if (fs.existsSync(path)) {
        let file = fs.readFileSync(path, 'utf8');
        let entities = file.split("\n");
        let cnt = [...new Set(array)];
        for (let i = 0; i < cnt.length; i++) {
            if (!entities.includes(cnt[i])) {
                let string = cnt[i] + "\n";
                file += string;
            }
        }
        fs.writeFileSync(path, file);
        console.log("write entity_wo.txt successfully!");
        entityWOArts = [];
    } else {
        let content = "";
        let cnt = [...new Set(array)]
        for (let i = 0; i < cnt.length; i++) {
            let string = cnt[i] + "\n";
            content += string;
        }
        fs.writeFileSync(path, content);
        console.log("write entity_wo.txt successfully!")
        entityWOArts = [];
    }
}
/******************************************************************************************************/
getEntitiesOfArticleWithEntity();
