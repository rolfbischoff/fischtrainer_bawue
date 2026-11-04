
const { test, expect } = require("@playwright/test");

const SCHLUESSEL = "fischtrainer_lernerfolg_v1";

async function oeffneDatensicherung(page) {

    await page.goto("/");

    await expect(
        page.locator("#frageText")
    ).not.toBeEmpty();

    await page.locator("#datensicherungButton").click();

    await expect(
        page.locator("#datensicherung")
    ).toBeVisible();

}

test("SW-14 Lernerfolg kann exportiert werden", async ({ page }) => {

    await page.addInitScript((key) => {

        localStorage.setItem(key, JSON.stringify({
            "1": {
                rubrik: "Test",
                richtig: 5,
                falsch: 2
            }
        }));

    }, SCHLUESSEL);

    await oeffneDatensicherung(page);

    const downloadPromise = page.waitForEvent("download");

    await page.locator("#exportButton").click();

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
        /^fischtrainer_lernerfolg_.*\.json$/
    );

});

test("SW-15 Gültiger Import funktioniert", async ({ page }) => {

    await page.addInitScript((key) => {

        localStorage.setItem(key, JSON.stringify({
            "1": {
                rubrik: "Test",
                richtig: 2,
                falsch: 1
            }
        }));

    }, SCHLUESSEL);

    await oeffneDatensicherung(page);

    page.on("dialog", dialog => dialog.accept());

    await page.locator("#importDatei").setInputFiles({

        name: "sicherung.json",

        mimeType: "application/json",

        buffer: Buffer.from(JSON.stringify({
            "1": {
                rubrik: "Test",
                richtig: 10,
                falsch: 3
            }
        }))

    });

    await page.locator("#importButton").click();

    await expect.poll(async () => {

        return page.evaluate(key => {

            const daten = JSON.parse(
                localStorage.getItem(key)
            );

            return daten["1"].richtig;

        }, SCHLUESSEL);

    }).toBe(10);

});

test("SW-16 Ungültiger Import verändert den Bestand nicht", async ({ page }) => {

    await page.addInitScript((key) => {

        localStorage.setItem(key, JSON.stringify({
            "1": {
                rubrik: "Test",
                richtig: 5,
                falsch: 2
            }
        }));

    }, SCHLUESSEL);

    await oeffneDatensicherung(page);

    await page.locator("#importDatei").setInputFiles({

        name: "fehlerhaft.json",

        mimeType: "application/json",

        buffer: Buffer.from('{"fehler": true}')

    });

    const dialogPromise = page.waitForEvent("dialog");

    await page.locator("#importButton").click();

    const dialog = await dialogPromise;

    await dialog.accept();

    const richtig = await page.evaluate(key => {

        return JSON.parse(
            localStorage.getItem(key)
        )["1"].richtig;

    }, SCHLUESSEL);

    expect(richtig).toBe(5);

});

test("SW-17 Import legt vorher eine Sicherheitskopie an", async ({ page }) => {

    await page.addInitScript((key) => {

        localStorage.setItem(key, JSON.stringify({
            "1": {
                rubrik: "Test",
                richtig: 5,
                falsch: 2
            }
        }));

    }, SCHLUESSEL);

    await oeffneDatensicherung(page);

    page.on("dialog", dialog => dialog.accept());

    await page.locator("#importDatei").setInputFiles({

        name: "sicherung.json",

        mimeType: "application/json",

        buffer: Buffer.from(JSON.stringify({
            "1": {
                rubrik: "Test",
                richtig: 10,
                falsch: 0
            }
        }))

    });

    await page.locator("#importButton").click();

    await expect.poll(async () => {

        return page.evaluate(() => {

            return Object.keys(localStorage).filter(
                key => key.startsWith(
                    "fischtrainer_lernerfolg_backup_"
                )
            ).length;

        });

    }).toBe(1);

});
