self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalado y listo para PWA');
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Este evento es obligatorio para que el navegador te considere una App nativa
});

