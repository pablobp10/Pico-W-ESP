export const MegafonoCard = {
    id: "Megafono",
    // Tamaño 1x1
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-bullhorn" style="color:#f97316"></i> MEGÁFONO
            </div>
            
            <textarea id="mega-input" placeholder="Escribe..." style="
                flex-grow: 1;
                width: 100%;
                margin-bottom: 5px;
                font-size: 0.9rem;
                padding: 8px;
                resize: none;
                border: 1px solid var(--border);
                border-radius: 8px;
                background: var(--bg);
                color: var(--text-main);
                box-sizing: border-box;
            "></textarea>

            <button id="btn-speak" class="btn-action" style="
                background:#f97316; 
                margin-top:0; 
                padding: 8px; 
                font-size:0.8rem;
            ">
                <i class="fa-solid fa-play"></i> HABLAR
            </button>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');

        // Cargar voces en segundo plano al iniciar
        if(window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. SONIDO INMEDIATO (Prioridad absoluta)
            // Al estar dentro del 'onclick', el navegador NO lo bloquea.
            hablarLocal(txt);

            // 2. Enviar por MQTT (Para que lo lean, aunque no suene en otros)
            // Enviamos un objeto simple
            core.pub('Megafono', JSON.stringify({ txt: txt }), false);

            // 3. Efecto visual botón
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = "#32d74b";
            
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.style.background = "#f97316";
            }, 1000);
        };
    },
    // Dejamos onData vacío para que no intente reproducir lo de otros y falle
    onData: (val) => {}
};

// Función de voz simple y directa
function hablarLocal(texto) {
    if (!window.speechSynthesis) {
        alert("Tu navegador no tiene voz.");
        return;
    }

    // Cancelar cualquier cosa que estuviera sonando
    window.speechSynthesis.cancel();

    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = 'es-ES'; // Español
    frase.rate = 1;       // Velocidad normal
    frase.volume = 1;     // Volumen máximo

    // Intentar buscar una voz en español
    const voces = window.speechSynthesis.getVoices();
    // Prioridad: Google Español > Cualquier Español
    const voz = voces.find(v => v.name.includes('Google') && v.lang.includes('es')) || 
                voces.find(v => v.lang.includes('es'));
    
    if (voz) frase.voice = voz;

    // ¡HABLAR YA!
    window.speechSynthesis.speak(frase);
}
