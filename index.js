const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

const vect_foldere = ['temp', 'backup','temp1'];
// const baseDir = __dirname;

for(let folder of vect_foldere){
    let caleFolder=path.join(__dirname, folder)
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }
}

const obGlobal = {
    obErori: null
};

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    obGlobal.obErori = JSON.parse(continut);

    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine);
    for (let eroare of obGlobal.obErori.info_erori) {
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
    }
}

initErori();

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find(function (elem) {
        return elem.identificator == identificator;
    });

    let titluCustom, textCustom, imagineCustom;

    if (eroare) {
        if (eroare.status)
            res.status(identificator);
        titluCustom = titlu || eroare.titlu;
        textCustom = text || eroare.text;
        imagineCustom = imagine || eroare.imagine;
    } else {
        let err = obGlobal.obErori.eroare_default;
        titluCustom = titlu || err.titlu;
        textCustom = text || err.text;
        imagineCustom = imagine || err.imagine;
    }

    res.render("pagini/eroare", {
        titlu: titluCustom,
        text: textCustom,
        imagine: imagineCustom
    });
}

app.use('/resurse', function(req, res, next) {
    let cale = path.join(__dirname, req.path);

    fs.stat(cale, (err, stats) => {
        if (!err && stats.isDirectory()) {
            afisareEroare(res, 403);  
        } else {
            next();
        }
    });
});

app.use((req, res, next) => {
    if (req.path.endsWith('.ejs')) {
        afisareEroare(res, 400); 
    } else{
        next();
    }
});

app.use('/resurse', express.static(path.join(__dirname, 'resurse')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'resurse/ico/favicon.ico')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', { ip_utilizator: req.ip });
});


app.get('/barman', (req, res) => {
    res.render('pagini/barman');
});


app.use((req, res, next) => {
    let caleView = "pagini" + req.path;

    if (caleView.endsWith('/'))
        caleView = caleView.slice(0, -1);

    res.render(caleView, res.locals, function (err, rezultatRandare) {  // <<< aici adaugam res.locals
        if (err) {
            if (err.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res);
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});


const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Serverul rulează: http://localhost:${PORT}`);
});
