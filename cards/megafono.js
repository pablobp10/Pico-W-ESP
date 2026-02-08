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
            
            <audio id="google-player" style="display:none"></audio>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');
        const player = document.getElementById('google-player');

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. REPRODUCIR AUDIO (Vía Google GTX)
            reproducirGoogle(txt, player);

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

function reproducirGoogle(texto, player) {
    // CAMBIO CLAVE: Usamos 'client=gtx' en lugar de 'tw-ob'
    // 'gtx' es el cliente que usa la extensión de Chrome y Android, es mucho más permisivo.
    const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=es&q=${encodeURIComponent(texto)}`;
    
    player.src = url;
    player.volume = 1.0;
    
    // Promesa para capturar errores de red
    const playPromise = player.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Error reproduciendo:", error);
            // Si falla, intentamos el servidor de respaldo (dict-chrome-ex)
            if(player.src.includes('client=gtx')) {
                console.log("Reintentando con servidor secundario...");
                const urlBackup = `https://translate.google.com/translate_tts?ie=UTF-8&client=dict-chrome-ex&tl=es&q=${encodeURIComponent(texto)}`;
                player.src = urlBackup;
                player.play();
            }
        });
    }
}
