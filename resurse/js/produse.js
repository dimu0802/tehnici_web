    function salveazaCategorie(categorie) { //cerinta meniu-functie pt salvarea categoriei alese in header.ejs
        localStorage.setItem('categorie_selectata', categorie);
    }

    document.addEventListener('DOMContentLoaded', function(){ //verifica daca exista o categorie salvata
        const urlParams = new URLSearchParams(window.location.search);
        let categorieSelectata = urlParams.get('categorie'); //extrage parametrul categorie din URL
        
        if (!categorieSelectata) { //daca nu e in url, cauta in localstorage
            categorieSelectata = localStorage.getItem('categorie_selectata');
        }
        
        // daca exista o categorie selectata, aplica filtru;
        if (categorieSelectata && categorieSelectata !== 'toate') {
            //seteaza filtrul
            const selectCategorii = document.getElementById("inp-categorii");
            if (selectCategorii) {
                //pentru select multiplu
                for (let i = 0; i < selectCategorii.options.length; i++) {
                    if (selectCategorii.options[i].value === categorieSelectata) {
                        selectCategorii.options[i].selected = true;
                        break;
                    }
                }
                //aplica filtrarea
                aplicaFiltrare();
            }
        }
    });

    window.onload = function (){
        const btnFiltrare = document.getElementById("filtrare");
        const btnResetare = document.getElementById("resetare");
        
        
        const K = 5; 
        let paginaCurenta = 1;
        let produseVizibile = [];

      
        let produsePastrate = new Set();
        let produseAscunseTemp = new Set(); // Produse ascunse temporar
        

        function marcheazaCelMaiIeftinProdus() {
            const produsePeCategorie = {};
            
            document.querySelectorAll('.produs').forEach(produs => {
                const esteSterspermanent = produs.getAttribute('data-sters-sesiune') === 'true';
                if (esteSterspermanent) return;
                
                const categorieElement = produs.querySelector('.categorie-produs');
                if (!categorieElement) return;
                
                const categorie = categorieElement.textContent.replace('Categorie: ', '').trim();
                const pret = parseFloat(produs.querySelector('.val-pret').textContent);
                const id = produs.getAttribute('data-produs-id');
                
                if (!produsePeCategorie[categorie]) {
                    produsePeCategorie[categorie] = [];
                }
                
                produsePeCategorie[categorie].push({
                    element: produs,
                    pret: pret,
                    id: id
                });
    });
    
    Object.keys(produsePeCategorie).forEach(categorie => {
        const produse = produsePeCategorie[categorie];
        if (produse.length === 0) return;
        
        const pretMinim = Math.min(...produse.map(p => p.pret));
        
        produse.forEach(produs => {
            const indicator = document.getElementById(`ieftin-${produs.id}`);
            if (indicator) {
                if (produs.pret === pretMinim) {
                    indicator.style.display = 'block';
                } else {
                    indicator.style.display = 'none';
                }
            }
        });
    });
}

    function normalizeazaDiacritice(text) {
        const mapaDiacritice = {
            'ă': 'a', 'â': 'a', 'î': 'i', 'ș': 's', 'ț': 't',
            'Ă': 'A', 'Â': 'A', 'Î': 'I', 'Ș': 'S', 'Ț': 'T'
        };
        
        return text.replace(/[^\u0000-\u007E]/g, function(caracter) {
            return mapaDiacritice[caracter] || caracter;
        });
    }
    
    function comparaTexteNormalizate(text1, text2) {
        const t1Normalizat = normalizeazaDiacritice(text1.toLowerCase().trim());
        const t2Normalizat = normalizeazaDiacritice(text2.toLowerCase().trim());
        return t1Normalizat.includes(t2Normalizat);
    }
    
    function getProduseSterse() {
        const sterse = sessionStorage.getItem('produse_sterse_sesiune');
        return sterse ? JSON.parse(sterse) : [];
    }
    
    function salveazaProduseSterse(produseSterse) {
        sessionStorage.setItem('produse_sterse_sesiune', JSON.stringify(produseSterse));
    }

    function initializeazaStareProduse() {
        const produseSterse = getProduseSterse();
        
        produseSterse.forEach(idProdus => {
            const produs = document.querySelector(`[data-produs-id="${idProdus}"]`);
            if (produs) {
                produs.style.display = 'none';
                produs.setAttribute('data-sters-sesiune', 'true');
            }
        });
    }

    function gestioneazaButonPastrat(btn, idProdus) {
        const produs = document.querySelector(`[data-produs-id="${idProdus}"]`);
        
        if (produsePastrate.has(idProdus)) {
            produsePastrate.delete(idProdus);
            btn.classList.remove('activ');
            produs.classList.remove('pastrat');
            btn.title = "Păstrează produsul (nu va fi ascuns la filtrare)";
        } else {
            produsePastrate.add(idProdus);
            btn.classList.add('activ');
            produs.classList.add('pastrat');
            btn.title = "Anulează păstrarea produsului";
            
            if (produseAscunseTemp.has(idProdus)) {
                produseAscunseTemp.delete(idProdus);
                produs.classList.remove('ascuns-temp');
                produs.style.display = 'block';
                
                const btnAscuns = produs.querySelector('.btn-ascuns-temp');
                btnAscuns.title = "Ascunde temporar produsul";
            }
        }
        
        aplicaPaginare();
    }

    function gestioneazaButonAscunsTemp(btn, idProdus) {
        const produs = document.querySelector(`[data-produs-id="${idProdus}"]`);
        
        if (produsePastrate.has(idProdus)) {
            alert("Produsul este păstrat și nu poate fi ascuns. Anulați mai întâi păstrarea.");
            return;
        }
        
        if (produseAscunseTemp.has(idProdus)) {
            produseAscunseTemp.delete(idProdus);
            produs.classList.remove('ascuns-temp');
            produs.style.display = 'block';
            btn.title = "Ascunde temporar produsul";
        } else {
            produseAscunseTemp.add(idProdus);
            produs.classList.add('ascuns-temp');
            produs.style.display = 'none';
            btn.title = "Reafișează produsul";
        }
        
        aplicaPaginare();
    }

    function gestioneazaButonStersSesiune(btn, idProdus) {
        if (confirm("Sigur doriți să ștergeți acest produs pentru toată sesiunea curentă? Produsul nu va mai apărea până la închiderea tab-ului.")) {
            const produs = document.querySelector(`[data-produs-id="${idProdus}"]`);
            
            produsePastrate.delete(idProdus);
            produseAscunseTemp.delete(idProdus);
            
            produs.style.display = 'none';
            produs.setAttribute('data-sters-sesiune', 'true');
            
            const produseSterse = getProduseSterse();
            if (!produseSterse.includes(idProdus)) {
                produseSterse.push(idProdus);
                salveazaProduseSterse(produseSterse);
            }
            
            aplicaPaginare();
        }
    }

    function initializeazaButoane() {
        document.querySelectorAll('.btn-pastrat').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const idProdus = this.getAttribute('data-produs-id');
                gestioneazaButonPastrat(this, idProdus);
            });
        });

        document.querySelectorAll('.btn-ascuns-temp').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const idProdus = this.getAttribute('data-produs-id');
                gestioneazaButonAscunsTemp(this, idProdus);
            });
        });

        document.querySelectorAll('.btn-sters-sesiune').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const idProdus = this.getAttribute('data-produs-id');
                gestioneazaButonStersSesiune(this, idProdus);
            });
        });
    }

    // functia de paginare 
    function aplicaPaginare() {
        //obtine toate produsele care nu sunt sterse permanent si nu sunt ascunse temporar
        produseVizibile = Array.from(document.querySelectorAll(".produs")).filter(prod => {
            const idProdus = prod.getAttribute('data-produs-id');
            const esteSterspermanent = prod.getAttribute('data-sters-sesiune') === 'true';
            const esteFiltrat = prod.getAttribute('data-filtrat') === 'nu';
            const esteAscunsTemp = produseAscunseTemp.has(idProdus);
            const estePastrat = produsePastrate.has(idProdus);
            
            // nu afiseaza produsele sterse permanent
            if (esteSterspermanent) return false;
            
            // afiseaza produsele pastrate
            if (estePastrat && !esteAscunsTemp) return true;
            
            // altfel, nu afiseaza produsele ascunse temporar sau filtrate
            return !esteAscunsTemp && !esteFiltrat;
        });

        const totalProduse = produseVizibile.length;
        const numarPagini = Math.ceil(totalProduse / K); //imparte total produse la K=5 si rotunjeste in sus

        // ascunde produsele care sunt sterse sau ascunse
        document.querySelectorAll(".produs").forEach(prod => {
            const idProdus = prod.getAttribute('data-produs-id');
            const esteSterspermanent = prod.getAttribute('data-sters-sesiune') === 'true';
            const esteAscunsTemp = produseAscunseTemp.has(idProdus);
            
            if (esteSterspermanent || esteAscunsTemp) {
                prod.style.display = "none";
            } else {
                prod.style.display = "none"; //cerinta grid-elemente. js ul ascunde produsele, nu le sterge
            }
        });

        // calc intervalul pentru pagina curenta
        const indexStart = (paginaCurenta - 1) * K;
        const indexEnd = Math.min(indexStart + K, totalProduse);

        // afiseaza doar produsele din intervalul curent
        for (let i = indexStart; i < indexEnd; i++) {
            if (produseVizibile[i]) {
                produseVizibile[i].style.display = "block";
            }
        }

        //marcheaza cel mai ieftin prod dupa aplicare paginare
        marcheazaCelMaiIeftinProdus();

        // genereaza sau actualizeaza controalele de paginare
        generPaginare(numarPagini, totalProduse);
    }

    function generPaginare(numarPagini, totalProduse) {
        // elimina controalele de paginare existente
        const paginareExistenta = document.getElementById("paginare-container");
        if (paginareExistenta) {
            paginareExistenta.remove();
        }

        // nu afiseaza paginarea daca sunt mai putine produse decat K
        if (totalProduse <= K) {
            return;
        }

        // creeaza containerul pentru paginare
        const paginareContainer = document.createElement("div");
        paginareContainer.id = "paginare-container";
        paginareContainer.className = "d-flex justify-content-center align-items-center mt-4 mb-4";
        paginareContainer.innerHTML = `
            <nav aria-label="Paginare produse">
                <ul class="pagination pagination-lg" id="paginare-lista">
                </ul>
            </nav>
            <div class="ms-3">
                <span class="badge bg-info fs-6">
                    Pagina ${paginaCurenta} din ${numarPagini} 
                    (${((paginaCurenta - 1) * K + 1)}-${Math.min(paginaCurenta * K, totalProduse)} din ${totalProduse})
                </span>
            </div>
        `;

        const paginareList = paginareContainer.querySelector("#paginare-lista");

        const itemAnterior = document.createElement("li");
        itemAnterior.className = `page-item ${paginaCurenta === 1 ? 'disabled' : ''}`;
        itemAnterior.innerHTML = `
            <button class="page-link" ${paginaCurenta === 1 ? 'disabled' : ''}>
                <i class="bi bi-chevron-left"></i> Anterior
            </button>
        `;
        if (paginaCurenta > 1) {
            itemAnterior.querySelector('button').onclick = () => {
                paginaCurenta--;
                aplicaPaginare();
            };
        }
        paginareList.appendChild(itemAnterior);

        for (let i = 1; i <= numarPagini; i++) {
            const pageItem = document.createElement("li");
            pageItem.className = `page-item ${i === paginaCurenta ? 'active' : ''}`;
            
            const pageButton = document.createElement("button");
            pageButton.className = "page-link";
            pageButton.textContent = i;
            
            if (i !== paginaCurenta) {
                pageButton.onclick = () => {
                    paginaCurenta = i;
                    aplicaPaginare();
                };
            }
            
            pageItem.appendChild(pageButton);
            paginareList.appendChild(pageItem);
        }

        const itemUrmator = document.createElement("li");
        itemUrmator.className = `page-item ${paginaCurenta === numarPagini ? 'disabled' : ''}`;
        itemUrmator.innerHTML = `
            <button class="page-link" ${paginaCurenta === numarPagini ? 'disabled' : ''}>
                Următorul <i class="bi bi-chevron-right"></i>
            </button>
        `;
        if (paginaCurenta < numarPagini) {
            itemUrmator.querySelector('button').onclick = () => {
                paginaCurenta++;
                aplicaPaginare();
            };
        }
        paginareList.appendChild(itemUrmator);

        document.querySelector("#produse").appendChild(paginareContainer);
    }
    
    //functie care aplica filtrarea-buton
    function aplicaFiltrare() {
        //validare descrieie
        const textareaDescriere = document.getElementById("inp-descriere");
        const descriereValue = textareaDescriere.value.trim(); 
        let okValidare = true;
        const mesajEroare = [];

        if (descriereValue && descriereValue.length < 5){ //daca s a introdus o descriere care are mai putin de 5 caractere ->eroare
            okValidare = false;
            mesajEroare.push("Descrierea trebuie să conțină minim 5 caractere");
            textareaDescriere.classList.add("is-invalid"); //adauga clasa "is-invalid" la inputname; evidentiaza vizual inputul ca fiind invalid
        } else {
            textareaDescriere.classList.remove("is-invalid"); //daca e ok, scoate "is-invalid"
        }

        //validare nume (cu normalizare pentru diacritice)
        const inputNume = document.getElementById("inp-nume");
        const numeNormalizat = normalizeazaDiacritice(inputNume.value);
        if (inputNume.value && /\d/.test(numeNormalizat)) {
            okValidare = false;
            mesajEroare.push("Numele nu poate conține cifre.");
            inputNume.classList.add("is-invalid");
        } else {
            inputNume.classList.remove("is-invalid");
        }

        if (!okValidare){ //daca exista erori, iesim
            return;
        }

        //obtinr valorile pentru filtrare
        const nume = document.getElementById("inp-nume").value.trim();
        const aroma = document.getElementById("inp-aroma").value.trim();
        const descriere = document.getElementById("inp-descriere").value.trim();

        const culoareSelect = document.getElementById("inp-culoare");
        const culoareSelectata = culoareSelect.value.toLowerCase();

        const utilizariCheckbox = document.querySelectorAll(".chk-util:checked");
        const utilizariSelectate = Array.from(utilizariCheckbox).map(cb => cb.value.toLowerCase()); 

        const categoriiSelect = document.getElementById("inp-categorii");
        const categoriiSelectate = Array.from(categoriiSelect.selectedOptions).map(opt => opt.value.toLowerCase()); //categoriiselect - returneaza toate optiunile selectate; array.from: converteste ce e in selectedoption intr un array; .map.. ia fiecare optiune si extrage val ei

        const zaharRadio = document.querySelector("input[name='gr_zahar']:checked")?.value || "toate";
        const cantitateMinima = parseInt(document.getElementById("inp-cantitate").value);

        //caitam prin produse care se potrivesc la filtrele aplicate
        const produse = document.querySelectorAll(".produs");
        let produseGasite = 0;

        // aplica filtrare+normalizare diacritice
        produse.forEach(prod => {
            const idProdus = prod.getAttribute('data-produs-id');
            const esteSterspermanent = prod.getAttribute('data-sters-sesiune') === 'true'; //verificam daca a fost sters permanent-etapa6
            
            //nu l mai verifica daca a fost sters deja
            if (esteSterspermanent) {
                prod.setAttribute('data-filtrat', 'nu');
                return;
            }

            let ok = true;

            //extrage valorile din produs pentru a le verifica; query selector-> unde gaseste acea valoare
            const valNume = prod.querySelector("h3 a").textContent.trim();
            const valCantitate = parseInt(prod.querySelector(".val-cantitate").textContent);
            const valCuloare = prod.querySelector("table tr:nth-child(2) td:nth-child(2)").textContent.trim().toLowerCase();
            const valAroma = prod.querySelector(".val-aroma").textContent.trim();
            const valDescriere = prod.querySelector(".descriere").textContent.trim();
            const valZahar = prod.querySelector("table tr:nth-child(5) td:nth-child(2)").textContent.trim().toLowerCase() === "da" ? "da" : "nu";
            const valUtilizari = prod.querySelector("table tr:nth-child(3) td:nth-child(2)").textContent.trim().toLowerCase().split(/\s*,\s*/);
            
            //caita un elem cu clasa .categorie-produs in prod curent, daca nu gaseste, valcategorie ramane gol
            let valCategorie = "";
            const categorieElement = prod.querySelector(".categorie-produs");
            if (categorieElement) {
                valCategorie = categorieElement.textContent.replace("Categorie: ", "").trim().toLowerCase().replace(/\s+/g, "_");
            }

            // aplica filtre cu normalizarea input ului
            if (nume && !comparaTexteNormalizate(valNume, nume)) ok = false;
            if (aroma && !comparaTexteNormalizate(valAroma, aroma)) ok = false;
            if (descriere && !comparaTexteNormalizate(valDescriere, descriere)) ok = false;
            if (valCantitate < cantitateMinima) ok = false;
            if (zaharRadio !== "toate" && valZahar !== zaharRadio) ok = false;
            if (culoareSelectata !== "toate" && valCuloare !== culoareSelectata) ok = false;
            if (utilizariSelectate.length && !utilizariSelectate.some(u => valUtilizari.includes(u))) ok = false;
            if (categoriiSelectate.length && !categoriiSelectate.includes(valCategorie)) ok = false;

            //marcheaza produsul ca filtrat
            prod.setAttribute('data-filtrat', ok ? 'da' : 'nu');
            if (ok) produseGasite++;
        });

        paginaCurenta = 1; //bonus 5- reseteaza la pagina 1 dupa aplicare filtre, ca sa caute prin toate prod

        marcheazaCelMaiIeftinProdus(); //bonus 14-apeleaza functia 

        // Aplică paginarea după filtrare
        aplicaPaginare(); //bonus 5-apeleaza functia

        // afiseaza info despre filtrare
        const infoFiltru = document.getElementById("info-filtru") || document.createElement("div");
        if (!document.getElementById("info-filtru")) {
            infoFiltru.id = "info-filtru";
            infoFiltru.className = "alert alert-info mt-2"; //afiseaza un alert
            document.getElementById("filtrare-produse").appendChild(infoFiltru);
        }
        infoFiltru.textContent = `Găsite ${produseGasite} produse din ${produse.length} total.`; //pentru banner ul care zice cate produse s au gasit

        //bonus 3-mesaj nu exista prod
        // Afișează mesaj dacă nu sunt produse vizibile
        let mesajNuExista = document.getElementById("mesaj-nu-exista");
        
        //daca n a gasit niciun produs, afiseaza mesaj. daca nu exista mesaj, il creeaza
        if (produseVizibile.length === 0) {
            if (!mesajNuExista) {
                mesajNuExista = document.createElement("div");
                mesajNuExista.id = "mesaj-nu-exista";
                mesajNuExista.className = "alert alert-warning text-center mt-4";
                mesajNuExista.innerHTML = `
                    <i class="bi bi-exclamation-triangle"></i>
                    <h4>Nu există produse conform filtrării curente</h4>
                    <p class="mb-0">Încercați să modificați criteriile de filtrare pentru a găsi produse.</p>
                `;
                document.querySelector("#produse").prepend(mesajNuExista);
            }
            mesajNuExista.style.display = "block";
        } else {
            if (mesajNuExista) {
                mesajNuExista.style.display = "none";
            }
        }
    }

    //bonus 4 - update imediat al listei de produse in urma actualizarii input
    document.getElementById("inp-nume").addEventListener('input', aplicaFiltrare);
    
    document.getElementById("inp-cantitate").addEventListener('input', function() {
        document.getElementById("infoCantitate").textContent = `(${this.value})`;
        aplicaFiltrare();
    });
    
    document.getElementById("inp-aroma").addEventListener('input', aplicaFiltrare);
    
    document.querySelectorAll("input[name='gr_zahar']").forEach(radio => {
        radio.addEventListener('change', aplicaFiltrare);
    });
    
    document.getElementById("inp-descriere").addEventListener('input', aplicaFiltrare);
    document.getElementById("inp-culoare").addEventListener('change', aplicaFiltrare);
    
    document.querySelectorAll(".chk-util").forEach(checkbox => {
        checkbox.addEventListener('change', aplicaFiltrare);
    });
    
    document.getElementById("inp-categorii").addEventListener('change', aplicaFiltrare);

    btnFiltrare.onclick = aplicaFiltrare; // declansare fct de filtrare

    //buton resetare
    btnResetare.onclick = function () {
        if (confirm("Sigur vrei să resetezi filtrele?")) { //task meniu-intrebare doriti sa resetati 
            // resetare inputs
            document.getElementById("inp-nume").value = "";
            document.getElementById("inp-aroma").value = "";
            document.getElementById("inp-descriere").value = "";
            document.getElementById("zahar_toate").checked = true;
            
            const inputCantitate = document.getElementById("inp-cantitate");
            inputCantitate.value = inputCantitate.min;
            document.getElementById("infoCantitate").textContent = `(${inputCantitate.min})`;
            
            document.querySelectorAll(".chk-util").forEach(cb => cb.checked = false);
            document.getElementById("inp-culoare").selectedIndex = 0;
            
            const selectCategorii = document.getElementById("inp-categorii");
            for (let i = 0; i < selectCategorii.options.length; i++) {
                selectCategorii.options[i].selected = false;
            }

            document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));

            // resetare paginare
            paginaCurenta = 1;
            
            //marcheaza toate prod ca vizibile
            document.querySelectorAll(".produs").forEach(prod => {
                const esteSterspermanent = prod.getAttribute('data-sters-sesiune') === 'true'; //mai putin cele sters permanent
                if (!esteSterspermanent) {
                    prod.setAttribute('data-filtrat', 'da');
                }
            });

            //re-marcheaza cel mai ieftin dupa resetare
            marcheazaCelMaiIeftinProdus();

            //re-aplica paginare
            aplicaPaginare();
            
            //elim mesajul de informare, daca exista
            const infoFiltru = document.getElementById("info-filtru");
            if (infoFiltru) {
                infoFiltru.remove();
            }

            //ascunde mesajul daca nu era vizibil
            const mesajNuExista = document.getElementById("mesaj-nu-exista");
            if (mesajNuExista) {
                mesajNuExista.style.display = "none";
            }
        }
    };

    //functii sortare
    document.getElementById("sortCrescNume").onclick = () => {
        if (produseVizibile.length === 0) {
            alert("Nu există produse vizibile pentru a fi sortate.");
            return;
        }
        sorteazaRaport(1); //semn pozitiv->filtrare crescatoare
        aplicaPaginare(); //reaplica paginare dupa sortare
    };
    
    document.getElementById("sortDescrescNume").onclick = () => {
        if (produseVizibile.length === 0) {
            alert("Nu există produse vizibile pentru a fi sortate.");
            return;
        }
        sorteazaRaport(-1); //semn negativ->filtrare descrescatoare 
        aplicaPaginare(); // reaplica paginarea dupa sortare
    };

    //functoe generala de sortare, cu semn
    function sorteazaRaport(semn) {
        const container = document.querySelector(".grid-produse");
        const toateProdusele = Array.from(document.querySelectorAll(".produs")); //filtreaza toate prod, nu doar cele vizibile
    
        toateProdusele.sort((a, b) => {
            //extrage cant si pret pt cele doua produse
            const cantA = parseFloat(a.querySelector(".val-cantitate").textContent);
            const pretA = parseFloat(a.querySelector(".val-pret").textContent);
            const raportA = cantA / pretA;
    
            const cantB = parseFloat(b.querySelector(".val-cantitate").textContent);
            const pretB = parseFloat(b.querySelector(".val-pret").textContent);
            const raportB = cantB / pretB;

            //crit 1: raport cantitate/pret
            if (raportA !== raportB)
                return semn * (raportA - raportB);
    
            //crit 2: numele produsului
            const numeA = normalizeazaDiacritice(a.querySelector("h3 a").textContent.trim().toLowerCase());
            const numeB = normalizeazaDiacritice(b.querySelector("h3 a").textContent.trim().toLowerCase());
            return semn * numeA.localeCompare(numeB);
        });

        //reafiseaza produsele sortate, in noua ordine
        toateProdusele.forEach(p => container.appendChild(p));
    }
    
    document.getElementById("calculeazaSuma").onclick = () => {
        if (produseVizibile.length === 0) {
            alert("Nu există produse vizibile pentru a calcula suma.");
            return;
        }
    
        let suma = 0;
        //calculeaza suma pt prod de pe pag curenta
        const produseAfisite = Array.from(document.querySelectorAll(".produs")).filter(p => 
            p.style.display === "block"
        );
        
        //calc suma tuturor prod
        produseAfisite.forEach(p => {
            suma += parseFloat(p.querySelector(".val-pret").textContent);
        });
    
        const div = document.createElement("div");
        div.textContent = `Suma prețurilor de pe pagina curentă: ${suma.toFixed(2)} lei`;
        div.style.position = "fixed";
        div.style.top = "10px";
        div.style.right = "10px";
        div.style.background = "#333";
        div.style.color = "white";
        div.style.padding = "10px";
        div.style.borderRadius = "8px";
        div.style.zIndex = "1000";
        div.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
        document.body.appendChild(div);
    
        setTimeout(() => div.remove(), 2000); //dupa 2 secunde, dispare
    };

    // marcheaza daca un prod este vizibil sau ascuns; et 6
    document.querySelectorAll(".produs").forEach(prod => {
        prod.setAttribute('data-filtrat', 'da');
    });
    
    initializeazaStareProduse(); //initializeaza starea initiala a produselor (bonus 6)
    initializeazaButoane();
    
    //aplica paginare initiala
    aplicaPaginare();
};