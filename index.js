const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const sass = require('sass');

const vect_foldere = ['temp', 'backup','temp1'];
// const baseDir = __dirname;

for(let folder of vect_foldere){
    let caleFolder=path.join(__dirname, folder)
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder);
    }
}

const obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup")
};

function compileazaScss(caleScss, caleCss){
    if(!caleCss){
        let numeFisExt=path.basename(caleScss);
        let numeFis=numeFisExt.split(".")[0] 
        caleCss=numeFis+".css";
    }    
    if (!path.isAbsolute(caleScss))
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )

    let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }

    let rez = sass.compile(caleScss, { sourceMap: true });
    let cssNou = rez.css.toString();
    let cssVechi = "";
    let existaCssVechi = fs.existsSync(caleCss);
    if (existaCssVechi) {
        cssVechi = fs.readFileSync(caleCss).toString();
    }

    if (cssVechi !== cssNou) {
        if (existaCssVechi) {
            let numeFisCss = path.basename(caleCss, ".css");
            let timestamp = Date.now();
            let numeFisCssBackup = n    
            fs.copyFileSync(caleCss, path.join(caleBackup, numeFisCssBackup));
        }
        fs.writeFileSync(caleCss, cssNou);
    } else {
        console.log("Nicio modificare pentru: " + caleCss);
    }
}

vFisiere=fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ){
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
    console.log(eveniment, numeFis);
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    obGlobal.obErori = JSON.parse(continut);

    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine);
    for (let eroare of obGlobal.obErori.info_erori) {
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
    }
}

initErori();

function initImagini(){
    var continut = fs.readFileSync(path.join(__dirname, "resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;

    let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(__dirname, obGlobal.obImagini.cale_galerie, "mediu");
    let caleAbsMic = path.join(__dirname, obGlobal.obImagini.cale_galerie, "mic");  // adaugă folder mic

    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    if (!fs.existsSync(caleAbsMic))
        fs.mkdirSync(caleAbsMic);

    for (let imag of vImagini) {
        let [numeFis, ext] = imag.fisier.split(".");
        let caleFisAbs = path.join(caleAbs, imag.fisier);

        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        let caleFisMicAbs = path.join(caleAbsMic, numeFis + ".webp");

        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs, function(err, info){
            if (err) console.log("Eroare creare mediu:", err);
        });

        sharp(caleFisAbs).resize(150).toFile(caleFisMicAbs, function(err, info){
            if (err) console.log("Eroare creare mic:", err);
        });

        imag.fisier_mediu = path.join("/", obGlobal.obImagini.cale_galerie, "mediu", numeFis + ".webp");
        imag.fisier_mic = path.join("/", obGlobal.obImagini.cale_galerie, "mic", numeFis + ".webp");
        imag.fisier = path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier);
    }

    console.log(obGlobal.obImagini);
}
initImagini();

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

app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function (req, res) {
    afisareEroare(res, 403);
});

app.get("/*.ejs", function (req, res) {
    afisareEroare(res, 400);
});

app.use('/resurse', express.static(path.join(__dirname, 'resurse')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'resurse/ico/favicon.ico')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index', { ip_utilizator: req.ip, imagini: obGlobal.obImagini.imagini });
});

app.get('/barman', (req, res) => {
    res.render('pagini/barman');
});

app.get('/galerie', (req, res) => {
    res.render('pagini/galerie', { imagini: obGlobal.obImagini.imagini });
});

app.use("/*", function (req, res) {
    try {
        res.render("pagini" + req.originalUrl, function (err, rezultatRandare) {
            if (err) {
                console.log(err);
                if (err.message.startsWith("Failed to lookup view")) {
                    afisareEroare(res, 404);
                } else {
                    afisareEroare(res);
                }
            } else {
                res.send(rezultatRandare);
            }
        });
    } catch (errRandare) {
        if (errRandare.message.startsWith("Cannot find module")) {
            afisareEroare(res, 404);
        } else {
            afisareEroare(res);
        }
    }
});


const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Serverul rulează: http://localhost:${PORT}`);
});
