export const MegafonoCard = {
    id: "Megafono",
    // Tamaño 1x1
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

            <div style="display:flex; gap:5px;">
                <button id="btn-speak" class="btn-action" style="
                    background:#f97316; margin:0; flex-grow:1; padding:8px; font-size:0.8rem;
                ">
                    <i class="fa-solid fa-play"></i> HABLAR
                </button>
                
                <button id="btn-unlock" class="btn-action" style="
                    background:#64748b; margin:0; width:auto; padding:8px; font-size:0.8rem;
                " title="Desbloquear Audio">
                    <i class="fa-solid fa-lock-open"></i>
                </button>
            </div>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const btnUnlock = document.getElementById('btn-unlock');
        const input = document.getElementById('mega-input');

        // Carga silenciosa de voces
        if(window.speechSynthesis) window.speechSynthesis.getVoices();

        // --- TRUCO: PEDIR MICRÓFONO PARA DESBLOQUEAR ---
        btnUnlock.onclick = () => {
            // Pedimos acceso al micro. Esto FUERZA un popup de sistema.
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    // Si acepta:
                    alert("¡Audio desbloqueado!");
                    
                    // Cerramos el micro inmediatamente (no queremos espiar)
                    stream.getTracks().forEach(track => track.stop());
                    
                    // Ocultamos el botón de desbloqueo
                    btnUnlock.style.display = 'none';
                    
                    // Intentamos reproducir un sonido de prueba
                    const u = new SpeechSynthesisUtterance("Sistema de audio activo");
                    u.lang = 'es-ES';
                    window.speechSynthesis.speak(u);
                })
                .catch(err => {
                    alert("Error: Necesitas aceptar el permiso para que suene.");
                });
        };

        // Lógica normal de hablar
        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. Hablar
            hablar(txt);

            // 2. Enviar MQTT
            core.pub('Megafono', JSON.stringify({ txt: txt }), false);

            // 3. Animación
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

function hablar(texto) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const frase = new SpeechSynthesisUtterance(texto);
    frase.lang = 'es-ES';
    frase.rate = 1;
    
    const voces = window.speechSynthesis.getVoices();
    const voz = voces.find(v => v.lang.includes('es'));
    if (voz) frase.voice = voz;

    window.speechSynthesis.speak(frase);
}
