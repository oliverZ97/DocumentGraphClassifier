//const fetch = require("whatwg-fetch");
let bayes = require("./naive-bayes");


var rdm_art = 1;
//var dataImport = require("./dataImport");

function getRandomArticle() {
    rdm_art = Math.round(Math.random() * 100, 0)
    let http = new XMLHttpRequest();
    let url = "http://localhost:3300/dgc?nr=" + rdm_art;
    http.responseType = 'json'
    http.open("GET", url);
    http.send();

    http.onreadystatechange = (e) => {
        if (http.readyState === 4) {
            let res = http.response.id;
            document.getElementById("art_id").innerHTML = res;
        }
    }
}

function checkState() {
    let check = false;
    if(checkbox.checked == true){
        check = true;
    }
    return check;
}

function startClassifier() {
    let isNaiveBayes = checkState();
    document.getElementById("checkbox")
    if(isNaiveBayes) {

    } else {

    }
    // let http = new XMLHttpRequest();
    // let url = "http://localhost:3300/dgc/art?id=" + rdm_art
    // http.open("GET", url);
    // console.log(url);
    // http.send();

    // http.onreadystatechange = (e) => {
    //     if (http.readyState === 4) {
    //         console.log("Blub");
    //     }
    // }
}

function getDocumentsFromInput(filelist) {
    const files = filelist
    console.log(files)
    for (let i = 0; i < files.length; i++) {
        console.log("File: ", files.item(i));
    }
}