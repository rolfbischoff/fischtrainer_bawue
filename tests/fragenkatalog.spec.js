const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const { XMLParser, XMLValidator } = require("fast-xml-parser");

const datei = fs.readFileSync(
    "fragenkatalog.xml",
    "utf8"
);

test("SW-10 XML ist syntaktisch gültig", async () => {

    expect(XMLValidator.validate(datei)).toBe(true);

});

test("SW-11 Fragenkatalog enthält Fragen", async () => {

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        isArray: (name) => name === "frage" || name === "antwort"
    });

    const daten = parser.parse(datei);

    const fragen = daten.fragenkatalog.frage;

    expect(Array.isArray(fragen)).toBe(true);
    expect(fragen.length).toBeGreaterThan(0);

});

test("SW-12 Jede Frage hat eine eindeutige ID", async () => {

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        isArray: (name) => name === "frage" || name === "antwort"
    });

    const fragen = parser.parse(datei).fragenkatalog.frage;

    const ids = fragen.map(frage => frage.id);

    expect(ids.every(Boolean)).toBe(true);

    expect(new Set(ids).size).toBe(ids.length);

});

test("SW-13 Alle Lösungs-IDs existieren als Antwort-IDs", async () => {

    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "",
        isArray: (name) => name === "frage" || name === "antwort"
    });

    const fragen = parser.parse(datei).fragenkatalog.frage;

    const fehler = [];

    for (const frage of fragen) {

        const antworten = frage.antworten?.antwort || [];

        const antwortIds = antworten.map(
            antwort => antwort.id.toLowerCase()
        );

        const loesungen = String(frage.loesung || "")
            .split(",")
            .map(id => id.trim().toLowerCase())
            .filter(Boolean);

        if (!frage.text || !String(frage.text).trim()) {
            fehler.push(`Frage ${frage.id}: Kein Fragetext`);
        }

        if (antworten.length < 2) {
            fehler.push(`Frage ${frage.id}: Weniger als zwei Antworten`);
        }

        if (new Set(antwortIds).size !== antwortIds.length) {
            fehler.push(`Frage ${frage.id}: Doppelte Antwort-ID`);
        }

        if (loesungen.length === 0) {
            fehler.push(`Frage ${frage.id}: Keine Lösung`);
        }

        if (new Set(loesungen).size !== loesungen.length) {
            fehler.push(`Frage ${frage.id}: Doppelte Lösungs-ID`);
        }

        for (const loesung of loesungen) {

            if (!antwortIds.includes(loesung)) {
                fehler.push(
                    `Frage ${frage.id}: Lösung ${loesung} fehlt`
                );
            }

        }

    }

    expect(
        fehler,
        fehler.join("\n")
    ).toEqual([]);

});
