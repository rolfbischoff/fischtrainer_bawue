"use strict";

const CACHE_NAME = "mc-trainer-v1";

const DATEIEN = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json",
    "./fragenkatalog.xml",
    "./icon-192.png",
    "./icon-512.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(DATEIEN))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then(response => {

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === "basic"
                        ) {
                            const kopie = response.clone();

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
