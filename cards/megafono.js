export const MegafonoCard = {
    id: "Megafono",
    size: "wide", // Ocupa ancho completo (2 huecos) en móvil
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-bullhorn" style="color:#f97316"></i> MEGÁFONO
            </div>
            
            <textarea id="mega-input" placeholder="Escribe para hablar..." style="
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

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. Enviamos el mensaje al Broker PRIMERO
            core.pub('Megafono', txt, false);

            // 2. Feedback visual (Botón cambia)
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ENVIADO';
            btn.style.background = "#32d74b";
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = "#f97316";
            }, 2000);
        };
    },
    onData: (val) => {
        // Esta función se activa cuando recibimos un mensaje (incluido el nuestro propio)
        if(!val) return;

        // TRUCO ANTI-CAÍDA:
        // Envolvemos el habla en un setTimeout de 100ms.
        // Esto permite que el navegador termine de procesar el paquete de red MQTT
        // antes de bloquearse para cargar el driver de audio.
        setTimeout(() => {
            speakText(val);
        }, 100);
    }
};

// Función auxiliar para manejar el Audio
function speakText(text) {
    if (!('speechSynthesis' in window)) return;

    // Cancelar si ya estaba hablando para no solapar
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Forzar español
    utterance.rate = 1.0;     // Velocidad normal
    utterance.pitch = 1.0;    // Tono normal

    // Intentar seleccionar una voz de Google o Apple en español
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Monica')));
    if (esVoice) utterance.voice = esVoice;

    window.speechSynthesis.speak(utterance);
}
