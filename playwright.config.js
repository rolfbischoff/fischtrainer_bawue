const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({

    testDir: "./tests",

    fullyParallel: true,

    forbidOnly: !!process.env.CI,

    retries: process.env.CI ? 2 : 0,

    workers: process.env.CI ? 2 : undefined,

    reporter: [
        ["list"],
        ["html", {
            outputFolder: "playwright-report",
            open: "never"
        }],
        ["junit", {
            outputFile: "test-results/results.xml"
        }]
    ],

    timeout: 30000,

    expect: {
        timeout: 10000
    },

    use: {
        baseURL: "http://127.0.0.1:4173",

        trace: "retain-on-failure",

        screenshot: "only-on-failure",

        video: "retain-on-failure",

        ignoreHTTPSErrors: true
    },

    projects: [

        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"]
            }
        },

        {
            name: "firefox",
            use: {
                ...devices["Desktop Firefox"]
            }
        },

        {
            name: "webkit",
            use: {
                ...devices["Desktop Safari"]
            }
        },

        {
            name: "mobile-chrome",
            use: {
                ...devices["Pixel 7"]
            }
        },

        {
            name: "mobile-safari",
            use: {
                ...devices["iPhone 13"]
            }
        },

        {
            name: "tablet",
            use: {
                ...devices["iPad (gen 7)"]
            }
        }
    ],

    webServer: {
        command:
            "npx http-server . -p 4173 -c-1 --silent",

        url: "http://127.0.0.1:4173",

        reuseExistingServer: !process.env.CI,

        timeout: 30000
    }

});
