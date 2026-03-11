export const QrCard = {
    id: "QR",
    defaultSize: "2x1",
    html: `
        <style>
            #qr-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; box-sizing: border-box; padding: 10px; gap: 10px; }
            .qr-left { display: flex; flex-direction: column; width: 100%; gap: 5px; align-items: center; flex-shrink: 0; }
            .qr-label { font-size: clamp(0.7rem, 6cqmin, 1rem); font-weight: bold; color: var(--text-sec); }
            #qr-text { width: 100%; padding: clamp(4px, 4cqmin, 8px); font-size: clamp(0.7rem, 5cqmin, 1rem); border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text-main); outline: none; text-align: center;}
            .qr-canvas-container { flex-grow: 1; display: flex; justify-content: center; align-items: center; min-height: 0; width: 100%; }
            #qr-canvas { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
            
            @container (aspect-ratio > 1.2) {
                #qr-wrapper { flex-direction: row; justify-content: space-around; }
                .qr-left { width: 45%; }
                .qr-canvas-container { width: 45%; height: 100%; }
            }
        </style>
        
        <div id="qr-wrapper">
            <div class="qr-left">
                <div class="qr-label"><i class="fa-solid fa-qrcode"></i> COMPARTIR</div>
                <input id="qr-text" type="text" placeholder="URL o Texto...">
            </div>
            <div class="qr-canvas-container">
                <canvas id="qr-canvas"></canvas>
            </div>
        </div>
    `,
    onInit: (core) => {
        if (!window.QRious) {
            const s = document.createElement('script');
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";
            s.onload = () => initQR();
            document.head.appendChild(s);
        } else { initQR(); }

        function initQR() {
            const initial = localStorage.getItem('pico_qr_def') || 'https://github.com';
            document.getElementById('qr-text').value = initial;
            
            const qr = new QRious({
                element: document.getElementById('qr-canvas'),
                value: initial, size: 200 // Alta resolución, el CSS lo adapta
            });

            document.getElementById('qr-text').oninput = (e) => {
                const txt = e.target.value;
                if(txt) qr.value = txt;
            };
        }
    },
    abrirAjustes: (core) => {
        let u = prompt("Enlace por defecto para el QR:", localStorage.getItem('pico_qr_def') || "");
        if(u) { localStorage.setItem('pico_qr_def', u); core.notificar("Enlace guardado", "🔗"); }
    }
};
