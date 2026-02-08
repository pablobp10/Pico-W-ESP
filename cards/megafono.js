export const MegafonoCard = {
    id: "Megafono",
    // Tamaño 1x1
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-bullhorn" style="color:#f97316"></i> MEGÁFONO
            </div>
            
            <textarea id="mega-input" placeholder="Escribe..." style="
                flex-grow: 1; width: 100%; margin-bottom: 5px; font-size: 0.9rem;
                padding: 8px; resize: none; border: 1px solid var(--border);
                border-radius: 8px; background: var(--bg); color: var(--text-main);
                box-sizing: border-box;
            "></textarea>

            <button id="btn-speak" class="btn-action" style="
                background:#f97316; margin-top:0; padding: 8px; font-size:0.8rem;
            ">
                <i class="fa-solid fa-play"></i> HABLAR
            </button>
            
            <audio id="google-fallback" style="display:none"></audio>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');
        const player = document.getElementById('google-fallback');

        // Intentar cargar voces nativas al inicio
        if(window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. INTENTO HÍBRIDO
            intentarHablar(txt, player);

            // 2. ENVIAR MQTT
            core.pub('Megafono', JSON.stringify({ txt: txt }), false);

            // 3. Feedback Visual
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = "#32d74b";
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.style.background = "#f97316";
            }, 1000);
        };
    },
    onData: (val) => {} 
};

// --- LÓGICA INTELIGENTE DE AUDIO ---
function intentarHablar(texto, playerElement) {
    // PASO 1: Comprobar si el navegador soporta voz nativa
    if (!window.speechSynthesis) {
        console.log("Navegador sin soporte nativo -> Usando Google");
        usarGoogle(texto, playerElement);
        return;
    }

    // PASO 2: Comprobar si hay voces reales cargadas
    // (Opera a veces dice que soporta speech, pero getVoices devuelve vacío)
    const voces = window.speechSynthesis.getVoices();
    if (voces.length === 0) {
        console.log("Voces nativas vacías (Bug Opera) -> Usando Google");
        usarGoogle(texto, playerElement);
        return;
    }

    // PASO 3: Intentar hablar nativamente
    console.log("Intentando voz nativa...");
    window.speechSynthesis.cancel();
    
    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = 'es-ES';
    
    // Buscar voz en español
    const vozEs = voces.find(v => v.lang.includes('es'));
    if (vozEs) frase.voice = vozEs;

    // Si falla la nativa en medio del proceso, saltar a Google
    frase.onerror = (e) => {
        console.error("Error nativo -> Usando Google", e);
        usarGoogle(texto, playerElement);
    };

    window.speechSynthesis.speak(frase);
}

function usarGoogle(texto, playerElement) {
    console.log("Reproduciendo MP3 de Google...");
    // URL mágica de Google Translate TTS
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=${encodeURIComponent(texto)}`;
    playerElement.src = url;
    playerElement.play().catch(e => console.error("Fallo total de audio", e));
}
