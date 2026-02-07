// Generamos un ID único para esta sesión de navegador
const MY_ID = "User_" + Math.floor(Math.random() * 100000);

export const MegafonoCard = {
    id: "Megafono",
    // Tamaño 1x1
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-bullhorn" style="color:#f97316"></i> MEGÁFONO
            </div>
            
            <textarea id="mega-input" placeholder="Escribe algo..." style="
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

        // TRUCO: Forzar carga de voces en Android/iOS al iniciar
        if('speechSynthesis' in window) {
            // Intentamos cargar las voces nada más abrir la web
            window.speechSynthesis.getVoices();
            // Y nos suscribimos por si tardan en llegar
            window.speechSynthesis.onvoiceschanged = () => {
                console.log("Voces cargadas");
            };
        }

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. HABLAR LOCALMENTE (Esto DEBE sonar porque has pulsado tú)
            speakText(txt);

            // 2. ENVIAR A LOS DEMÁS
            const payload = JSON.stringify({ txt: txt, sender: MY_ID });
            core.pub('Megafono', payload, false);

            // 3. Feedback visual
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = "#32d74b"; // Verde
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = "#f97316"; // Naranja
            }, 1500);
        };
    },
    onData: (val, app, core) => {
        if(!val || !('speechSynthesis' in window)) return;

        let msg = "";
        let sender = "";

        try {
            const data = JSON.parse(val);
            msg = data.txt;
            sender = data.sender;
        } catch {
            msg = val; 
        }

        // Si el ID del mensaje es MI ID, no hago nada (ya hablé al pulsar el botón)
        if (sender === MY_ID) return;

        // Si es de otro, intento hablar
        // NOTA: En móviles, esto solo sonará si la pantalla está encendida y el navegador activo
        speakText(msg);
    }
};

// Función de Voz Mejorada
function speakText(text) {
    if (!('speechSynthesis' in window)) {
        alert("Tu navegador no soporta audio");
        return;
    }

    // Cancelar cualquier audio anterior que se haya quedado colgado
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; 
    utterance.pitch = 1.0;
    utterance.volume = 1.0; // Volumen al máximo

    // Selección de voz INTELIGENTE
    const voices = window.speechSynthesis.getVoices();
    
    // 1. Buscamos voz de Google en Español (suelen ser las mejores en Android)
    let voice = voices.find(v => v.name.includes("Google") && v.lang.includes("es"));
    
    // 2. Si no, cualquier voz en español
    if (!voice) voice = voices.find(v => v.lang.includes("es"));
    
    // 3. Si no hay español, usamos la por defecto del sistema
    if (voice) utterance.voice = voice;

    // Ejecutar
    window.speechSynthesis.speak(utterance);
}
