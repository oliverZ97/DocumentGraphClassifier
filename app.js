var rdm_art = 1;
var dataImport = require("./dataImport");

function getRandomArticle() {
    rdm_art = Math.round(Math.random() * 1000, 0)
    document.getElementById("art_id").innerHTML = "Article #" + rdm_art;
}

function startClassifier() {
    let http = new XMLHttpRequest();
    let url = "http://localhost:3300/dgc/art?id=" + rdm_art
    http.open("GET", url);
    console.log(url);
    http.send();

    http.onreadystatechange = (e) => {
        if (http.readyState === 4) {
            console.log("Blub");
        }
    }
}

function getDocumentsFromInput(filelist) {
    const files = filelist
    console.log(files)
    for (let i = 0; i < files.length; i++) {
        console.log("File: ", files.item(i));
        //let jsonobj = dataImport.data.parseJSONFile(files.item(i));
        //console.log(jsonobj);
    }
}