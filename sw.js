self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalado y listo para PWA');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 📡 INTERCEPTOR DE RED (Fusión: Tu Network-First + Mi Escudo Anti-CORS)
self.addEventListener('fetch', (event) => {
    // 🛡️ ESCUDO ANTI-CORS Y BYPASS DINÁMICO
    if (
        event.request.method !== 'GET' || 
        event.request.url.includes('api.open-meteo.com') || 
        event.request.url.includes('googleapis.com') || 
        event.request.url.includes('esm.run') || 
        event.request.url.includes('registry.npmjs.org') || // <-- Bypass API de versiones
        event.request.url.includes('?v=') ||                // <-- Bypass cache buster
        !event.request.url.startsWith('http')
    ) {
        return; // Dejamos que el navegador gestione esto sin cachear
    }

    event.respondWith(
        // 1. ESTRATEGIA NETWORK-FIRST (Tu código exacto)
        fetch(event.request)
            .then((respuestaRed) => {
                if (respuestaRed && respuestaRed.status === 200 && respuestaRed.type === 'basic') {
                    const respuestaClonada = respuestaRed.clone();
                    caches.open('pico-os-auto-cache').then((cache) => {
                        cache.put(event.request, respuestaClonada);
                    });
                }
                return respuestaRed;
            })
            .catch(() => {
                // 2. MODO OFFLINE (Rescate sin internet)
                return caches.match(event.request);
            })
    );
});

// =========================================================================
// 🚀 SUPERPODERES PWABUILDER (Play Store Ready)
// =========================================================================

// 🔔 PUSH NOTIFICATIONS
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : { title: "Pico OS", body: "Notificación del sistema", icon: "logo-192.png" };
    const options = {
        body: data.body,
        icon: data.icon || 'logo-192.png',
        badge: 'logo-192.png',
        vibrate: [100, 50, 100],
        data: { url: '/Pico-W-ESP/' }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});

// 🔄 BACKGROUND SYNC 
self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-comandos') {
        console.log("[Pico OS] Ejecutando sincronización en segundo plano...");
        event.waitUntil(Promise.resolve());
    }
});

// ⏱️ PERIODIC SYNC 
self.addEventListener('periodicsync', function(event) {
    if (event.tag === 'update-clima') {
        console.log("[Pico OS] Sincronización periódica activada...");
        event.waitUntil(Promise.resolve());
    }
});
