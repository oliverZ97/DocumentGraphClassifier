const cosine = require("calculate-cosine-similarity");
var dbManager = require('./dbManager');
let dbm = new dbManager();

let data1 = ["Donald_Trump", "Angela_Merkel", "USA"];
let data2 = ["bye", "trump", "usa", "chellow"];
let sim_results = [];
//console.log(cosine(data1, data2));

function getEntitiesOfArticleWithEntity() {
    data1.forEach((elem) => {
        let entity = elem.replace(/ /g, "_");
        let articles = dbm.getEntitiesOfArticleWithEntity(entity);
        articles.then((result) => {
            let statements = result.results.bindings;
            let allarticles = []
            let help = [];
            statements.forEach((elem) => {
                let cleanS = elem.s.value.replace("http://example.org/dgc#", "");
                help.push(cleanS);
            })
            let ids = [...new Set(help)]
            ids.forEach((id) => {
                let properties = [];
                statements.forEach((elem) => {
                    let cleanS = elem.s.value.replace("http://example.org/dgc#", "");
                    if(id.match(cleanS)){
                        properties.push(elem);
                    }
                })
                let article  = {}
                let entities = []
                let art_id = "";
                let cat = "";
                properties.forEach((prop) => {
                    if(prop.p.value.match(/mentions/)){
                        let cleanO = prop.o.value.split("#")[1];
                        entities.push(cleanO);
                    }
                    if(prop.p.value.match(/hasId/)){
                        art_id = prop.o.value;
                    }
                    if(prop.p.value.match(/hasRealCategory/)){
                        cat = prop.o.value;
                    }
                })
                article.id = art_id;
                article.category = cat;
                article.entities = entities
                allarticles.push(article)
            })
            let resultOfRound = splitArticlesToCategory(allarticles)
            sim_results.push(resultOfRound);
            if(sim_results.length === data1.length) {
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
        sum_p += set.politic;
        sum_e += set.economy;
        sum_c += set.culture;
        sum_s += set.sport;
        index++;
    })
    let avg_sim_p = sum_p/index;
    let avg_sim_e = sum_e/index;
    let avg_sim_c = sum_c/index;
    let avg_sim_s = sum_s/index;
    console.log("P: " + avg_sim_p + " E: " + avg_sim_e + " C: " + avg_sim_c + " S: "+ avg_sim_s);
}

function splitArticlesToCategory(articles){
    let politic = [];
    let economy = [];
    let culture = [];
    let sport = [];
    articles.forEach((art) => {
        switch(art.category){
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
    let result = {
        politic: sim_p,
        economy: sim_e,
        culture: sim_c,
        sport: sim_s
    }
    return result;
}

function computeCosineSimilarity(article) {
    let similarity = cosine(data1, article.entities);
    if(similarity === NaN){
        similarity = 0;
    }
    return similarity;
}   

function cosinePreparation(array) {
    let sum = 0;
    let index = 0;
    let averageCosineSimilarity = 0;
    array.forEach((art) => {
        let similarity = computeCosineSimilarity(art);
        sum += similarity
        index ++;
    })
    averageCosineSimilarity = sum/index;
    return averageCosineSimilarity;
}

getEntitiesOfArticleWithEntity();
    