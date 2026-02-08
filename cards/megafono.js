export const MegafonoCard = {
    id: "Megafono",
    // Tamaño 1x1
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-bullhorn" style="color:#f97316"></i> MEGÁFONO
            </div>
            
            <textarea id="mega-input" placeholder="Mensaje..." style="
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
            
            <audio id="backup-player" style="display:none"></audio>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');
        const player = document.getElementById('backup-player');

        // Intentar cargar voces nativas al inicio
        if(window.speechSynthesis) window.speechSynthesis.getVoices();

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. INICIAR SECUENCIA HÍBRIDA
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

// --- LÓGICA DE CASCADA ---

function intentarHablar(texto, player) {
    const speech = window.speechSynthesis;
    let voces = [];
    
    // 1. CHEQUEO: ¿Existe la API?
    if (speech) voces = speech.getVoices();

    // 2. DECISIÓN: Si no hay API o la lista de voces está vacía (Bug Opera)
    // Saltamos DIRECTAMENTE al MP3
    if (!speech || voces.length === 0) {
        console.log("⚠️ Sin soporte nativo. Usando StreamElements.");
        usarStreamElements(texto, player);
        return;
    }

    // 3. INTENTO NATIVO
    console.log("🗣️ Intentando voz nativa...");
    speech.cancel(); 
    
    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = 'es-ES';

    // Buscar voz en español
    const vozEs = voces.find(v => v.lang.includes('es'));
    if (vozEs) frase.voice = vozEs;

    // 4. RED DE SEGURIDAD: Si la nativa falla, activa el Plan B
    frase.onerror = (e) => {
        console.error("❌ Falló la voz nativa. Cambiando a MP3...", e);
        usarStreamElements(texto, player);
    };

    speech.speak(frase);
}

function usarStreamElements(texto, player) {
    // API de StreamElements (Voz: Enrique). Es muy compatible.
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=Enrique&text=${encodeURIComponent(texto)}`;
    
    player.src = url;
    player.volume = 1.0;
    
    const playPromise = player.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Fallo total de audio:", error);
            // Si esto falla, es que el navegador tiene el audio bloqueado totalmente.
        });
    }
}
