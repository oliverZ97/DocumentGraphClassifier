const cosine = require("calculate-cosine-similarity");
const fs = require("fs");
var dbManager = require('./dbManager');
let dbm = new dbManager();

let data1 = ["Boris_Becker", "Thomas_Müller", "Joachim_Löw", "Naomi_Osaka", "Angelique_Kerber"];
//let sim_results = [];
let centralities = [];
let bugs = [];
let counter = 0;

module.exports = getEntitiesOfArticleWithEntity = function () {
    let resultData = [];
    let promises = [];
    let testSet = JSON.parse(fs.readFileSync("./small_testset.json"));
    console.log(testSet.length);
    testSet.forEach((art) => {
        let sim_results = [];
        let dataSet = [];
        let result = "";
        let help = art.linguistics.geos.concat(art.linguistics.persons);
        help.forEach((elem) => {
            if (elem.lemma.match(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g)) {
                let lemma_space = elem.lemma.replace(/ /g, "_");
                let specialChars = ['\'', '\+', '\’', '\,', '\(', '\)', '\/', '\.', '\"']
                // while (elem.lemma.match(/[\'|\+|\’|\,|\(|\)|\/|\.|\"]/g)) {
                //     console.log("Before ", elem.lemma);
                //     for (let i = 0; i < specialChars.length; i++) {
                //        let char = specialChars[i];
                //        if(lemma_space.match("["+ char + "]")){
                //            let split = lemma_space.split(char);
                //            console.log("Split1 ",split[1])
                //            let newString = split[0] + "\\" + char + split[1];
                //            lemma_space = newString;
                //            console.log(lemma_space);
                //        } else {
                //            continue;
                //        }
                //        break;
                //     }
                //     break;
                // }
                bugs.push(lemma_space);
            } else {
                let lemma = elem.lemma.replace(/ /g, "_")
                dataSet.push(lemma);
            }
        })
        
        //dataSet.forEach((data) => {
        for (let index = 0; index < dataSet.length; index++) {
            let entity = dataSet[index];
            var p = dbm.getEntitiesOfArticleWithEntity(entity).then((result) => {
                    if (result.results === undefined) {
                        console.log("No Articles found with Entity " + entity)
                    } else {
                        let statements = result.results.bindings;
                        //console.log(statements);
                        let inDegree = 0;
                        let betweeness = 0;
                        if (statements.length === 0) {
                            console.log("No Articles found with Entity " + dataSet[index])
                        } else {
                            inDegree = statements[0].inDegree.value;
                            betweeness = statements[0].betweeness.value;
                        }
                        let allarticles = []
                        let help = [];
                        let centrality = {
                            value: dataSet[index],
                            inDegree: inDegree,
                            betweeness: betweeness
                        };
                        //console.log(centrality);
                        centralities.push(centrality);
                        statements.forEach((elem) => {
                            let cleanS = elem.s.value.replace("http://example.org/dgc#", "");
                            help.push(cleanS);
                        })
                        let ids = [...new Set(help)]
                        ids.forEach((id) => {
                            let properties = [];
                            statements.forEach((elem) => {
                                let cleanS = elem.s.value.replace("http://example.org/dgc#", "");
                                if (id.match(cleanS)) {
                                    properties.push(elem);
                                }
                            })
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
                            allarticles.push(article)
                        })
                        //console.log("Entität: ", dataSet[index]);
                        //console.log(allarticles.length); //contains Objects of all Articles, which contains the actual Entity "dataSet[index]"
                        let resultOfRound = splitArticlesToCategory(allarticles, dataSet[index], dataSet) //split all articles to arrays with same category
                        sim_results.push(resultOfRound);
                        if (sim_results.length === dataSet.length) {
                            result = computeFinalAvgSim(sim_results);
                            let correct = false;
                            if (result.category === art.category) {
                                correct = true;
                            }
                            let resultString = art.externalId + "," + art.category + "," + result.category + "," + result.value + "," + correct;
                            if (result.category !== undefined && result.value !== undefined) {
                                console.log(resultString);
                                resultData.push(resultString);
                            }

                            //counter++;
                        }

                    }
                    console.log('!!!SECOND!!!')
                    return resultString;
                })

            // adding the promise to the list of work
            promises.push(p);
        }

    })
    // wait for all promises to resolve, write then
    Promise.all(promises)
    .then(results => {
        console.log('!!!third!!!', results)
        writeResultDataToCSV(resultData)
    })
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
        console.log(set);
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
            console.log("SUM_P: %s SUM_E: %s SUM_C: %s SUM_S: %s INDEGREE: %s BC: %s", sum_p, sum_e, sum_c, sum_s, sum_inDegree, sum_bc)
        } else {
            console.log("empty set at ", set.value)
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

    console.log("sim p " + avg_sim_p + " sim e " + avg_sim_e + " sim c " + avg_sim_c + " sim s " + avg_sim_s);
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

function splitArticlesToCategory(articles, data, dataSet) {
    if (articles.length !== 0) {
        let politic = [];
        let economy = [];
        let culture = [];
        let sport = [];
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
        let sim_p = cosinePreparation(politic, dataSet); //avg similarity of category politics with dataSet
        let sim_e = cosinePreparation(economy, dataSet);
        let sim_c = cosinePreparation(culture, dataSet);
        let sim_s = cosinePreparation(sport, dataSet);
        let inDegree = 0;
        let betweeness = 0;
        centralities.forEach((c) => {
            if (c.value === data) {
                inDegree = c.inDegree;
                betweeness = c.betweeness
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
        //console.log("P: " + politic.length + " E: " + economy.length + " C: " + culture.length + " S: " + sport.length);
        return result;
    }
    return {
        value: data,
        result: "empty"
    };
}

function computeCosineSimilarity(article, dataSet) {
    //console.log("DATASET: ", dataSet);
    //console.log("ENTITES: ", article.entities);

    let similarity = cosine(dataSet, article.entities);
    //console.log(similarity);
    if (similarity === NaN) {
        similarity = 0;
    }
    return similarity;
}

function cosinePreparation(array, dataSet) {
    let sum = 0;
    let index = 0;
    let averageCosineSimilarity = 0;
    array.forEach((art) => {
        let similarity = computeCosineSimilarity(art, dataSet); //the Method gets the actual Article and an Array with all Entities from the Article to classify
        sum += similarity
        index++;
    })
    averageCosineSimilarity = sum / index;
    if (index === 0 && sum === 0) {
        averageCosineSimilarity = 0;
    }
    return averageCosineSimilarity;
}

function writeResultDataToCSV(resultData) {
    let csv = "";
    resultData.forEach((elem) => {
        csv += elem + "\n"
    })
    fs.writeFileSync("./resultData.csv", csv);
    console.log("Successfully write results in resultData.csv!")
}

getEntitiesOfArticleWithEntity();
