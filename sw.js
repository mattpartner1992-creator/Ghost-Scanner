self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("spirit-hunter").then((cache) =>
      cache.addAll([
        "index.html",
        "collection.html",
        "shop.html",
        "style.css",
        "script.js",
        "manifest.json",
        "icon-192.png",
        "icon-512.png"
      ])
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
