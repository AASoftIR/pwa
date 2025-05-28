const CACHE_NAME = "pwa-notes-cache-v1.2"; // Incremented version
const OFFLINE_URL = "offline.html";
const ASSETS_TO_CACHE = [
	"/",
	"/index.html",
	"/manifest.json",
	"/src/styles.css",
	"/src/app.js",
	"/assets/icons/icon-192.png",
	"/assets/icons/icon-512.png",
	OFFLINE_URL, // Ensure offline.html is cached
];

// Install event: Cache core assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log("Opened cache: " + CACHE_NAME);
				// Add all assets to cache, including the offline page
				return cache.addAll(ASSETS_TO_CACHE);
			})
			.then(() => self.skipWaiting()) // Activate new SW immediately
			.catch((error) => {
				console.error("Cache addAll failed:", error);
			})
	);
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (cacheName !== CACHE_NAME) {
							console.log("Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => self.clients.claim()) // Take control of uncontrolled clients
	);
});

// Fetch event: Serve cached assets or fetch from network
self.addEventListener("fetch", (event) => {
	// We only want to call event.respondWith() if this is a navigation request
	// for an HTML page.
	if (event.request.mode === "navigate") {
		event.respondWith(
			(async () => {
				try {
					// First, try to use the navigation preload response if it's supported.
					const preloadResponse = await event.preloadResponse;
					if (preloadResponse) {
						return preloadResponse;
					}

					const networkResponse = await fetch(event.request);
					return networkResponse;
				} catch (error) {
					// catch is only triggered if an exception is thrown, which implies the network failed.
					// If fetch() returns a valid HTTP response with a 4xx or 5xx status, the catch() isn't called.
					console.log("Fetch failed; returning offline page instead.", error);

					const cache = await caches.open(CACHE_NAME);
					const cachedResponse = await cache.match(OFFLINE_URL);
					return cachedResponse;
				}
			})()
		);
	} else if (
		ASSETS_TO_CACHE.includes(new URL(event.request.url).pathname) ||
		event.request.destination === "font"
	) {
		// For assets (CSS, JS, images, fonts) try cache first, then network, then cache update.
		event.respondWith(
			caches.match(event.request).then((cachedResponse) => {
				// Return cached response if found
				if (cachedResponse) {
					return cachedResponse;
				}
				// Else, fetch from network, cache it, and return network response
				return fetch(event.request)
					.then((networkResponse) => {
						// Check if we received a valid response
						if (
							!networkResponse ||
							networkResponse.status !== 200 ||
							(networkResponse.type !== "basic" &&
								networkResponse.type !== "cors")
						) {
							return networkResponse;
						}
						const responseToCache = networkResponse.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseToCache);
						});
						return networkResponse;
					})
					.catch((error) => {
						console.log("Fetch failed for asset:", event.request.url, error);
						// Optionally, return a placeholder for images/fonts if they fail and are not in cache
					});
			})
		);
	}
	// For other requests, just fetch from network (e.g., API calls if any)
});
