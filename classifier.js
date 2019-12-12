const cosine = require("calculate-cosine-similarity");
var dbManager = require('./dbManager');
let dbm = new dbManager();

let data1 = ["Ulli_Hoeneß", "Greta_Thunberg"];
let sim_results = [];
let centralities = [];

module.exports = getEntitiesOfArticleWithEntity = function () {
    data1.forEach((data) => {
        let entity = data.replace(/ /g, "_");
        let articles = dbm.getEntitiesOfArticleWithEntity(entity);
        articles.then((result) => {
            let statements = result.results.bindings;
            let inDegree = 0;
            let betweeness = 0;
            if (statements.length === 0) {
                console.log("No Articles found with Entity " + data)
            } else {
                inDegree = statements[0].inDegree.value;
                betweeness = statements[0].betweeness.value;
            }
            let allarticles = []
            let help = [];
            let centrality = {
                value: data,
                inDegree: inDegree,
                betweeness: betweeness
            };
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
            console.log("Entität: ", data);
            let resultOfRound = splitArticlesToCategory(allarticles, data)
            sim_results.push(resultOfRound);
            if (sim_results.length === data1.length) {
                computeFinalAvgSim();
            }
        })
    })
}

function computeFinalAvgSim() {
    let index = 0;
    let sum_p = 0;
    let sum_e = 0;
    let sum_c = 0;
    let sum_s = 0;
    sim_results.forEach((set) => {
        //console.log(set);
        if (set.value !== "empty") {
            sum_p += (set.politic * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            sum_e += (set.economy * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            sum_c += (set.culture * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            sum_s += (set.sport * ((set.inDegree / 1000) + (set.betweeness / 1000))) * 10;
            index++;
        }
    })
    let avg_sim_p = sum_p / index;
    let avg_sim_e = sum_e / index;
    let avg_sim_c = sum_c / index;
    let avg_sim_s = sum_s / index;
    console.log("COMPUTED AVERAGE SIMILARITIES:")
    console.log("P: " + avg_sim_p + " E: " + avg_sim_e + " C: " + avg_sim_c + " S: " + avg_sim_s);
}

function splitArticlesToCategory(articles, data) {
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
        let sim_p = cosinePreparation(politic);
        let sim_e = cosinePreparation(economy);
        let sim_c = cosinePreparation(culture);
        let sim_s = cosinePreparation(sport);
        let inDegree = 0;
        let betweeness = 0;
        centralities.forEach((c) => {
            if (c.value === data) {
                inDegree = c.inDegree;
                betweeness = c.betweeness
            }
        })
        let result = {
            politic: sim_p,
            economy: sim_e,
            culture: sim_c,
            sport: sim_s,
            inDegree: inDegree,
            betweeness: betweeness
        }
        console.log("P: " + politic.length + " E: " + economy.length + " C: " + culture.length + " S: " + sport.length);
        console.log(result);
        return result;
    }
    return { value: "empty" };
}

function computeCosineSimilarity(article) {
    let similarity = cosine(data1, article.entities);
    if (similarity === NaN) {
        similarity = 0;
    }
    return similarity;
}

function cosinePreparation(array) {
    let sum = 0;
    let index = 0;
    let averageCosineSimilarity = 0;
    array.forEach((art) => {
        //let inDegree = art.inDegree;
        //console.log(inDegree);
        //let betweenessCentrality = art.betweenessCentrality;
        //console.log(betweenessCentrality);
        let similarity = computeCosineSimilarity(art);
        //let value = similarity * ((inDegree/1000) + (betweenessCentrality/1000))
        sum += similarity
        index++;
    })
    averageCosineSimilarity = sum / index;
    return averageCosineSimilarity;
}

getEntitiesOfArticleWithEntity();
