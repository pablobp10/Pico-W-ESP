// 📡 INTERCEPTOR DE RED Y CACHÉ
self.addEventListener('fetch', (event) => {
    // Escudo Anti-CORS
    if (event.request.method !== 'GET' || event.request.url.includes('api.open-meteo.com') || event.request.url.includes('googleapis.com') || event.request.url.includes('esm.run') || !event.request.url.startsWith('http')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
                return caches.open('pico-os-cache-v1').then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        }).catch(() => console.log("Recurso offline:", event.request.url))
    );
});

// 🔔 PUSH NOTIFICATIONS (Mensajes desde el servidor aunque la app esté cerrada)
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : { title: "JARVIS", body: "Mensaje del sistema ciberfísico", icon: "logo-192.png" };
    
    const options = {
        body: data.body,
        icon: data.icon || 'logo-192.png',
        badge: 'logo-192.png',
        vibrate: [100, 50, 100], // Vibra corto, pausa, corto
        data: { url: '/Pico-W-ESP/' }
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Cuando el usuario hace click en la notificación flotante
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow(event.notification.data.url));
});

// 🔄 BACKGROUND SYNC (Para enviar órdenes a la Pico cuando vuelva el internet)
self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-comandos') {
        console.log("[Pico OS] Sincronizando comandos pendientes en segundo plano...");
        // Aquí en el futuro leeremos la base de datos local y enviaremos a la Pico
        event.waitUntil(Promise.resolve());
    }
});

// ⏱️ PERIODIC SYNC (Ej: Actualizar la tarjeta del tiempo cada mañana en silencio)
self.addEventListener('periodicsync', function(event) {
    if (event.tag === 'update-clima') {
        console.log("[Pico OS] Actualizando telemetría meteorológica en silencio...");
        // Listo para implementar el fetch al Open-Meteo
        event.waitUntil(Promise.resolve());
    }
});
