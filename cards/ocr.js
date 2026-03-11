export const OCRCard = {
    id: "OjoCiber",
    category: "seguridad",
    defaultSize: "2x2",
    customAccion: {
        titulo: "Forzar Escaneo",
        icono: "fa-solid fa-camera-rotate",
        color: "#32d74b",
        ejecutar: (core) => {
            core.cmd('OjoCiber', 'SCAN');
            core.notificar("Petición de captura enviada al nodo...", "📸");
            const txt = document.getElementById('ocr-text');
            txt.innerText = "ESCANEANDO";
            txt.classList.add('scanning');
        }
    },
    html: `
        <style>
            #ocr-wrapper { display:flex; flex-direction:column; height:100%; width:100%; padding:10px; box-sizing:border-box; align-items:center; justify-content:space-between; }
            .ocr-header { font-size:clamp(0.6rem, 8cqmin, 0.9rem); font-weight:800; color:var(--text-sec); text-transform:uppercase; align-self:flex-start; width:100%; display:flex; justify-content:space-between;}
            .ocr-display { display:flex; flex-direction:column; align-items:center; justify-content:center; flex-grow:1; width:100%; background:rgba(0,255,0,0.05); border: 2px dashed #15803d; border-radius:12px; margin-top:10px; position:relative; overflow:hidden;}
            .ocr-text { font-family: 'Courier New', monospace; font-size:clamp(1.5rem, 15cqmin, 4rem); font-weight:900; color:#32d74b; letter-spacing:2px; z-index:2; text-shadow: 0 0 10px rgba(50,215,75,0.8); transition: 0.2s;}
            .ocr-text.scanning { font-size:clamp(1rem, 10cqmin, 2rem); color: #facc15; text-shadow: none; animation: pulse 1s infinite;}
            
            .ocr-scanline { position:absolute; top:0; left:0; width:100%; height:4px; background:#32d74b; box-shadow:0 0 15px #32d74b; animation: scan 2s infinite linear; opacity:0.6; }
            .ocr-corner { position: absolute; width: 15px; height: 15px; border: 3px solid #32d74b; z-index: 1; }
            
            @keyframes scan { 0% { top:-10%; } 100% { top:110%; } }
            @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
            
            @container (aspect-ratio > 1.8) {
                #ocr-wrapper { flex-direction:row; gap:15px; }
                .ocr-header { margin:0; width:30%; flex-direction:column; justify-content:center; align-items:flex-start; gap:10px;}
                .ocr-display { margin:0; width:70%; }
            }
        </style>
        <div id="ocr-wrapper">
            <div class="ocr-header">
                <span><i class="fa-solid fa-eye" style="color:#0ea5e9"></i> Lector OCR</span>
                <span style="font-size:0.7em; color:#ef4444;"><i class="fa-solid fa-circle-dot"></i> LIVE</span>
            </div>
            <div class="ocr-display">
                <div class="ocr-corner" style="top:5px; left:5px; border-right:none; border-bottom:none;"></div>
                <div class="ocr-corner" style="top:5px; right:5px; border-left:none; border-bottom:none;"></div>
                <div class="ocr-corner" style="bottom:5px; left:5px; border-right:none; border-top:none;"></div>
                <div class="ocr-corner" style="bottom:5px; right:5px; border-left:none; border-top:none;"></div>
                
                <div class="ocr-scanline"></div>
                <div id="ocr-text" class="ocr-text">LISTO</div>
            </div>
        </div>
    `,
    onData: (val) => {
        // Recibe datos de la Pico: { texto: "1234 ABC" }
        if (val.texto) {
            const el = document.getElementById('ocr-text');
            el.classList.remove('scanning');
            el.innerText = val.texto.toUpperCase();
            
            // Efecto flash de captura
            el.style.color = "white";
            setTimeout(() => el.style.color = "#32d74b", 150);
        }
    },
    abrirAjustes: (core) => {
        core.notificar("Requiere un módulo de cámara en la red", "📷");
    }
};
