/* sw.js — Tournée service worker.
   - App shell: network first (so updates arrive), cached copy when offline.
   - Map tiles (IGN, CARTO) and libraries: cache first, kept across app updates.
   - Routing and address lookups: always live, never cached. */
"use strict";

const VERSION = "tournee-2026-10-20";
const SHELL_CACHE = `${VERSION}-shell`;
const TILE_CACHE = "tournee-tiles-v1";
const LIB_CACHE = "tournee-libs-v1";
const MAX_TILES = 12000;
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./lib/xlsx.full.min.js"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, TILE_CACHE, LIB_CACHE]);
    for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

const isTile = (url) => (url.hostname === "data.geopf.fr" && url.pathname.startsWith("/wmts")) || url.hostname.endsWith("basemaps.cartocdn.com");
const isLib = (url) => url.hostname === "cdn.jsdelivr.net";

let putsSinceTrim = 0;
async function trimTiles() {
  const cache = await caches.open(TILE_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_TILES) for (const req of keys.slice(0, keys.length - MAX_TILES + 500)) await cache.delete(req);
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    cache.put(request, response.clone());
    if (cacheName === TILE_CACHE && ++putsSinceTrim > 400) { putsSinceTrim = 0; trimTiles(); }
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    // Weak signal on the bike: give the network 4 s, then use the saved copy.
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("slow network")), 4000)),
    ]);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return (await cache.match(request, { ignoreSearch: true })) || (await cache.match("./index.html")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (isTile(url)) { event.respondWith(cacheFirst(request, TILE_CACHE).catch(() => Response.error())); return; }
  if (isLib(url)) { event.respondWith(cacheFirst(request, LIB_CACHE)); return; }
  if (url.origin === self.location.origin) {
    if (request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html")) event.respondWith(networkFirst(request));
    else event.respondWith(cacheFirst(request, SHELL_CACHE));
  }
});
