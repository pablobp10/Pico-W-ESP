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
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');

        // Intentar precargar voces nativas (por si acaso)
        if(window.speechSynthesis) window.speechSynthesis.getVoices();

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. DISPARAR AUDIO (Sin esperas, sin lógica compleja)
            forzarAudio(txt);

            // 2. ENVIAR MQTT
            core.pub('Megafono', JSON.stringify({ txt: txt }), false);

            // 3. Feedback Visual
            btn.style.background = "#32d74b";
            setTimeout(() => { btn.style.background = "#f97316"; }, 500);
        };
    },
    onData: (val) => {} 
};

function forzarAudio(texto) {
    // 1. INTENTO NATIVO (Solo si estamos seguros de que funciona)
    const speech = window.speechSynthesis;
    // Si hay API y TIENE voces cargadas
    if (speech && speech.getVoices().length > 0) {
        speech.cancel();
        const frase = new SpeechSynthesisUtterance(texto);
        frase.lang = 'es-ES';
        // Buscamos voz en español
        const voz = speech.getVoices().find(v => v.lang.includes('es'));
        if (voz) frase.voice = voz;
        
        // Si falla la nativa, disparamos el MP3
        frase.onerror = () => reproducirMP3(texto);
        
        speech.speak(frase);
    } else {
        // 2. SI NO HAY NATIVA -> MP3 DIRECTO
        reproducirMP3(texto);
    }
}

function reproducirMP3(texto) {
    // Usamos el cliente 'gtx' de Google (Alta disponibilidad)
    const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=es&dt=t&q=${encodeURIComponent(texto)}`;
    
    // CREAMOS EL AUDIO EN EL ACTO (New Audio)
    // Esto se salta muchas restricciones del DOM
    const audio = new Audio(url);
    audio.playbackRate = 1.0;
    
    const promesa = audio.play();
    
    if (promesa !== undefined) {
        promesa.catch(e => {
            console.error("Bloqueo de Audio:", e);
            alert("Error: Revisa el volumen multimedia o el 'Ahorro de Datos'.");
        });
    }
}
