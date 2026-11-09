"use strict";

/*

Multiple-Choice-Trainer

Fragen werden aus fragenkatalog.xml geladen.

Der Lernerfolg wird im localStorage des Browsers gespeichert.
*/

const APP_VERSION = "1.4";
const XML_DATEI = "fragenkatalog.xml";
const SPEICHER_SCHLUESSEL = "fischtrainer_lernerfolg_v1";
const USER_KATALOG_CACHE = "mc-trainer-user-catalog";

const USER_KATALOG_DATEI =
    new URL(
        "./__user_catalog__/fragenkatalog.xml",
        document.baseURI
    ).href;

let eigenerKatalogAktiv = false;
let vorgemerkterKatalog = null;

let fragen = [];
let fragenPool = [];
let aktuelleFrage = null;
let aktuelleAuswahl = new Set();
let frageBeantwortet = false;
let aktuelleAnsicht = "quiz";
let ansichtVorProjektinfo = "quiz";
let ansichtVorDatensicherung = "quiz";

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


function waehleFrage(nochOffeneFragen) {

    const gewichte = [];

    for (const frage of nochOffeneFragen) {

        const anzahlRichtig = frage.richtig;
        const anzahlFalsch = frage.falsch;

        const anzahlVersuche =
            5 * anzahlRichtig + anzahlFalsch;

        // Selten abgefragte Fragen bevorzugen.
        // Falsche Antworten erhöhen das Auswahlgewicht.
        const gewicht =
            3 / Math.sqrt(1 + anzahlVersuche)
            + Math.pow(1 + anzahlFalsch, 2)
            / (1 + anzahlRichtig);

        gewichte.push(gewicht);
    }

    // Gewichtete Zufallsauswahl
    const gesamtGewicht =
        gewichte.reduce((summe, gewicht) => summe + gewicht, 0);

    let zufallswert = Math.random() * gesamtGewicht;

    for (let i = 0; i < nochOffeneFragen.length; i++) {

        zufallswert -= gewichte[i];

        if (zufallswert <= 0) {
            return nochOffeneFragen[i];
        }
    }

    return nochOffeneFragen[nochOffeneFragen.length - 1];
}


/* ============================================================
XML LADEN
============================================================ */

function parseFragenXML(xmlText) {

    const parser = new DOMParser();

    const xml = parser.parseFromString(
        xmlText,
        "application/xml"
    );

    const parserFehler =
        xml.querySelector("parsererror");

    if (parserFehler) {
        throw new Error(
            "Die XML-Datei konnte nicht verarbeitet werden."
        );
    }

    const frageElemente =
        xml.querySelectorAll("frage");

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

        const imageElement =
            element.querySelector(":scope > image");

        const image =
            imageElement
                ? imageElement.textContent.trim()
                : "";

        ergebnis.push({
        id,
        rubrik,
        text: textElement.textContent.trim(),
        image,
        antworten,
        loesung,

        richtig: 0,
        falsch: 0
    });
    });
    
    return ergebnis;
}

async function ladeFragen() {

    // Zuerst prüfen, ob ein eigener Katalog gespeichert ist.
    if ("caches" in window) {

        const cache =
            await caches.open(USER_KATALOG_CACHE);

        const gespeicherteDatei =
            await cache.match(USER_KATALOG_DATEI);

        if (gespeicherteDatei) {

            const xmlText =
                await gespeicherteDatei.text();

            eigenerKatalogAktiv = true;

            console.info(
                "Eigener Fragenkatalog wird verwendet."
            );

            return parseFragenXML(xmlText);
        }
    }

    // Andernfalls den Standardkatalog laden.
    eigenerKatalogAktiv = false;

    const response = await fetch(XML_DATEI);

    if (!response.ok) {
        throw new Error(
            `Die Datei "${XML_DATEI}" konnte nicht geladen werden.`
        );
    }

    const xmlText = await response.text();

    return parseFragenXML(xmlText);
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

    // Bereits gespeicherte Lernwerte übernehmen.
    let daten = {};

    try {

        const gespeichert =
            localStorage.getItem(SPEICHER_SCHLUESSEL);

        if (gespeichert) {
            daten = JSON.parse(gespeichert);
        }

        if (
            !daten ||
            typeof daten !== "object" ||
            Array.isArray(daten)
        ) {
            daten = {};
        }

    } catch (fehler) {

        daten = {};

    }

    // Nur die Fragen des aktiven Katalogs aktualisieren.
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

// Alle Fragen stehen für den neuen Durchgang zur Verfügung.
    fragenPool = [...fragen];

}

/* ============================================================
NÄCHSTE FRAGE
============================================================ */


function zeigeNaechsteFrage() {

    if (fragenPool.length === 0) {

        zeigeAuswertung();
        return;
    }

    // Gewichtete Auswahl aus den noch offenen Fragen
    aktuelleFrage = waehleFrage(fragenPool);

    // Frage aus dem Pool entfernen.
    // Sie kann in diesem Durchgang nicht erneut erscheinen.
    fragenPool.splice(
        fragenPool.indexOf(aktuelleFrage),
        1
    );

    aktuelleAuswahl = new Set();
    frageBeantwortet = false;

    renderFrage();

}

/* ============================================================
FRAGE DARSTELLEN
============================================================ */

function renderFrage() {

document.getElementById("datensicherung")
    .classList.add("versteckt");

document.getElementById("projektinfo")
    .classList.add("versteckt");

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

// Bildbereich zunächst leeren und ausblenden
const bildContainer =
    document.getElementById("frageBildContainer");

bildContainer.replaceChildren();
bildContainer.classList.add("versteckt");

// Nur anzeigen, wenn ein Bildpfad vorhanden ist
if (aktuelleFrage.image) {

    try {

        const bildUrl = new URL(
            aktuelleFrage.image,
            document.baseURI
        );

        // Nur HTTP- und HTTPS-Adressen zulassen
        if (
            bildUrl.protocol !== "https:" &&
            bildUrl.protocol !== "http:"
        ) {
            throw new Error("Ungültiges Bildformat.");
        }

        const bild = document.createElement("img");

        bild.src = bildUrl.href;
        bild.alt = `Abbildung zu Frage ${aktuelleFrage.id}`;
        bild.className = "frage-bild";
        bild.loading = "eager";
        bild.referrerPolicy = "no-referrer";

        bild.addEventListener("error", () => {

            bildContainer.replaceChildren();
            bildContainer.classList.add("versteckt");

            console.warn(
                `Bild für Frage ${aktuelleFrage.id} konnte nicht geladen werden.`
            );

        });

        bildContainer.appendChild(bild);
        bildContainer.classList.remove("versteckt");

    } catch (fehler) {

        console.warn(
            `Ungültiger Bildpfad bei Frage ${aktuelleFrage.id}:`,
            fehler
        );

    }
}

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

aktuelleAnsicht = "quiz";
aktualisiereNavigation();

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

document.getElementById("datensicherung")
    .classList.add("versteckt");

document.getElementById("projektinfo")
    .classList.add("versteckt");

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
            <div>Richtig: <strong>${gesamtRichtig}</strong>
            &nbsp;
            Falsch: <strong>${gesamtFalsch}</strong>
            &nbsp;
            <span class="erfolgsquote">
                Quote:
                ${gesamtProzent.toFixed(2)} %
            </span>
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
                &nbsp;
                Falsch: ${werte.falsch}
                &nbsp;
                <span class="erfolgsquote">
                    Quote:
                    ${prozent.toFixed(2)} %
                </span>
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

aktuelleAnsicht = "auswertung";
aktualisiereNavigation();

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
   NAVIGATION
============================================================ */

function aktualisiereNavigation() {

    const navigationButton =
        document.getElementById("navigationButton");

    const datensicherungButton =
        document.getElementById("datensicherungButton");

    const projektinfoButton =
        document.getElementById("projektinfoButton");

    if (!navigationButton) return;

    navigationButton.textContent =
        aktuelleAnsicht === "quiz"
            ? "Auswertung"
            : "Quiz";

    datensicherungButton.textContent = "Datensicherung";

    projektinfoButton.textContent = "Projektinfo";

    // Aktuelle Ansicht nicht erneut öffnen
    projektinfoButton.disabled =
        aktuelleAnsicht === "projektinfo";

    const seoBeschreibung =
        document.querySelector(".seo-beschreibung");

    if (seoBeschreibung) {
        seoBeschreibung.classList.toggle(
            "versteckt",
            aktuelleAnsicht === "auswertung" ||
            aktuelleAnsicht === "datensicherung"
        );
    }
}

function zeigeQuiz() {

    document.getElementById("auswertung")
        .classList.add("versteckt");

    document.getElementById("datensicherung")
        .classList.add("versteckt");

    document.getElementById("projektinfo")
        .classList.add("versteckt");

    document.getElementById("quizbereich")
        .classList.remove("versteckt");

    // Rubrik der aktuellen Frage wiederherstellen
    document.getElementById("rubrikAnzeige")
        .textContent = aktuelleFrage
            ? aktuelleFrage.rubrik
            : "";

    aktuelleAnsicht = "quiz";

    aktualisiereNavigation();
}

function navigiereHauptansicht() {

    if (aktuelleAnsicht === "quiz") {
        zeigeAuswertung();
    } else {
        zeigeQuiz();
    }
}

function zeigeProjektinfo() {

    document.getElementById("quizbereich")
        .classList.add("versteckt");

    document.getElementById("auswertung")
        .classList.add("versteckt");

    document.getElementById("datensicherung")
        .classList.add("versteckt");

    document.getElementById("projektinfo")
        .classList.remove("versteckt");

    document.getElementById("rubrikAnzeige")
        .textContent = "Über den Fischtrainer";

    aktuelleAnsicht = "projektinfo";

    aktualisiereNavigation();
}

function zeigeDatensicherung() {

    if (aktuelleAnsicht !== "datensicherung") {
        ansichtVorDatensicherung = aktuelleAnsicht;
    }

    document.getElementById("quizbereich")
        .classList.add("versteckt");

    document.getElementById("auswertung")
        .classList.add("versteckt");

    document.getElementById("projektinfo")
        .classList.add("versteckt");

    document.getElementById("datensicherung")
        .classList.remove("versteckt");

    document.getElementById("rubrikAnzeige")
        .textContent = "Datensicherung";

    aktuelleAnsicht = "datensicherung";

    aktualisiereNavigation();

    leseSicherungsSpeicher();
}


/* ============================================================
   EIGENEN FRAGENKATALOG IMPORTIEREN
============================================================ */

function initialisiereKatalogImport() {

    const dateiInput =
        document.getElementById("katalogDatei");

    const uebernehmenButton =
        document.getElementById("katalogUebernehmenButton");

    const vorschau =
        document.getElementById("katalogVorschau");

    const status =
        document.getElementById("katalogStatus");

    if (
        !dateiInput ||
        !uebernehmenButton ||
        !vorschau ||
        !status
    ) {
        return;
    }

    // Datei auswählen und zunächst nur prüfen.
    dateiInput.addEventListener("change", async () => {

        vorgemerkterKatalog = null;
        uebernehmenButton.disabled = true;
        vorschau.classList.add("versteckt");

        const datei = dateiInput.files[0];

        if (!datei) return;

        try {

            if (!datei.name.toLowerCase().endsWith(".xml")) {
                throw new Error(
                    "Bitte eine XML-Datei auswählen."
                );
            }

            if (datei.size > 5 * 1024 * 1024) {
                throw new Error(
                    "Die XML-Datei darf maximal 5 MB groß sein."
                );
            }

            const xmlText = await datei.text();

            // XML zunächst vollständig prüfen.
            const geladeneFragen =
                parseFragenXML(xmlText);

            // Sicherstellen, dass keine Fragen übersprungen wurden.
            const xml =
                new DOMParser().parseFromString(
                    xmlText,
                    "application/xml"
                );

            const anzahlXML =
                xml.querySelectorAll("frage").length;

            if (geladeneFragen.length !== anzahlXML) {
                throw new Error(
                    "Nicht alle Fragen konnten korrekt eingelesen werden."
                );
            }

            // Doppelte IDs verhindern.
            const ids = geladeneFragen.map(frage => frage.id);

            if (new Set(ids).size !== ids.length) {
                throw new Error(
                    "Der Fragenkatalog enthält doppelte Frage-IDs."
                );
            }

            vorgemerkterKatalog = {
                xmlText,
                fragen: geladeneFragen,
                dateiname: datei.name
            };

            vorschau.textContent =
                `Datei: ${datei.name} – ` +
                `${geladeneFragen.length} Fragen erkannt.`;

            vorschau.classList.remove("versteckt");

            uebernehmenButton.disabled = false;

            status.textContent =
                "XML-Datei erfolgreich geprüft. " +
                "Bitte bestätige die Übernahme.";

        } catch (fehler) {

            vorgemerkterKatalog = null;

            status.textContent =
                "Fehler: " + fehler.message;

        }

    });


    // Erst nach ausdrücklicher Bestätigung übernehmen.
    uebernehmenButton.addEventListener("click", async () => {

        if (!vorgemerkterKatalog) return;

        const bestaetigt = confirm(
            "Möchtest du den eigenen Fragenkatalog wirklich übernehmen?\n\n" +
            "Der bisherige Fragenkatalog wird ersetzt.\n" +
            "Der gespeicherte Lernfortschritt bleibt erhalten, " +
            "soweit Frage-ID und Rubrik übereinstimmen.\n\n" +
            "Der eigene Katalog wird lokal gespeichert und bei " +
            "der nächsten Service-Worker-Aktualisierung entfernt."
        );

        if (!bestaetigt) return;

        uebernehmenButton.disabled = true;

        try {

            if (!("caches" in window)) {
                throw new Error(
                    "Der lokale Cache wird von diesem Browser nicht unterstützt."
                );
            }

            const cache =
                await caches.open(USER_KATALOG_CACHE);

            await cache.put(
                USER_KATALOG_DATEI,
                new Response(
                    vorgemerkterKatalog.xmlText,
                    {
                        headers: {
                            "Content-Type": "application/xml;charset=utf-8"
                        }
                    }
                )
            );

            // Neuen Katalog aktivieren.
            fragen = vorgemerkterKatalog.fragen;

            // Bisherige Lernwerte anhand ID und Rubrik zuordnen.
            ladeLernerfolg();

            // Neuen Fragenpool erstellen.
            erstelleFragenpool();

            eigenerKatalogAktiv = true;

            status.textContent =
                `Eigener Fragenkatalog "${vorgemerkterKatalog.dateiname}" ` +
                `mit ${fragen.length} Fragen wurde übernommen.`;

            // Auswahl zurücksetzen.
            vorgemerkterKatalog = null;
            dateiInput.value = "";
            vorschau.classList.add("versteckt");

            // Zur ersten Frage des neuen Katalogs wechseln.
            document.getElementById("datensicherung")
                .classList.add("versteckt");

            document.getElementById("quizbereich")
                .classList.remove("versteckt");

            zeigeNaechsteFrage();

        } catch (fehler) {

            status.textContent =
                "Der Fragenkatalog konnte nicht gespeichert werden: " +
                fehler.message;

            uebernehmenButton.disabled = false;

        }

    });

}

/* ============================================================
   EVENTS – NUR AUF DER HAUPTSEITE
============================================================ */

if (document.getElementById("quizbereich")) {

    document
        .getElementById("pruefenButton")
        .addEventListener("click", pruefeAntwort);

    document
        .getElementById("naechsteButton")
        .addEventListener("click", zeigeNaechsteFrage);

    document
        .getElementById("navigationButton")
        .addEventListener("click", navigiereHauptansicht);

    document
        .getElementById("projektinfoButton")
        .addEventListener("click", zeigeProjektinfo);

    document
        .getElementById("datensicherungButton")
        .addEventListener("click", zeigeDatensicherung);

    document
        .getElementById("neuerDurchgangButton")
        .addEventListener("click", neuerDurchgang);

    document
        .getElementById("zuruecksetzenButton")
        .addEventListener("click", zuruecksetzen);

    document
        .getElementById("datensicherungZuruecksetzenButton")
        .addEventListener("click", zuruecksetzen);
}

initialisiereKatalogImport();

/* ============================================================
   SCHNITTSTELLE FÜR WAHRSCHEINLICHKEITEN.HTML
============================================================ */

window.fischtrainerDaten = {

    getFragen: function () {
        return fragen;
    },

    berechneGewicht: function (frage) {
        return (
            3 / Math.sqrt(
                1 + 5 * frage.richtig + frage.falsch
            )
            +
            Math.pow(1 + frage.falsch, 2)
            /
            (1 + frage.richtig)
        );
    }

};

/* ============================================================
START
============================================================ */

async function starteApp() {

    try {

        fragen = await ladeFragen();

        const katalogStatus =
            document.getElementById("katalogStatus");

        if (katalogStatus) {

            katalogStatus.textContent =
                eigenerKatalogAktiv
                    ? "Ein eigener Fragenkatalog wird lokal verwendet."
                    : "Der Standardfragenkatalog wird verwendet.";

        }

        ladeLernerfolg();

        // Auf der Statistikseite nur Daten bereitstellen.
        if (!document.getElementById("quizbereich")) {
            return;
        }

        // Ab hier normale Initialisierung des Trainers.

        document.getElementById("appVersion").textContent =
            "Version " + APP_VERSION;

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
