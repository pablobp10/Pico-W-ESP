 export const QrCard = {
    id: "QR",
    size: "wide", // Mejor ancho para ver input + QR
    html: `
        <div style="display:flex; align-items:center; justify-content:space-around; height:100%; width:100%">
            
            <div style="display:flex; flex-direction:column; width:50%; gap:5px">
                <div class="label" style="text-align:left"><i class="fa-solid fa-qrcode"></i> COMPARTIR</div>
                <input id="qr-text" type="text" placeholder="Escribe texto o URL..." 
                    style="width:100%; padding:8px; border:1px solid var(--border); border-radius:8px;">
                <button id="btn-gen-qr" class="btn-action" style="margin:0; font-size:0.8rem">GENERAR</button>
            </div>

            <canvas id="qr-canvas"></canvas>
        </div>
    `,
    onInit: (core) => {
        // Cargar librería
        if (!window.QRious) {
            const s = document.createElement('script');
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js";
            s.onload = () => initQR();
            document.head.appendChild(s);
        } else {
            initQR();
        }

        function initQR() {
            const qr = new QRious({
                element: document.getElementById('qr-canvas'),
                value: 'https://github.com', // Valor inicial
                size: 100
            });

            document.getElementById('btn-gen-qr').onclick = () => {
                const txt = document.getElementById('qr-text').value;
                if(txt) qr.value = txt;
            };
        }
    },
    onData: (val) => {}
};

