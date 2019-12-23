let classifier = require("./classifier");
let importer = require("./dataImport");
let calc = require("./centrality-algorithms");

function controller(option) {
    switch (option) {
        case "import":
            importer.parseJSONFile();
            break;
        case "calculate":
            calc.getAllNodesFromDB();
        case "classifier":
            classifier.getEntitiesOfArticleWithEntity();
            break;
        default:
            classifier.getEntitiesOfArticleWithEntity();
            break;
    }
}

//https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/
controller(process.argv[2])