export const OCRCard = {
    id: "OCR",
    category: "herramientas",
    rol: "admin",
    defaultSize: "2x2",
    html: `
        <div style="display:flex; flex-direction:column; align-items:center; height:100%; width:100%; padding:5px;">
            <i class="fa-solid fa-eye" style="color:var(--primary); font-size:1.5rem; margin-bottom:5px;"></i>
            <span style="font-size:0.7rem; font-weight:bold; color:var(--text-sec); margin-bottom:8px;">PROCESADOR DE TEXTO IA</span>
            <textarea id="ocr-txt" placeholder="Pega un texto para que la IA lo analice y ejecute acciones..." style="flex-grow:1; width:100%; background:rgba(0,0,0,0.2); border:1px solid var(--border); color:var(--text-main); border-radius:8px; padding:8px; outline:none; font-size:0.8rem; resize:none;"></textarea>
            <button id="ocr-btn" class="btn-action" style="width:100%; margin-top:8px; background:var(--primary); color:white; border:none; border-radius:8px; padding:8px; cursor:pointer; font-weight:bold;">ANALIZAR TEXTO</button>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('ocr-btn').onclick = () => {
            const txt = document.getElementById('ocr-txt').value.trim();
            if(!txt) return;
            core.vibra("doble");
            document.getElementById('ocr-txt').value = "";
            
            core.notificar("Enviando bloque de texto al cerebro...", "🧠");
            // Se envía a través del mismo socket de IA seguro que ya creamos en core.js
            if (core.ws && core.ws.readyState === WebSocket.OPEN) {
                core.ws.send(JSON.stringify({ accion: "ia", proveedor: core.conf.ia_favorita || "groq", texto: "Analiza el siguiente texto y ejecuta acciones en la casa si lo ves necesario: " + txt }));
            }
        };
    }
};
