
const { test, expect } = require("@playwright/test");

test("RESP-01 Anwendung ist sichtbar", async ({ page }) => {

    await page.goto("/");

    await expect(
        page.locator("h1")
    ).toContainText("Fischtrainer");

    await expect(
        page.locator("#frageText")
    ).not.toBeEmpty();

});

test("RESP-02 Kein horizontaler Seitenüberlauf", async ({ page }) => {

    await page.goto("/");

    const werte = await page.evaluate(() => ({

        breite: document.documentElement.clientWidth,

        scrollBreite: document.documentElement.scrollWidth

    }));

    expect(
        werte.scrollBreite
    ).toBeLessThanOrEqual(werte.breite + 1);

});

test("RESP-03 Antwortbuttons sind bedienbar", async ({ page }) => {

    await page.goto("/");

    const antworten = page.locator("#antworten .antwort");

    await expect(antworten.first()).toBeVisible();

    await antworten.first().click();

    await expect(
        antworten.first()
    ).toHaveClass(/ausgewaehlt/);

});

test("RESP-04 Navigation ist sichtbar", async ({ page }) => {

    await page.goto("/");

    await expect(
        page.locator("#navigationButton")
    ).toBeVisible();

    await expect(
        page.locator("#datensicherungButton")
    ).toBeVisible();

    await expect(
        page.locator("#projektinfoButton")
    ).toBeVisible();

});
