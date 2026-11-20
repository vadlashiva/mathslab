/* MathsLab service worker: lets the installed app open and solve without internet.
   Pages and scripts are fetched fresh when online (so updates show up) and served from the cache when offline.
   The AI photo reader (api/) is never cached. */
const CACHE = "mathslab-v1";
const SHELL = [
  "./", "index.html", "manifest.webmanifest", "css/style.css",
  "vendor/math.js", "vendor/nerdamer.js", "vendor/katex/katex.min.js", "vendor/katex/katex.min.css",
  "js/core.js", "js/chapters/part1.js", "js/chapters/calculus1.js", "js/chapters/calculus2.js",
  "js/chapters/vectors3d.js", "js/chapters/lpp-prob.js", "js/ask.js", "js/photo.js", "js/app.js",
  "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match("index.html")))
  );
});
