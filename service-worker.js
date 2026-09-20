"use strict";

const CACHE_NAME = "mc-trainer-test-v1";

self.addEventListener("install", event => {

console.log("Service Worker: INSTALL");

event.waitUntil(
    self.skipWaiting()
);

});

self.addEventListener("activate", event => {

console.log("Service Worker: ACTIVATE");

event.waitUntil(
    self.clients.claim()
);

});

self.addEventListener("fetch", event => {

event.respondWith(
    fetch(event.request)
);

});
