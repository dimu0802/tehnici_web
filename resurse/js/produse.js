window.onload = function () {
    const btnFiltrare = document.getElementById("filtrare");
    const btnResetare = document.getElementById("resetare");
    document.getElementById("sortCrescNume").onclick = () => sorteazaRaport(1);
    document.getElementById("sortDescrescNume").onclick = () => sorteazaRaport(-1);

    document.getElementById("inp-cantitate").oninput = function () {
        document.getElementById("infoCantitate").textContent = `(${this.value})`;
    };

    btnFiltrare.onclick = function (){
        const textareaDescriere = document.getElementById("inp-descriere");
        const descriereValue = textareaDescriere.value.trim(); 
        let okValidare = true;
        const mesajEroare = [];

        if (descriereValue && descriereValue.length < 5) {
            okValidare = false;
            mesajEroare.push("Descrierea trebuie să conțină minim 5 caractere");
            textareaDescriere.classList.add("is-invalid");
        } else {
            textareaDescriere.classList.remove("is-invalid");
        }

        const inputNume = document.getElementById("inp-nume");
        if (inputNume.value && /\d/.test(inputNume.value)) {
            okValidare = false;
            mesajEroare.push("Numele nu poate conține cifre.");
            inputNume.classList.add("is-invalid");
        } else {
            inputNume.classList.remove("is-invalid");
        }

        if (!okValidare) {
            alert(mesajEroare.join("\n"));
            return;
        }

        const nume = document.getElementById("inp-nume").value.trim().toLowerCase();
        const aroma = document.getElementById("inp-aroma").value.trim().toLowerCase();
        const descriere = document.getElementById("inp-descriere").value.trim().toLowerCase();

        const culoareSelect = document.getElementById("inp-culoare");
        const culoriSelectate = Array.from(culoareSelect.selectedOptions).map(opt => opt.value.toLowerCase());

        const utilizariCheckbox = document.querySelectorAll(".chk-util:checked");
        const utilizariSelectate = Array.from(utilizariCheckbox).map(cb => cb.value.toLowerCase());

        const zaharRadio = document.querySelector("input[name='gr_zahar']:checked")?.value || "toate";
        const cantitateMinima = parseInt(document.getElementById("inp-cantitate").value);


        const produse = document.querySelectorAll(".produs");
        produse.forEach(prod => {
            let ok = true;

            const valNume = prod.querySelector("h3 a").textContent.trim().toLowerCase();
            const valPret = parseFloat(prod.querySelector("table tr:nth-child(1) td:nth-child(2)").textContent);
            const valCantitate = parseInt(prod.querySelector(".val-cantitate").textContent);
            const valCuloare = prod.querySelector("table tr:nth-child(2) td:nth-child(2)").textContent.trim().toLowerCase();
            const valAroma = prod.querySelector(".val-aroma").textContent.trim().toLowerCase();
            const valDescriere = prod.querySelector(".descriere").textContent.trim().toLowerCase();
            const valZahar = prod.querySelector("table tr:nth-child(5) td:nth-child(2)").textContent.trim().toLowerCase() === "da" ? "da" : "nu";
            const valUtilizari = prod.querySelector("table tr:nth-child(3) td:nth-child(2)").textContent.trim().toLowerCase().split(/\s*,\s*/);

            if (nume && !valNume.includes(nume)) ok = false;

            if (aroma && !valAroma.includes(aroma)) ok = false;
            if (descriere && !valDescriere.includes(descriere)) ok = false;
            if (valCantitate <= cantitateMinima) ok = false;

            if (zaharRadio !== "toate" && valZahar !== zaharRadio) ok = false;

            if (culoriSelectate.length && !culoriSelectate.includes(valCuloare)) ok = false;
            if (utilizariSelectate.length && !utilizariSelectate.some(u => valUtilizari.includes(u))) ok = false;

            prod.style.display = ok ? "block" : "none";
        });
    };


    btnResetare.onclick = function () {
        if (confirm("Sigur vrei să resetezi filtrele?")) {
            document.getElementById("inp-nume").value = "";
            
            document.getElementById("inp-aroma").value = "";
            document.getElementById("inp-descriere").value = "";

            document.getElementById("zahar_toate").checked = true;
            document.querySelectorAll("input[name='gr_cantitate']").forEach(r => r.checked = r.value === "toate");
            document.querySelectorAll(".chk-util").forEach(cb => cb.checked = false);
            document.getElementById("inp-culoare").selectedIndex = -1;

            document.querySelectorAll(".produs").forEach(prod => prod.style.display = "block");
        }
    };

    function sorteazaRaport(semn) {
        const container = document.querySelector(".grid-produse");
        const produse = Array.from(document.querySelectorAll(".produs"));
    
        produse.sort((a, b) => {
            const cantA = parseFloat(a.querySelector(".val-cantitate").textContent);
            const pretA = parseFloat(a.querySelector(".val-pret").textContent);
            const raportA = cantA / pretA;
    
            const cantB = parseFloat(b.querySelector(".val-cantitate").textContent);
            const pretB = parseFloat(b.querySelector(".val-pret").textContent);
            const raportB = cantB / pretB;
    
            if (raportA !== raportB)
                return semn * (raportA - raportB);
    
            const numeA = a.querySelector("h3 a").textContent.trim().toLowerCase();
            const numeB = b.querySelector("h3 a").textContent.trim().toLowerCase();
            return semn * numeA.localeCompare(numeB);
        });
    
        produse.forEach(p => container.appendChild(p));
    }

    document.getElementById("sortCrescNume").onclick = () => {
        const produseVizibile = Array.from(document.querySelectorAll(".produs")).filter(p => p.style.display !== "none");
        if (produseVizibile.length === 0) {
            alert("Nu există produse vizibile pentru a fi sortate.");
            return;
        }
        sorteazaRaport(1);
    };
    
    document.getElementById("sortDescrescNume").onclick = () => {
        const produseVizibile = Array.from(document.querySelectorAll(".produs")).filter(p => p.style.display !== "none");
        if (produseVizibile.length === 0) {
            alert("Nu există produse vizibile pentru a fi sortate.");
            return;
        }
        sorteazaRaport(-1);
    };
    
    document.getElementById("calculeazaSuma").onclick = () => {
        const produseVizibile = Array.from(document.querySelectorAll(".produs")).filter(p => p.style.display !== "none");
        if (produseVizibile.length === 0) {
            alert("Nu există produse vizibile pentru a calcula suma.");
            return;
        }
    
        let suma = 0;
        produseVizibile.forEach(p => {
            suma += parseFloat(p.querySelector(".val-pret").textContent);
        });
    
        const div = document.createElement("div");
        div.textContent = `Suma prețurilor afișate: ${suma.toFixed(2)} lei`;
        div.style.position = "fixed";
        div.style.top = "10px";
        div.style.right = "10px";
        div.style.background = "#333";
        div.style.color = "white";
        div.style.padding = "10px";
        div.style.borderRadius = "8px";
        div.style.zIndex = "1000";
        document.body.appendChild(div);
    
        setTimeout(() => div.remove(), 2000);
    };
    
    
};
