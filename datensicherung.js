
"use strict";

const BACKUP_PREFIX = "fischtrainer_lernerfolg_backup_";

let aktuellerDatenbestand = null;

/* ============================================================
   DATEN PRÜFEN
============================================================ */

function pruefeSicherungsdaten(daten) {

    if (
        daten === null ||
        typeof daten !== "object" ||
        Array.isArray(daten)
    ) {
        throw new Error("Ungültiges Datenformat.");
    }

    const ids = Object.keys(daten);

    if (ids.length === 0) {
        throw new Error("Der Datenbestand enthält keine Fragen.");
    }

    let richtig = 0;
    let falsch = 0;

    ids.forEach(id => {

        const eintrag = daten[id];

        if (
            !eintrag ||
            typeof eintrag !== "object" ||
            Array.isArray(eintrag)
        ) {
            throw new Error("Ungültiger Eintrag bei Frage " + id);
        }

        if (
            !Number.isInteger(eintrag.richtig) ||
            eintrag.richtig < 0 ||
            !Number.isInteger(eintrag.falsch) ||
            eintrag.falsch < 0
        ) {
            throw new Error(
                "Ungültige Antwortzahlen bei Frage " + id
            );
        }

        if (
            eintrag.rubrik !== undefined &&
            typeof eintrag.rubrik !== "string"
        ) {
            throw new Error("Ungültige Rubrik bei Frage " + id);
        }

        richtig += eintrag.richtig;
        falsch += eintrag.falsch;
    });

    return {
        anzahl: ids.length,
        richtig,
        falsch,
        gesamt: richtig + falsch
    };
}


/* ============================================================
   STATUSANZEIGE
============================================================ */

function zeigeSicherungsstatus(text, typ = "") {

    const element = document.getElementById("status");

    element.textContent = text;
    element.className = "status " + typ;
}


/* ============================================================
   SPEICHER PRÜFEN
============================================================ */

function leseSicherungsSpeicher() {

    try {

        const roh = localStorage.getItem(SPEICHER_SCHLUESSEL);

        aktuellerDatenbestand = roh;

        if (roh === null) {

            zeigeSicherungsstatus(
                "Kein gespeicherter Lernerfolg vorhanden.",
                "fehler"
            );

            document.getElementById("speicherInfo").textContent =
                "Der Speicher ist derzeit leer.";

            zeigeLokaleBackups();
            return;
        }

        const daten = JSON.parse(roh);
        const statistik = pruefeSicherungsdaten(daten);

        zeigeSicherungsstatus(
            "Gespeicherte Trainingsdaten gefunden und geprüft.",
            "erfolg"
        );

        const info = document.getElementById("speicherInfo");
        info.replaceChildren();

        const werte = [
            ["Gespeicherte Fragen", statistik.anzahl],
            ["Richtige Antworten", statistik.richtig],
            ["Falsche Antworten", statistik.falsch],
            ["Gesamtzahl der Antworten", statistik.gesamt]
        ];

        werte.forEach(([name, wert]) => {

            const zeile = document.createElement("div");
            zeile.className = "kennzahl";

            const stark = document.createElement("strong");
            stark.textContent = name + ": ";

            zeile.append(
                stark,
                document.createTextNode(wert)
            );

            info.appendChild(zeile);
        });

    } catch (fehler) {

        aktuellerDatenbestand = null;

        zeigeSicherungsstatus(
            "Fehler beim Lesen: " + fehler.message,
            "fehler"
        );
    }

    zeigeLokaleBackups();
}


/* ============================================================
   DATEI HERUNTERLADEN
============================================================ */

function ladeSicherungsdateiHerunter(inhalt, dateiname) {

    const blob = new Blob(
        [inhalt],
        { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = dateiname;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}


/* ============================================================
   EXPORT
============================================================ */

function exportiereLernerfolg() {

    try {

        const roh = localStorage.getItem(SPEICHER_SCHLUESSEL);

        if (roh === null) {
            alert("Es wurden keine Trainingsdaten gefunden.");
            return;
        }

        pruefeSicherungsdaten(JSON.parse(roh));

        ladeSicherungsdateiHerunter(
            roh,
            "fischtrainer_lernerfolg_" +
            new Date().toISOString().slice(0, 10) +
            ".json"
        );

        zeigeSicherungsstatus(
            "Export erfolgreich. Die Trainingsdaten wurden heruntergeladen.",
            "erfolg"
        );

    } catch (fehler) {

        alert("Export nicht möglich: " + fehler.message);
    }
}


/* ============================================================
   IMPORT
============================================================ */

async function importiereLernerfolg() {

    const datei = document.getElementById("importDatei").files[0];

    if (!datei) {
        alert("Bitte zuerst eine JSON-Datei auswählen.");
        return;
    }

    try {

        const text = await datei.text();
        const neueDaten = JSON.parse(text);

        const statistik = pruefeSicherungsdaten(neueDaten);

        const bestaetigt = confirm(
            "Die Datei enthält " +
            statistik.anzahl +
            " Fragen und " +
            statistik.gesamt +
            " Antworten.\n\n" +
            "Der bisherige Lernerfolg wird ersetzt.\n" +
            "Vorher wird eine lokale Sicherheitskopie angelegt.\n\n" +
            "Möchtest du fortfahren?"
        );

        if (!bestaetigt) return;

        const bisher = localStorage.getItem(SPEICHER_SCHLUESSEL);

        // Erst den bisherigen Datenbestand sichern.
        if (bisher !== null) {

            const backupName =
                BACKUP_PREFIX +
                new Date().toISOString().replace(/[:.]/g, "-");

            localStorage.setItem(backupName, bisher);
        }

        // Erst nach erfolgreicher Sicherung überschreiben.
        localStorage.setItem(
            SPEICHER_SCHLUESSEL,
            JSON.stringify(neueDaten)
        );

        alert(
            "Der Lernerfolg wurde erfolgreich wiederhergestellt.\n\n" +
            "Die Anwendung wird jetzt neu geladen."
        );

        location.reload();

    } catch (fehler) {

        alert(
            "Import fehlgeschlagen:\n" +
            fehler.message +
            "\n\nDer bisherige Lernerfolg wurde nicht absichtlich verändert."
        );
    }
}


/* ============================================================
   LOKALE SICHERUNGEN ANZEIGEN
============================================================ */

function zeigeLokaleBackups() {

    const container = document.getElementById("backupInfo");

    container.replaceChildren();

    const keys = [];

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (key && key.startsWith(BACKUP_PREFIX)) {
            keys.push(key);
        }
    }

    keys.sort().reverse();

    const button = document.getElementById("backupButton");

    if (keys.length === 0) {

        container.textContent =
            "Noch keine lokalen Sicherungen vorhanden.";

        button.disabled = true;
        return;
    }

    button.disabled = false;

    const info = document.createElement("p");

    info.textContent =
        "Vorhandene Sicherungen: " + keys.length;

    container.appendChild(info);

    const details = document.createElement("p");

    details.textContent =
        "Neueste Sicherung: " +
        keys[0].replace(BACKUP_PREFIX, "");

    container.appendChild(details);
}


/* ============================================================
   LETZTE SICHERUNG EXPORTIEREN
============================================================ */

function exportiereLetzteSicherung() {

    const keys = [];

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (key && key.startsWith(BACKUP_PREFIX)) {
            keys.push(key);
        }
    }

    keys.sort().reverse();

    if (keys.length === 0) {
        alert("Keine Sicherung vorhanden.");
        return;
    }

    const inhalt = localStorage.getItem(keys[0]);

    if (inhalt === null) {
        alert("Die Sicherung konnte nicht gelesen werden.");
        return;
    }

    ladeSicherungsdateiHerunter(
        inhalt,
        "fischtrainer_backup.json"
    );
}


/* ============================================================
   EVENTS
============================================================ */

function initialisiereDatensicherung() {

    if (!document.getElementById("datensicherung")) return;

    document.getElementById("neuPruefen")
        .addEventListener("click", leseSicherungsSpeicher);

    document.getElementById("exportButton")
        .addEventListener("click", exportiereLernerfolg);

    document.getElementById("importButton")
        .addEventListener("click", importiereLernerfolg);

    document.getElementById("backupButton")
        .addEventListener("click", exportiereLetzteSicherung);

    leseSicherungsSpeicher();
}
