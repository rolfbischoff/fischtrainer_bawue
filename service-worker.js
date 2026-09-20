"use strict";

const CACHE_NAME = "mc-trainer-v2";

const DATEIEN = [
"./",
"./index.html",
"./style.css",
"./app.js",
"./manifest.json",
"./icon-192.png",
"./icon-512.png"
];

/* ============================================================
INSTALLATION
============================================================ */

self.addEventListener("install", event => {

event.waitUntil(

    caches.open(CACHE_NAME)
        .then(async cache => {

            /*
             * Jede Datei wird einzeln geladen.
             * Wenn eine Datei fehlt, verhindert das nicht
             * die komplette Installation des Service Workers.
             */

            for (const datei of DATEIEN) {

                try {

                    const response =
                        await fetch(datei);

                    if (response.ok) {

                        await cache.put(
                            datei,
                            response
                        );

                    } else {

                        console.warn(
                            "Konnte Datei nicht cachen:",
                            datei,
                            response.status
                        );
                    }

                } catch (error) {

                    console.warn(
                        "Fehler beim Cachen:",
                        datei,
                        error
                    );
                }
            }

        })
        .then(() => self.skipWaiting())
);

});

/* ============================================================
AKTIVIERUNG
============================================================ */

self.addEventListener("activate", event => {

event.waitUntil(

    caches.keys()
        .then(keys => {

            return Promise.all(

                keys
                    .filter(
                        key => key !== CACHE_NAME
                    )
                    .map(
                        key => caches.delete(key)
                    )

            );

        })
        .then(() => self.clients.claim())
);

});

/* ============================================================
FETCH
============================================================ */

self.addEventListener("fetch", event => {

event.respondWith(

    caches.match(event.request)
        .then(cachedResponse => {

            /*
             * Ist die Datei bereits im Cache,
             * verwenden wir die Offline-Version.
             */

            if (cachedResponse) {
                return cachedResponse;
            }


            /*
             * Ansonsten normal aus dem Internet laden.
             */

            return fetch(event.request)
                .then(response => {

                    /*
                     * Erfolgreiche Antworten werden
                     * zusätzlich für den Offline-Betrieb
                     * gespeichert.
                     */

                    if (
                        response &&
                        response.status === 200 &&
                        response.type === "basic"
                    ) {

                        const kopie =
                            response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    kopie
                                );

                            });
                    }

                    return response;
                });

        })

);

});
