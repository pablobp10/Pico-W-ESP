export const MegafonoCard = {
    id: "Megafono",
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-bullhorn" style="color:#f97316"></i> MEGÁFONO
            </div>
            
            <textarea id="mega-input" placeholder="Escribe algo..." style="
                flex-grow: 1;
                margin-bottom: 10px;
                font-size: 1.1rem;
                padding: 10px;
            "></textarea>

            <button id="btn-speak" class="btn-action" style="background:#f97316; margin-top:0">
                <i class="fa-solid fa-play"></i> HABLAR
            </button>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');

        // PRE-CARGAR VOCES (Truco para Android/iOS)
        // Al cargar la página, pedimos las voces para que estén listas cuando pulses.
        if('speechSynthesis' in window) {
            window.speechSynthesis.getVoices(); 
        }

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. HABLAR LOCALMENTE (INMEDIATO)
            // Al hacerlo dentro del 'onclick', el navegador SIEMPRE lo permite.
            speakText(txt);

            // 2. ENVIAR A LOS DEMÁS
            // Enviamos un JSON con un ID único para no repetirnos a nosotros mismos
            const payload = JSON.stringify({ 
                txt: txt, 
                sender: core.mqtt.clientId // Usamos el ID de nuestro cliente MQTT
            });
            core.pub('Megafono', payload, false);

            // 3. Feedback visual
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ENVIADO';
            btn.style.background = "#32d74b";
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = "#f97316";
            }, 2000);
        };
    },
    onData: (val, app, core) => {
        // Si no hay datos o speech no soportado, salir
        if(!val || !('speechSynthesis' in window)) return;

        let msg = "";
        let sender = "";

        // Intentamos parsear si viene como JSON (formato nuevo)
        try {
            const data = JSON.parse(val);
            msg = data.txt;
            sender = data.sender;
        } catch {
            // Si es texto plano (formato antiguo), lo usamos tal cual
            msg = val; 
        }

        // EVITAR EL ECO:
        // Si el mensaje lo envié YO (mi sender ID), no lo vuelvo a decir 
        // porque ya lo dije en el 'onclick'.
        if (sender === core.mqtt.clientId) return;

        // Si lo envió OTRO, intentamos hablar (puede fallar si el móvil está dormido)
        speakText(msg);
    }
};

// Función de Voz Mejorada
function speakText(text) {
    if (!('speechSynthesis' in window)) return;

    // Cancelar audio anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;

    // Selección de voz robusta
    const voices = window.speechSynthesis.getVoices();
    // Prioridad: Google Español > Cualquier Español > La primera que haya
    const voice = voices.find(v => v.lang.includes('es') && v.name.includes('Google')) || 
                  voices.find(v => v.lang.includes('es'));
    
    if (voice) utterance.voice = voice;

    // IMPORTANTE: Imprimir error si falla
    utterance.onerror = (e) => console.error("Error TTS:", e);

    window.speechSynthesis.speak(utterance);
}
