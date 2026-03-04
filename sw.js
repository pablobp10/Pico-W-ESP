self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalado y listo para PWA');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        // 1. ESTRATEGIA NETWORK-FIRST (Red Primero)
        fetch(event.request)
            .then((respuestaRed) => {
                // Si hay internet y la respuesta es válida, actualizamos el búnker silenciosamente
                if (respuestaRed && respuestaRed.status === 200 && respuestaRed.type === 'basic') {
                    const respuestaClonada = respuestaRed.clone();
                    caches.open('pico-os-auto-cache').then((cache) => {
                        cache.put(event.request, respuestaClonada);
                    });
                }
                // Entregamos el archivo fresco al usuario
                return respuestaRed;
            })
            .catch(() => {
                // 2. MODO OFFLINE (Rescate)
                // Si no hay internet o la red falla, tiramos de la memoria caché
                return caches.match(event.request);
            })
    );
});

