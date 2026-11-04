const { test, expect } = require("@playwright/test");

test("PWA-01 Manifest ist erreichbar und gültig", async ({ page }) => {

    const response = await page.request.get("/manifest.json");

    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();

    expect(manifest.name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();

    expect(manifest.icons.length).toBeGreaterThan(0);

});

test("PWA-02 Service Worker wird registriert", async ({ page }) => {

    await page.goto("/");

    await expect.poll(async () => {

        return page.evaluate(async () => {

            if (!("serviceWorker" in navigator)) {
                return false;
            }

            const registration =
                await navigator.serviceWorker.getRegistration();

            return Boolean(
                registration && registration.active
            );

        });

    }).toBe(true);

});

test("PWA-03 Fragenkatalog wird lokal gecacht", async ({ page }) => {

    await page.goto("/");

    await expect(
        page.locator("#frageText")
    ).not.toBeEmpty();

    await expect.poll(async () => {

        return page.evaluate(async () => {

            const url = new URL(
                "fragenkatalog.xml",
                location.href
            ).href;

            return Boolean(await caches.match(url));

        });

    }).toBe(true);

});

test("PWA-04 Anwendung funktioniert offline @offline", async ({ page, context }) => {

    await page.goto("/");

    await expect(
        page.locator("#frageText")
    ).not.toBeEmpty();

    await page.evaluate(async () => {

        await navigator.serviceWorker.ready;

    });

    await expect.poll(async () => {

        return page.evaluate(async () => {

            const url = new URL(
                "fragenkatalog.xml",
                location.href
            ).href;

            return Boolean(await caches.match(url));

        });

    }).toBe(true);

    // Internetverbindung simuliert abschalten.
    await context.setOffline(true);

    await page.reload();

    await expect(
        page.locator("#frageText")
    ).not.toBeEmpty();

    await expect(
        page.locator("#fehlerbereich")
    ).toBeHidden();

});
