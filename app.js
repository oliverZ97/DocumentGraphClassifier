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
    if (checkbox.checked == true) {
        check = true;
    }
    return check;
}

function startClassifier() {
    let isNaiveBayes = checkState();
    document.getElementById("checkbox")
    if (isNaiveBayes) {

    } else {
        getEntitiesOfArticle()
    }
}

function getEntitiesOfArticle() {
    let article_iri = document.getElementById("art_id").innerHTML.replace("http://example.org/dgc#", "");
    if (article_iri === "") {
        document.getElementById("art_id").innerHTML = "Please select an Article first!"
    } else {
        let http = new XMLHttpRequest();
        let url = "http://localhost:3300/dgc?art=" + article_iri;
        http.responseType = 'json'
        http.open("GET", url);
        http.send();

        http.onreadystatechange = (e) => {
            if (http.readyState === 4) {
                let res = http.response;
                console.log(res);
                let tbody = document.getElementById("tbody");
                while(tbody.rows.length > 0){
                    tbody.deleteRow(0);
                }
                for(let i = 0; i < res.length; i++){
                    
                    let row = document.createElement("tr");
                    let td_p = document.createElement("td");
                    let td_o = document.createElement("td");

                    let text_p = document.createTextNode(res[i].p.value);
                    let text_o = document.createTextNode(res[i].o.value)

                    td_p.appendChild(text_p);
                    td_o.appendChild(text_o);
                    row.appendChild(td_p);
                    row.appendChild(td_o);
                    tbody.appendChild(row);
                }
            }
        }
    }
}

function getDocumentsFromInput(filelist) {
    const files = filelist
    console.log(files)
    for (let i = 0; i < files.length; i++) {
        console.log("File: ", files.item(i));
    }
}