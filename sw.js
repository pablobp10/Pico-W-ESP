// =========================================================================
// ARCHIVO: sw.js (Service Worker - Escudo de Caché y Offline)
// =========================================================================

// 🛡️ Cambia este número cada vez que modifiques archivos HTML/CSS/JS grandes
const CACHE_NAME = 'pico-os-core-v3';

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando Búnker PWA...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // 🛡️ Autodestrucción de memorias caché contaminadas u obsoletas
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`[Service Worker] Purgando caché obsoleta: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 📡 INTERCEPTOR DE RED
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
        // 1. ESTRATEGIA NETWORK-FIRST 
        fetch(event.request)
            .then((respuestaRed) => {
                if (respuestaRed && respuestaRed.status === 200 && respuestaRed.type === 'basic') {
                    const respuestaClonada = respuestaRed.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, respuestaClonada);
                    });
                }
                return respuestaRed;
            })
            .catch(async () => {
                // 2. MODO OFFLINE (Rescate sin internet + Prevención de pantalla blanca)
                const respuestaCache = await caches.match(event.request);
                if (respuestaCache) return respuestaCache;
                
                if (event.request.mode === 'navigate') {
                    return new Response('<h1 style="color:#ff453a;text-align:center;font-family:sans-serif;margin-top:20vh;background:#000;padding:20px;">[SISTEMA OFFLINE]</h1><p style="text-align:center;color:#fff;">Conexión perdida y caché vacía.</p>', { headers: { 'Content-Type': 'text/html' }});
                }
                return new Response('', { status: 408, statusText: 'Request Timeout' });
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
