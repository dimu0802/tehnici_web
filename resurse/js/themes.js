document.addEventListener('DOMContentLoaded', () => { //asteapta ca tot codul sa fie fie incarcat complet
    const themeToggleCheckbox = document.getElementById('theme-toggle'); //checkbox pentru theme
    //cele doua icons
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');
    const body = document.body;

    //functie pt a seta tema, care primeste parametru tema
    function setTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            if (themeToggleCheckbox) {
                themeToggleCheckbox.checked = true; //marcheaza checkbox ca bifat
            }
            if (themeIconSun) themeIconSun.classList.add('d-none'); // ascunde soarele
            if (themeIconMoon) themeIconMoon.classList.remove('d-none'); //apare luna luna
            localStorage.setItem('theme', 'dark'); //salveaza tema aleasa, ca sa fie pastrata la urm accesare a pag
        } else {
            body.classList.remove('dark-theme');
            if (themeToggleCheckbox) {
                themeToggleCheckbox.checked = false; //debifeaza
            }
            if (themeIconSun) themeIconSun.classList.remove('d-none'); //arata soarele
            if (themeIconMoon) themeIconMoon.classList.add('d-none'); //ascunde luna
            localStorage.setItem('theme', 'light'); 
        }
    }

    //verifica daca e vreo tema salvata 
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }

    // event listener pe checkbox-ul switch-ului
    if (themeToggleCheckbox) {
        themeToggleCheckbox.addEventListener('change', () => { //'change' event pentru checkbox
            if (themeToggleCheckbox.checked) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        });
    }
});