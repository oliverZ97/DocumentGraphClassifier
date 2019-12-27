let classifier = require("./classifier");
let importer = require("./dataImport");
let calc = require("./centrality-algorithms");

function controller(option) {
    console.log(option);
    switch (option) {
        case "import":
            console.log("YOU CHOOSE THE IMPORT OPTION!")
            importer.parseJSONFile;
            break;
        case "calculate":
            console.log("YOU CHOOSE THE CALCULATE OPTION!")
            calc.getAllNodesFromDB;
            break;
        case "classifier":
            let ready = false;
            console.log("YOU CHOOSE THE CLASSIFIER OPTION!")
            classifier.getEntitiesOfArticleWithEntity;
            console.log(p)
            if(ready){
                break;
            }
            break;
        default:
            console.log("YOU CHOOSE THE DEFAULT OPTION!")
            let d = classifier.getEntitiesOfArticleWithEntity;
            console.log(d)
            break;
    }
}

//https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/
controller(process.argv[2])