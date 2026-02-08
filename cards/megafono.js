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
            
            <div id="status-log" style="font-size:0.6rem; color:red; display:none">Error</div>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');
        const log = document.getElementById('status-log');

        // PREPARAR EL CONTEXTO DE AUDIO (Esto es como encender el amplificador)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx;
        
        try {
            audioCtx = new AudioContext();
        } catch(e) {
            alert("Tu navegador es muy antiguo y no soporta Web Audio.");
        }

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. DESBLOQUEO DE AUDIO (Crucial en Android)
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            // 2. GENERAR UN PITIDO (BEEP) MATEMÁTICO
            // Esto no descarga nada, lo genera el chip.
            try {
                hacerBeep(audioCtx);
            } catch(e) {
                log.style.display = "block";
                log.innerText = "Fallo Sintetizador: " + e.message;
            }

            // 3. INTENTAR VOZ (Después del beep)
            setTimeout(() => {
                intentarVoz(txt);
            }, 300); // 300ms después del beep

            // 4. MQTT y Visuales
            core.pub('Megafono', JSON.stringify({ txt: txt }), false);
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

// --- FUNCIÓN QUE GENERA SONIDO PURO ---
function hacerBeep(ctx) {
    if (!ctx) return;
    
    // Crear un oscilador (generador de ondas)
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine'; // Onda senoidal (suave)
    oscillator.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz (Nota La)
    
    // Conectar: Oscilador -> Volumen -> Altavoces
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Arrancar y parar
    oscillator.start();
    
    // Bajar volumen suavemente para que no haga "pop"
    gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    oscillator.stop(ctx.currentTime + 0.5);
}

function intentarVoz(texto) {
    // Usamos el cliente más antiguo y compatible de Google (tw-ob)
    // Sin AudioContext, usando HTML5 Audio básico
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=${encodeURIComponent(texto)}`;
    const audio = new Audio(url);
    audio.play().catch(e => console.error("Fallo voz:", e));
}
