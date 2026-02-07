// Generamos un ID único para evitar eco
const MY_ID = "User_" + Math.floor(Math.random() * 100000);

export const MegafonoCard = {
    id: "Megafono",
    // Tamaño 1x1 (Cuadrado)
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-bullhorn" style="color:#f97316"></i> MEGÁFONO
            </div>
            
            <textarea id="mega-input" placeholder="Mensaje..." style="
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

        // Intento silencioso de cargar voces
        if(window.speechSynthesis) {
            try { window.speechSynthesis.getVoices(); } catch(e){}
        }

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. HABLAR LOCALMENTE (Esto debería funcionar siempre al hacer clic)
            speakSafe(txt);

            // 2. ENVIAR A MQTT
            const payload = JSON.stringify({ txt: txt, sender: MY_ID });
            core.pub('Megafono', payload, false);

            // 3. Animación botón
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = "#32d74b";
            
            setTimeout(() => {
                btn.innerHTML = originalIcon;
                btn.style.background = "#f97316";
            }, 1500);
        };
    },
    onData: (val, app, core) => {
        // Verificamos soporte sin lanzar errores
        if(!val || !window.speechSynthesis) return;

        let msg = "";
        let sender = "";

        try {
            const data = JSON.parse(val);
            msg = data.txt;
            sender = data.sender;
        } catch {
            msg = val; 
        }

        // Si soy yo mismo, salir
        if (sender === MY_ID) return;

        // Intentar hablar (si el navegador bloquea por autoplay, simplemente no sonará)
        speakSafe(msg);
    }
};

// Función auxiliar que NO da error nunca
function speakSafe(text) {
    // 1. Comprobamos si existe la API
    if (!window.speechSynthesis) return;

    try {
        // 2. Cancelamos audios anteriores
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0; 

        // 3. Selección de voz (Intentamos Español, si no, la que haya)
        const voices = window.speechSynthesis.getVoices();
        let voice = voices.find(v => v.lang.includes("es")); // Cualquier español
        if (voice) utterance.voice = voice;

        // 4. Manejador de errores interno (para que no salten alertas)
        utterance.onerror = (e) => { console.log("Audio bloqueado o fallido", e); };

        window.speechSynthesis.speak(utterance);
    } catch (e) {
        // Si todo falla, no hacemos nada (silencio)
        console.log("Error crítico audio:", e);
    }
}
