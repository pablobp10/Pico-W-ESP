export const QrCard = {
    id: "QR",
    defaultSize: "2x1",
    html: `
        <style>
            #qr-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; }
            .qr-left { display: flex; flex-direction: column; width: 100%; gap: 2cqmin; align-items: center; }
            .qr-label { font-size: clamp(0.7rem, 6cqmin, 1.2rem); font-weight: bold; color: var(--text-sec); }
            #qr-text { width: 100%; padding: clamp(6px, 4cqmin, 12px); font-size: clamp(0.8rem, 5cqmin, 1.2rem); border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text-main); outline: none; }
            #btn-gen-qr { width: 100%; margin: 0; font-size: clamp(0.7rem, 5cqmin, 1.2rem); padding: clamp(6px, 4cqmin, 12px); }
            #qr-canvas { max-width: 100px; border-radius: 8px; margin-top: 10px; }
            
            @container (aspect-ratio > 1.2) {
                #qr-wrapper { flex-direction: row; justify-content: space-around; }
                .qr-left { width: 50%; align-items: flex-start; }
                #qr-canvas { max-width: 40cqw; margin-top: 0; }
            }
        </style>
        
        <div id="qr-wrapper">
            <div class="qr-left">
                <div class="qr-label"><i class="fa-solid fa-qrcode"></i> COMPARTIR</div>
                <input id="qr-text" type="text" placeholder="URL o Texto...">
                <button id="btn-gen-qr" class="btn-action">GENERAR</button>
            </div>
            <canvas id="qr-canvas"></canvas>
        </div>
    `,
    onInit: (core) => {
        if (!window.QRious) {
            const s = document.createElement('script');
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";
            s.onload = () => initQR();
            document.head.appendChild(s);
        } else {
            initQR();
        }

        function initQR() {
            const initial = localStorage.getItem('pico_qr_def') || 'https://github.com';
            document.getElementById('qr-text').value = initial;
            
            const qr = new QRious({
                element: document.getElementById('qr-canvas'),
                value: initial, size: 150
            });

            document.getElementById('btn-gen-qr').onclick = () => {
                const txt = document.getElementById('qr-text').value;
                if(txt) qr.value = txt;
            };
        }
    },
    onData: (val) => {},
    abrirAjustes: (core) => {
        let u = prompt("Enlace o texto por defecto para el QR:", localStorage.getItem('pico_qr_def') || "");
        if(u) { localStorage.setItem('pico_qr_def', u); core.notificar("Enlace guardado", "🔗"); }
    }
};
