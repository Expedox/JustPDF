// Service Worker: legt beim ersten Besuch alle Dateien ab. Danach kommt alles aus dem Cache,
// es gibt keine Anfragen mehr ins Netz (auch nicht im Flugmodus).
const VERSION = '569d7b3f2499';
const PRECACHE = ["./","assets/__vite-browser-external-Ds2wyR1P.js","assets/engine.worker-Cjnh1tBW.js","assets/index-C8kO7_wZ.js","assets/index-Dg2ktHYv.css","assets/libheif-bundle-Dgvdwf2f.js","assets/mupdf-wasm-Bvf0xebB.wasm","assets/rolldown-runtime-FCrsKEuO.js","datenschutz.html","icons/apple-touch-icon.png","icons/favicon.svg","icons/icon-192.png","icons/icon-512.png","icons/icon.svg","index.html","manifest.webmanifest","vendor/tesseract/lang-fast/deu.traineddata.gz","vendor/tesseract/lang-fast/eng.traineddata.gz","vendor/tesseract/lang/deu.traineddata.gz","vendor/tesseract/lang/eng.traineddata.gz","vendor/tesseract/worker.min.js"];
const CORES = ["vendor/tesseract/core/tesseract-core-lstm.wasm.js","vendor/tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js","vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js"]; // Varianten des OCR-Kerns, nur die passende wird geladen
const CACHE = `justpdf-${VERSION}`;

// Gleiche Auswahl wie tesseract.js: Relaxed-SIMD, sonst SIMD, sonst einfache Variante
const simd = () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]));
const relaxed = () => WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 15, 1, 13, 0, 65, 1, 253, 15, 65, 2, 253, 15, 253, 128, 2, 11]));

function coreFile() {
  const want = relaxed() ? 'relaxedsimd-lstm' : simd() ? 'simd-lstm' : 'lstm';
  return CORES.find((f) => f.endsWith(`tesseract-core-${want}.wasm.js`));
}

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([...PRECACHE, coreFile()].filter(Boolean))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('justpdf-') && k !== CACHE).map((k) => caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (req.mode === 'navigate') return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./')) || fetch(req);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  })());
});
