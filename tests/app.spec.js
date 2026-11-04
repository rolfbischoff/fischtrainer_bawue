
const { test, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

const xml = fs.readFileSync(
    path.join(__dirname, "fixtures/test-fragenkatalog.xml"),
    "utf8"
);

async function starteTestApp(page) {

    await page.addInitScript(() => {
        // Deterministische Fragenauswahl für Tests.
        Math.random = () => 0;
    });

    await page.route("**/fragenkatalog.xml", async route => {
        await route.fulfill({
            status: 200,
            contentType: "application/xml",
            body: xml
        });
    });

    await page.goto("/");

    await expect(
        page.locator("#frageText")
    ).toHaveText("Welche Antwort ist richtig?");
}

test.beforeEach(async ({ page }) => {
    page.on("dialog", dialog => dialog.accept());
});

test("SW-01 Anwendung startet", async ({ page }) => {

    await starteTestApp(page);

    await expect(
        page.locator("#quizbereich")
    ).toBeVisible();

    await expect(
        page.locator("#frageText")
    ).not.toBeEmpty();

});

test("SW-02 Einzelantwort wird richtig bewertet", async ({ page }) => {

    await starteTestApp(page);

    await page.locator(
        '#antworten .antwort[data-id="b"]'
    ).click();

    await page.locator("#pruefenButton").click();

    await expect(
        page.locator("#ergebnis")
    ).toContainText("Richtig!");

});

test("SW-03 Falsche Antwort wird erkannt", async ({ page }) => {

    await starteTestApp(page);

    await page.locator(
        '#antworten .antwort[data-id="a"]'
    ).click();

    await page.locator("#pruefenButton").click();

    await expect(
        page.locator("#ergebnis")
    ).toContainText("Falsch!");

    await expect(
        page.locator("#ergebnis")
    ).toContainText("Richtige Antwort");

});

test("SW-04 Mehrfachantwort wird korrekt bewertet", async ({ page }) => {

    await starteTestApp(page);

    await page.locator("#naechsteButton").click();

    await expect(
        page.locator("#frageText")
    ).toHaveText("Welche Antworten sind richtig?");

    await expect(
        page.locator("#mehrfachHinweis")
    ).toBeVisible();

    await page.locator(
        '#antworten .antwort[data-id="a"]'
    ).click();

    await page.locator(
        '#antworten .antwort[data-id="c"]'
    ).click();

    await page.locator("#pruefenButton").click();

    await expect(
        page.locator("#ergebnis")
    ).toContainText("Richtig!");

});

test("SW-05 Unvollständige Mehrfachantwort ist falsch", async ({ page }) => {

    await starteTestApp(page);

    await page.locator("#naechsteButton").click();

    await page.locator(
        '#antworten .antwort[data-id="a"]'
    ).click();

    await page.locator("#pruefenButton").click();

    await expect(
        page.locator("#ergebnis")
    ).toContainText("Falsch!");

});

test("SW-06 Lernerfolg wird gespeichert", async ({ page }) => {

    await starteTestApp(page);

    await page.locator(
        '#antworten .antwort[data-id="b"]'
    ).click();

    await page.locator("#pruefenButton").click();

    const daten = await page.evaluate(() => {

        return JSON.parse(
            localStorage.getItem("fischtrainer_lernerfolg_v1")
        );

    });

    expect(daten.TEST001.richtig).toBe(1);
    expect(daten.TEST001.falsch).toBe(0);

});

test("SW-07 Lernfortschritt bleibt nach Neuladen erhalten", async ({ page }) => {

    await starteTestApp(page);

    await page.locator(
        '#antworten .antwort[data-id="b"]'
    ).click();

    await page.locator("#pruefenButton").click();

    await page.reload();

    await expect(
        page.locator("#frageText")
    ).toHaveText("Welche Antwort ist richtig?");

    const richtig = await page.evaluate(() => {

        const daten = JSON.parse(
            localStorage.getItem("fischtrainer_lernerfolg_v1")
        );

        return daten.TEST001.richtig;

    });

    expect(richtig).toBe(1);

});

test("SW-08 Fragen erscheinen innerhalb eines Durchgangs nicht doppelt", async ({ page }) => {

    await starteTestApp(page);

    const ersteFrage = await page.locator("#frageText").textContent();

    await page.locator(
        '#antworten .antwort[data-id="b"]'
    ).click();

    await page.locator("#pruefenButton").click();
    await page.locator("#naechsteButton").click();

    const zweiteFrage = await page.locator("#frageText").textContent();

    expect(zweiteFrage).not.toBe(ersteFrage);

});

test("SW-09 Fragen mit Lernbedarf erhalten ein höheres Gewicht", async ({ page }) => {

    await starteTestApp(page);

    const gewichte = await page.evaluate(() => {

        const berechne = window.fischtrainerDaten.berechneGewicht;

        return {

            sicher: berechne({
                richtig: 10,
                falsch: 0
            }),

            lernbedarf: berechne({
                richtig: 0,
                falsch: 3
            })

        };

    });

    expect(gewichte.lernbedarf).toBeGreaterThan(
        gewichte.sicher
    );

});
