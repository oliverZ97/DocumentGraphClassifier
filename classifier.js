const cosine = require("calculate-cosine-similarity");
var dbManager = require('./dbManager');
let dbm = new dbManager();

let data1 = ["Berlin"];
let data2 = ["bye", "trump", "usa", "chellow"];
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
                help.push(elem.s.value);
            })
            let ids = [...new Set(help)]
            ids.forEach((id) => {
                let properties = [];
                statements.forEach((elem) => {
                    if(id.match(elem.s.value)){
                        properties.push(elem);
                    }
                })
                let article  = {}
                let entities = []
                let art_id = "";
                let cat = "";
                properties.forEach((prop) => {
                    if(prop.p.value.match(/mentions/)){
                        entities.push(prop.o.value);
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
            splitArticlesToCategory(allarticles)
        })  
    })
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
    console.log("Politik ",politic.length );
    console.log("Wirtschaft ", economy.length);
    console.log("Kultur ", culture.length);
    console.log("Sport ", sport.length);
}

getEntitiesOfArticleWithEntity();
    