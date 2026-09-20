"use strict";

/*

Multiple-Choice-Trainer

Fragen werden aus fragenkatalog.xml geladen.

Der Lernerfolg wird im localStorage des Browsers gespeichert.
*/

const XML_DATEI = "fragenkatalog.xml";
const SPEICHER_SCHLUESSEL = "fischtrainer_lernerfolg_v1";

let fragen = [];
let fragenPool = [];
let aktuelleFrage = null;
let aktuelleAuswahl = new Set();
let frageBeantwortet = false;

/* ============================================================
HILFSFUNKTIONEN
============================================================ */

function normalisiereLoesung(text) {
return new Set(
text
.toLowerCase()
.split(",")
.map(x => x.trim())
.filter(x => x.length > 0)
);
}

function setsGleich(setA, setB) {

if (setA.size !== setB.size) {
    return false;
}

for (const wert of setA) {
    if (!setB.has(wert)) {
        return false;
    }
}

return true;

}

function mische(array) {

const kopie = [...array];

for (let i = kopie.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
}

return kopie;

}

/* ============================================================
XML LADEN
============================================================ */

async function ladeFragen() {

const response = await fetch(XML_DATEI);

if (!response.ok) {
    throw new Error(
        `Die Datei "${XML_DATEI}" konnte nicht geladen werden.`
    );
}

const xmlText = await response.text();

const parser = new DOMParser();
const xml = parser.parseFromString(xmlText, "application/xml");

const parserFehler = xml.querySelector("parsererror");

if (parserFehler) {
    throw new Error(
        "Die XML-Datei konnte nicht verarbeitet werden."
    );
}

const frageElemente = xml.querySelectorAll("frage");

if (frageElemente.length === 0) {
    throw new Error(
        "Im Fragenkatalog wurden keine Fragen gefunden."
    );
}

const ergebnis = [];

frageElemente.forEach(element => {

    const id = element.getAttribute("id") || "";
    const rubrik = element.getAttribute("rubrik") || "";

    const textElement = element.querySelector(":scope > text");
    const antwortenElement =
        element.querySelector(":scope > antworten");
    const loesungElement =
        element.querySelector(":scope > loesung");

    if (!textElement) {
        console.warn(`Frage ${id} hat keinen Text.`);
        return;
    }

    if (!antwortenElement) {
        console.warn(`Frage ${id} hat keine Antworten.`);
        return;
    }

    if (!loesungElement) {
        console.warn(`Frage ${id} hat keine Lösung.`);
        return;
    }

    const antworten = {};

    antwortenElement
        .querySelectorAll(":scope > antwort")
        .forEach(antwortElement => {

            const antwortId =
                antwortElement.getAttribute("id");

            const antwortText =
                antwortElement.textContent.trim();

            if (antwortId && antwortText) {
                antworten[antwortId.toLowerCase()] =
                    antwortText;
            }
        });

    const loesung =
        normalisiereLoesung(loesungElement.textContent);

    if (Object.keys(antworten).length === 0) {
        console.warn(`Frage ${id} hat keine gültigen Antworten.`);
        return;
    }

    if (loesung.size === 0) {
        console.warn(`Frage ${id} hat keine Lösung.`);
        return;
    }

    ergebnis.push({
        id,
        rubrik,
        text: textElement.textContent.trim(),
        antworten,
        loesung,

        richtig: 0,
        falsch: 0
    });
});

return ergebnis;

}

/* ============================================================
LERNERFOLG
============================================================ */

function ladeLernerfolg() {

const gespeicherterText =
    localStorage.getItem(SPEICHER_SCHLUESSEL);

if (!gespeicherterText) {
    return;
}

try {

    const gespeicherteDaten =
        JSON.parse(gespeicherterText);

    fragen.forEach(frage => {

        const daten =
            gespeicherteDaten[frage.id];

        if (!daten) {
            return;
        }

        /*
         * Die Rubrik wird ebenfalls berücksichtigt.
         * Dadurch ist es möglich, dass eine Frage-ID
         * in unterschiedlichen Katalogversionen wiederverwendet
         * wird.
         */
        if (
            daten.rubrik === frage.rubrik ||
            daten.rubrik === undefined
        ) {
            frage.richtig =
                Number.isInteger(daten.richtig)
                    ? daten.richtig
                    : 0;

            frage.falsch =
                Number.isInteger(daten.falsch)
                    ? daten.falsch
                    : 0;
        }
    });

} catch (fehler) {

    console.error(
        "Lernerfolg konnte nicht geladen werden:",
        fehler
    );
}

}

function speichereLernerfolg() {

const daten = {};

fragen.forEach(frage => {

    daten[frage.id] = {
        rubrik: frage.rubrik,
        richtig: frage.richtig,
        falsch: frage.falsch
    };
});

localStorage.setItem(
    SPEICHER_SCHLUESSEL,
    JSON.stringify(daten)
);

}

function loescheLernerfolg() {

localStorage.removeItem(SPEICHER_SCHLUESSEL);

fragen.forEach(frage => {
    frage.richtig = 0;
    frage.falsch = 0;
});

}

/* ============================================================
FRAGENPOOL
============================================================ */

function erstelleFragenpool() {

fragenPool = mische(fragen);

}

/* ============================================================
NÄCHSTE FRAGE
============================================================ */

function zeigeNaechsteFrage() {

if (fragenPool.length === 0) {

    zeigeAuswertung();
    return;
}

aktuelleFrage = fragenPool.pop();

aktuelleAuswahl = new Set();
frageBeantwortet = false;

renderFrage();

}

/* ============================================================
FRAGE DARSTELLEN
============================================================ */

function renderFrage() {

document
    .getElementById("quizbereich")
    .classList.remove("versteckt");

document
    .getElementById("auswertung")
    .classList.add("versteckt");

const bereits =
    fragen.length - fragenPool.length;

document.getElementById("frageNummer").textContent =
    `Frage ${bereits} von ${fragen.length}`;

document.getElementById("fortschritt").textContent =
    `${Math.round((bereits / fragen.length) * 100)} %`;

document.getElementById("fortschrittsbalkenInnen")
    .style.width =
    `${(bereits / fragen.length) * 100}%`;

document.getElementById("rubrik").textContent =
    aktuelleFrage.rubrik;

document.getElementById("rubrikAnzeige").textContent =
    aktuelleFrage.rubrik;

document.getElementById("frageText").textContent =
    aktuelleFrage.text;

const mehrfach =
    aktuelleFrage.loesung.size > 1;

document
    .getElementById("mehrfachHinweis")
    .classList.toggle(
        "versteckt",
        !mehrfach
    );

const antwortenContainer =
    document.getElementById("antworten");

antwortenContainer.innerHTML = "";

Object.entries(aktuelleFrage.antworten)
    .forEach(([id, text]) => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "antwort";
        button.dataset.id = id;

        const buchstabe =
            document.createElement("span");

        buchstabe.className =
            "antwort-buchstabe";

        buchstabe.textContent =
            id.toUpperCase();

        const antwortText =
            document.createElement("span");

        antwortText.className =
            "antwort-text";

        antwortText.textContent = text;

        button.appendChild(buchstabe);
        button.appendChild(antwortText);

        button.addEventListener(
            "click",
            () => waehleAntwort(id, button)
        );

        antwortenContainer.appendChild(button);
    });

const ergebnis =
    document.getElementById("ergebnis");

ergebnis.className = "versteckt";
ergebnis.innerHTML = "";

document
    .getElementById("pruefenButton")
    .classList.remove("versteckt");

document
    .getElementById("pruefenButton")
    .disabled = false;

document
    .getElementById("naechsteButton")
    .classList.add("versteckt");

}

/* ============================================================
ANTWORT AUSWÄHLEN
============================================================ */

function waehleAntwort(id, button) {

if (frageBeantwortet) {
    return;
}

if (aktuelleAuswahl.has(id)) {

    aktuelleAuswahl.delete(id);

    button.classList.remove("ausgewaehlt");

} else {

    aktuelleAuswahl.add(id);

    button.classList.add("ausgewaehlt");
}

}

/* ============================================================
ANTWORT PRÜFEN
============================================================ */

function pruefeAntwort() {

if (frageBeantwortet) {
    return;
}

if (aktuelleAuswahl.size === 0) {

    alert("Bitte mindestens eine Antwort auswählen.");

    return;
}

frageBeantwortet = true;

const richtig =
    setsGleich(
        aktuelleAuswahl,
        aktuelleFrage.loesung
    );

if (richtig) {
    aktuelleFrage.richtig++;
} else {
    aktuelleFrage.falsch++;
}

speichereLernerfolg();

zeigeErgebnis(richtig);

}

/* ============================================================
ERGEBNIS ANZEIGEN
============================================================ */

function zeigeErgebnis(richtig) {

const ergebnis =
    document.getElementById("ergebnis");

ergebnis.classList.remove("versteckt");

if (richtig) {

    ergebnis.className = "richtig";

    ergebnis.innerHTML =
        "<strong>✓ Richtig!</strong>";

} else {

    ergebnis.className = "falsch";

    let html =
        "<strong>✗ Falsch!</strong>";

    html +=
        "<div class='ergebnis-loesung'>" +
        "<strong>Richtige Lösung:</strong><br>";

    const loesungen =
        [...aktuelleFrage.loesung].sort();

    loesungen.forEach(id => {

        const text =
            aktuelleFrage.antworten[id];

        if (text) {

            html +=
                `${id.toUpperCase()}: ${escapeHtml(text)}<br>`;
        }
    });

    html += "</div>";

    ergebnis.innerHTML = html;
}

/*
 * Nach der Auswertung die Buttons markieren:
 *
 * - grün = richtige Lösung
 * - rot  = vom Benutzer falsch ausgewählt
 */
document
    .querySelectorAll(".antwort")
    .forEach(button => {

        const id = button.dataset.id;

        const istLoesung =
            aktuelleFrage.loesung.has(id);

        const wurdeGewaehl =
            aktuelleAuswahl.has(id);

        if (istLoesung) {
            button.classList.add("loesung");
        }

        if (wurdeGewaehl && !istLoesung) {
            button.classList.add("falsch");
        }

        button.disabled = true;
    });

document
    .getElementById("pruefenButton")
    .classList.add("versteckt");

document
    .getElementById("naechsteButton")
    .classList.remove("versteckt");

}

/* ============================================================
AUSWERTUNG
============================================================ */

function zeigeAuswertung() {

document
    .getElementById("quizbereich")
    .classList.add("versteckt");

document
    .getElementById("auswertung")
    .classList.remove("versteckt");

document
    .getElementById("rubrikAnzeige")
    .textContent = "Auswertung";

let gesamtRichtig = 0;
let gesamtFalsch = 0;

const rubriken = {};

fragen.forEach(frage => {

    gesamtRichtig += frage.richtig;
    gesamtFalsch += frage.falsch;

    if (!rubriken[frage.rubrik]) {

        rubriken[frage.rubrik] = {
            richtig: 0,
            falsch: 0
        };
    }

    rubriken[frage.rubrik].richtig +=
        frage.richtig;

    rubriken[frage.rubrik].falsch +=
        frage.falsch;
});

const gesamt =
    gesamtRichtig + gesamtFalsch;

const gesamtProzent =
    gesamt > 0
        ? 100 * gesamtRichtig / gesamt
        : 0;

document
    .getElementById("gesamtErgebnis")
    .innerHTML = `
        <div class="rubrik-zeile">
            <div>Richtig: <strong>${gesamtRichtig}</strong></div>
            <div>Falsch: <strong>${gesamtFalsch}</strong></div>
            <div class="erfolgsquote">
                Erfolgsquote:
                ${gesamtProzent.toFixed(2)} %
            </div>
        </div>
    `;

const rubrikContainer =
    document.getElementById("rubrikErgebnis");

rubrikContainer.innerHTML = "";

Object.entries(rubriken)
    .forEach(([rubrik, werte]) => {

        const anzahl =
            werte.richtig + werte.falsch;

        const prozent =
            anzahl > 0
                ? 100 * werte.richtig / anzahl
                : 0;

        const element =
            document.createElement("div");

        element.className = "rubrik-zeile";

        element.innerHTML = `
            <div class="rubrik-name">
                ${escapeHtml(rubrik)}
            </div>
            <div>
                Richtig: ${werte.richtig}
                &nbsp;&nbsp;
                Falsch: ${werte.falsch}
            </div>
            <div class="erfolgsquote">
                Erfolgsquote:
                ${prozent.toFixed(2)} %
            </div>
        `;

        rubrikContainer.appendChild(element);
    });

const fragenContainer =
    document.getElementById("fragenErgebnis");

fragenContainer.innerHTML = "";

fragen.forEach(frage => {

    const zeile =
        document.createElement("tr");

    zeile.innerHTML = `
        <td>${escapeHtml(frage.id)}</td>
        <td>${escapeHtml(frage.text)}</td>
        <td>${frage.richtig}</td>
        <td>${frage.falsch}</td>
    `;

    fragenContainer.appendChild(zeile);
});

}

/* ============================================================
NEUER DURCHGANG
============================================================ */

function neuerDurchgang() {

erstelleFragenpool();

document
    .getElementById("auswertung")
    .classList.add("versteckt");

zeigeNaechsteFrage();

}

/* ============================================================
LERNERFOLG ZURÜCKSETZEN
============================================================ */

function zuruecksetzen() {

const bestaetigt =
    confirm(
        "Soll der gesamte Lernerfolg wirklich gelöscht werden?"
    );

if (!bestaetigt) {
    return;
}

loescheLernerfolg();

alert("Der Lernerfolg wurde zurückgesetzt.");

zeigeAuswertung();

}

/* ============================================================
HTML SICHER DARSTELLEN
============================================================ */

function escapeHtml(text) {

return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

/* ============================================================
FEHLERANZEIGE
============================================================ */

function zeigeFehler(fehler) {

console.error(fehler);

document
    .getElementById("ladebereich")
    .classList.add("versteckt");

document
    .getElementById("fehlerbereich")
    .classList.remove("versteckt");

document
    .getElementById("fehlertext")
    .textContent =
    fehler.message || String(fehler);

}

/* ============================================================
EVENTS
============================================================ */

document
.getElementById("pruefenButton")
.addEventListener(
"click",
pruefeAntwort
);

document
.getElementById("naechsteButton")
.addEventListener(
"click",
zeigeNaechsteFrage
);

document
.getElementById("auswertungButton")
.addEventListener(
"click",
zeigeAuswertung
);

document
.getElementById("neuerDurchgangButton")
.addEventListener(
"click",
neuerDurchgang
);

document
.getElementById("zuruecksetzenButton")
.addEventListener(
"click",
zuruecksetzen
);

/* ============================================================
START
============================================================ */

async function starteApp() {

try {

    fragen = await ladeFragen();

    ladeLernerfolg();

    document
        .getElementById("ladebereich")
        .classList.add("versteckt");

    if (fragen.length === 0) {
        throw new Error(
            "Der Fragenkatalog enthält keine gültigen Fragen."
        );
    }

    erstelleFragenpool();

    zeigeNaechsteFrage();

} catch (fehler) {

    zeigeFehler(fehler);
}

}

starteApp();
