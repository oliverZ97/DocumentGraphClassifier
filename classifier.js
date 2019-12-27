const cosine = require("calculate-cosine-similarity");
const fs = require("fs");
var dbManager = require('./dbManager');
let dbm = new dbManager();

let centralities = [];
let allArt = [];
let successfulIds = [];

module.exports = getEntitiesOfArticleWithEntity = function () {
    let resultData = [];
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
            console.log("GET ARTICLES FOR ENTITY: ", entity)
            let articles = dbm.getEntitiesOfArticleWithEntity(entity);
            if (articles === undefined) {
                continue;
            } else {
                articles.then((result) => {
                    console.log("RESULT of Entity %s: %s",entity ,result.results.bindings.length)
                    if (result.results === undefined || result.results.bindings.length === 0) {
                        console.log("NUMBER OF ARTICLES WITH ENTITY " + entity + ": " + result.results.bindings.length);
                    } else {
                        let statements = result.results.bindings;
                        let resultOfRound = classifierController(statements, entity, dataSet, art);
                        sim_results.push(resultOfRound);
                        //console.log(resultOfRound);
                        if (sim_results.length === dataSet.length) {
                            result = computeFinalAvgSim(sim_results);
                            let correct = false;
                            if (result.category === art.category) {
                                correct = true;
                            }
                            let resultString = art.externalId + "," + art.category + "," + result.category + "," + result.value + "," + correct;
                            if (result.category !== undefined && result.value !== undefined) {
                                //console.log(resultString);
                                successfulIds.push(art.externalId);
                                resultData.push(resultString);
                                writeResultDataToCSV(resultData);
                                writeFailedIdsToTxt();
                            }
                        }
                    }

                })
            }
        }

    })
}

function classifierController(statements, entity, dataSet, art) {
    let inDegree = statements[0].inDegree.value;
    let betweeness = statements[0].betweeness.value;
    let allarticles = []
    let help = [];
    createCentralityObject(entity, inDegree, betweeness)
    //console.log(statements.length);
    statements.forEach((elem) => {
        //let cleanS = elem.s.value.replace("http://example.org/dgc#", "");
        help.push(elem.s.value);
    })
    let ids = [...new Set(help)]
    let articles = createArrayWithArticleObjects(ids, statements);
    allarticles = articles
    //console.log(allarticles.length);
    //console.log("Entität: ", dataSet[index]);
    //console.log(allarticles.length); //contains Objects of all Articles, which contains the actual Entity "dataSet[index]"
    let resultOfRound = splitArticlesToCategory(allarticles, entity, dataSet, art) //split all articles to arrays with same category
    return resultOfRound;
}

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

function replaceIriPrefix(elem) {
    return elem.s.value.replace("http://example.org/dgc#", "");
}

function createCentralityObject(entity, inDegree, betweeness) {
    let centrality = {
        value: entity,
        inDegree: inDegree,
        betweeness: betweeness
    };
    centralities.push(centrality);
}

function computeFinalAvgSim(sim_results) {
    let index = 0;
    let sum_p = 0;
    let sum_e = 0;
    let sum_c = 0;
    let sum_s = 0;
    let sum_inDegree = 0;
    let sum_bc = 0
    sim_results.forEach((set) => {
        //console.log("SET ",set);
        if (set.number !== "empty") {
            // sum_p += (set.politic * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            // sum_e += (set.economy * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            // sum_c += (set.culture * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            // sum_s += (set.sport * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            // sum_p += set.politic;
            // sum_e += set.economy;
            // sum_c += set.culture;
            // sum_s += set.sport;
            sum_p += set.politic;
            sum_e += set.economy;
            sum_c += set.culture;
            sum_s += set.sport;
            sum_inDegree += parseFloat(set.inDegree);
            sum_bc += parseFloat(set.betweeness);
            index++;
            //console.log("SUM_P: %s SUM_E: %s SUM_C: %s SUM_S: %s INDEGREE: %s BC: %s at %s", sum_p, sum_e, sum_c, sum_s, sum_inDegree, sum_bc, set.value)
        } else {
            //console.log("empty set at ", set.value)
        }
    })
    // let avg_sim_p = sum_p / index;
    // let avg_sim_e = sum_e / index;
    // let avg_sim_c = sum_c / index;
    // let avg_sim_s = sum_s / index;
    let avg_sim_p = (sum_p / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;
    let avg_sim_e = (sum_e / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;
    let avg_sim_c = (sum_c / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;
    let avg_sim_s = (sum_s / index) * 0.4 + (sum_inDegree / index) * 0.3 + (sum_bc / index) * 0.3;

    //console.log("sim p " + avg_sim_p + " sim e " + avg_sim_e + " sim c " + avg_sim_c + " sim s " + avg_sim_s);
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
    let category = "";
    if (final_sims !== undefined) {
        for (let i = 0; i < final_sims.length; i++) {
            if (final_sims[i].value === max) {
                category = final_sims[i];
                break;
            }
        }
    } else {
        category = {
            category: "Not Available",
            value: 0
        }
    }
    // console.log("COMPUTED AVERAGE SIMILARITIES:")
    // console.log("P: " + avg_sim_p + " E: " + avg_sim_e + " C: " + avg_sim_c + " S: " + avg_sim_s);
    return category;
}

function splitArticlesToCategory(articles, data, dataSet, art) {
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
        let sim_p = cosinePreparation(politic, dataSet, art); //avg similarity of category politics with dataSet
        let sim_e = cosinePreparation(economy, dataSet, art);
        let sim_c = cosinePreparation(culture, dataSet, art);
        let sim_s = cosinePreparation(sport, dataSet, art);
        let inDegree = 0;
        let betweeness = 0;
        centralities.forEach((c) => {
            if (c.value === data) {
                inDegree = c.inDegree;
                betweeness = c.betweeness
                //console.log(c)
            }
        })
        let result = {
            value: data,
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
        value: data,
        result: "empty"
    };
}

function computeCosineSimilarity(article, dataSet, art) {
    //console.log("DATASET: ", dataSet);
    //console.log("ENTITES: ", article.entities);

    let similarity = cosine(dataSet, article.entities);
    //console.log(similarity);
    if (Number.isNaN(similarity)) {
        similarity = 0;
        console.log("SIM is NaN at ", art.externalId)
    }
    return similarity;
}

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
    if(Number.isNaN(averageCosineSimilarity) || averageCosineSimilarity === undefined){
        console.log("NaN or undefined at ", art.externalId)
    }

    if (index === 0 && sum === 0) {
        averageCosineSimilarity = 0;
    }
    console.log("ACS: %s",averageCosineSimilarity)
    return averageCosineSimilarity;
}

function writeResultDataToCSV(resultData) {
    let csv = "";
    resultData.forEach((elem) => {
        csv += elem + "\n"
    })
    fs.writeFileSync("../results/resultData.csv", csv);
    //console.log("Successfully write results in resultData.csv!")
}

function writeFailedIdsToTxt(){
    let failedIds = [];
    allArt.forEach((art) => {
        let isSuccessful = false;
        successfulIds.forEach((sid) => {
            if(art.externalId === sid){
                isSuccessful = true;
            }
        })
        if(!isSuccessful){
            let idString = art.externalId + ", " + art.category + ", " + art.linguistics.geos + ", " + art.linguistics.persons + "\n";
            failedIds.push(idString);
        }
    })
    fs.writeFileSync("../results/failedIds.txt", failedIds);
}

getEntitiesOfArticleWithEntity();
