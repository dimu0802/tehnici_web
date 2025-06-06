require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const sass = require('sass');
const pg = require('pg');

const Client=pg.Client;

client=new Client({
    database:"proiect",
    user:"dimu",
    password: process.env.DB_PASSWORD,
    host:"localhost",
    port:5432
})

client.connect()
client.query("select * from bauturi", function(err, rezultat ){
    console.log(err)    
    console.log("rezultat query: ", rezultat)
})
client.query("select * from unnest(enum_range(null::categorie_bautura))", function(err, rezultat ){
    console.log(err)    
    console.log(rezultat)
})

client.query("SELECT * FROM unnest(enum_range(NULL::aroma_bautura))", function(err, rezultat) {
    console.log(err);    
    console.log(rezultat);
});

client.query("SELECT * FROM unnest(enum_range(NULL::culoare_lichid))", function(err, rezultat) {
    console.log(err);    
    console.log(rezultat);
});


const vect_foldere = ['temp', 'backup'];
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

//afisare dirname, filename, process.cwd()-cerinta etapa 4
console.log("__dirname:", __dirname);
console.log("__filename:", __filename);
console.log("process.cwd():", process.cwd());

function compileazaScss(caleScss, caleCss){
    if(!caleCss){
        let numeFisExt=path.basename(caleScss);
        let numeFis=numeFisExt.split(".")[0] //elimina extensia .scss
        caleCss=numeFis+".css";
    }    
    //transforma din cai relative in absolute
    if (!path.isAbsolute(caleScss)) 
        caleScss=path.join(obGlobal.folderScss,caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss=path.join(obGlobal.folderCss,caleCss )

    let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup,{recursive:true})
    }

    let rez = sass.compile(caleScss, { sourceMap: true }); //compileaza fisierul .scss
    let cssNou = rez.css.toString(); //obtine codul css final
    let cssVechi = "";
    let existaCssVechi = fs.existsSync(caleCss);
    if (existaCssVechi) {
        cssVechi = fs.readFileSync(caleCss).toString();
    }

    if (cssVechi !== cssNou) {
        if (existaCssVechi) {
            let numeFisCss = path.basename(caleCss, ".css");
            let timestamp = Date.now();
            let numeFisCssBackup = numeFisCss + "_" + timestamp + ".css"; 
            fs.copyFileSync(caleCss, path.join(caleBackup, numeFisCssBackup));
        }
        fs.writeFileSync(caleCss, cssNou);
    } else {
        console.log("Nicio modificare pentru: " + caleCss);
    }
}

vFisiere=fs.readdirSync(obGlobal.folderScss); //citeste toate fisiere din scss
for( let numeFis of vFisiere ){  //parcurge toate fisierele din folder. daca extensia e .scss, o complieaza in css cu fct
    if (path.extname(numeFis)==".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis){ //porneste un watcher pe folderul scss
    console.log(eveniment, numeFis); //afiseaza ce s a intamplat
    if (eveniment=="change" || eveniment=="rename"){
        let caleCompleta=path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})

function initErori() { //functie care initializeaza erorile
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8"); //construieste calea completa catre erori.json, citeste fisierul json sincron
    obGlobal.obErori = JSON.parse(continut); //stocheaza in obglobal.oberori ceea ce json.parse() a transformat din string json in obiect js

    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine); //creeaza cai complete pt pozele de erori
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
        return elem.identificator == identificator; //cauta in vector info_erori o eroare care are identificatorul dat
    });

    let titluCustom, textCustom, imagineCustom;

    if (eroare) {
        if (eroare.status)
            res.status(identificator);
        titluCustom = titlu || eroare.titlu; //daca a primit titlu ca argument, il foloseste p ala, daca nu, foloseste titlu din json
        textCustom = text || eroare.text;
        imagineCustom = imagine || eroare.imagine;
    } else { //daca nu exista valori pt identificator pt eroare, se folosesc val din eroare_default
        let err = obGlobal.obErori.eroare_default;
        titluCustom = titlu || err.titlu;
        textCustom = text || err.text;
        imagineCustom = imagine || err.imagine;
    }

    res.render("pagini/eroare", { //randeaza eroare.ejs
        titlu: titluCustom,
        text: textCustom,
        imagine: imagineCustom
    });
}

//bonus 1 etapa 6-limite din baza de date
async function getStatisticiProduse() {
    try {
        // Query pentru statistici generale
        const queryStats = `
            SELECT 
                MIN(cantitate) as cantitate_min,
                MAX(cantitate) as cantitate_max
            FROM bauturi
        `;
        
        const rezultatStats = await client.query(queryStats);
        
        // Query pentru valorile distincte
        const queryDistincte = `
            SELECT DISTINCT 
                aroma,
                culoare,
                categorie,
                contine_zahar
            FROM bauturi
            ORDER BY aroma, culoare, categorie
        `;
        
        const rezultatDistincte = await client.query(queryDistincte);
        
        // Grupează valorile distincte
        const arome = [...new Set(rezultatDistincte.rows.map(r => r.aroma))].filter(Boolean);
        const culori = [...new Set(rezultatDistincte.rows.map(r => r.culoare))].filter(Boolean);
        const categorii = [...new Set(rezultatDistincte.rows.map(r => r.categorie))].filter(Boolean);
        
        // Query pentru utilizări - versiune corectată
        const queryUtilizari = `
            SELECT DISTINCT 
                unnest(string_to_array(
                    replace(replace(replace(utilizari::text, '{', ''), '}', ''), '"', ''), 
                    ','
                )) as utilizare
            FROM bauturi
            WHERE utilizari IS NOT NULL AND utilizari::text != '{}'
        `;
        
        const rezultatUtilizari = await client.query(queryUtilizari);
        const utilizari = rezultatUtilizari.rows
            .map(r => r.utilizare ? r.utilizare.trim() : '')
            .filter(u => u.length > 0)
            .sort();
        
        return {
            stats: rezultatStats.rows[0],
            optiuni: {
                arome: arome,
                culori: culori,
                categorii: categorii,
                utilizari: utilizari
            }
        };
    } catch (error) {
        console.error('Eroare la obținerea statisticilor:', error);
        return null;
    }
}

app.use('/resurse', express.static(path.join(__dirname, 'resurse'))); //toate folderele sunt accesibile din browser la adresa /resurse/
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'resurse/ico/favicon.ico')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.get(['/', '/index', '/home'], (req, res) => { //pentru acces la localhost:8080/index etc
    res.render('pagini/index', { ip_utilizator: req.ip, imagini: obGlobal.obImagini.imagini }); //req.ip-variabila oferita automat de express; iq_utilizator=req.ip -> trimite ip in index.ejs
});

app.get('/barman', (req, res) => {
    res.render('pagini/barman');
});

app.get('/galerie', (req, res) => { 
    res.render('pagini/galerie', { imagini: obGlobal.obImagini.imagini });
});

app.get("/*.ejs", function (req, res) {
    afisareEroare(res, 400);
});

app.get('/bauturi', async function(req, res) {
    try {
        const selectedCategorie = req.query.categorie;
        let conditieQuery = "";
        const parametri = [];

        if (selectedCategorie && selectedCategorie !== 'toate') {
            conditieQuery = " WHERE categorie = $1";
            parametri.push(selectedCategorie);
        }

        // Query pentru produse
        const queryProduse = "SELECT * FROM bauturi" + conditieQuery;
        const rezProduse = await client.query(queryProduse, parametri);

        // Obține statisticile folosind funcția existentă
        const statisticiData = await getStatisticiProduse();
        
        if (!statisticiData) {
            return afisareEroare(res, 500, "Eroare la obținerea statisticilor");
        }

        // Query pentru categorii mari (enumerație din baza de date)
        const queryCategorii = "SELECT unnest(enum_range(NULL::categorie_bautura)) AS categorie";
        const rezCategorii = await client.query(queryCategorii);

        // Query pentru arome  
        const queryArome = "SELECT unnest(enum_range(NULL::aroma_bautura)) AS aroma";
        const rezArome = await client.query(queryArome);

        // Query pentru culori
        const queryCulori = "SELECT unnest(enum_range(NULL::culoare_lichid)) AS culoare";
        const rezCulori = await client.query(queryCulori);

        // Renderează pagina cu toate datele
        res.render("pagini/produse", {
            produse: rezProduse.rows,
            statistici: statisticiData.stats, // Statisticile pentru input-uri
            optiuni: {
                categorii: rezCategorii.rows.map(c => c.categorie),
                arome: rezArome.rows.map(a => a.aroma),
                culori: rezCulori.rows.map(c => c.culoare),
                utilizari: statisticiData.optiuni.utilizari
            },
            categorie_selectata: selectedCategorie || "toate"
        });

    } catch (error) {
        console.error('Eroare în ruta /bauturi:', error);
        afisareEroare(res, 500);
    }
});

//etapa 6- generare pagina pt produs la request
app.get("/bautura/:id", function(req, res) { //defineste o ruta get care are la final are bauturi/2 (id sticla aleasa)
    const idProdus = req.params.id; //obtine id ul
    const query = "SELECT * FROM bauturi WHERE id = $1"; //defineste un query care cauta produsul cu id dat

    client.query(query, [idProdus], function(err, rez) { //executa query ul anterior, inlocuieste idProdus in locul lui $1
        if (err || rez.rows.length === 0) {
            console.log("Eroare la căutarea produsului:", err);
            return afisareEroare(res, 404, "Produsul nu a fost găsit");
        }

        res.render("pagini/produs", { prod: rez.rows[0] }); // trimite catre pagini/produs rezultatul rez.rows[0]
    });
});

app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function (req, res) {
    afisareEroare(res, 403);
});

app.get("/*", function (req, res) { //app.get general pentru calea /, trateaza orice cerere de forma/pagina
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
