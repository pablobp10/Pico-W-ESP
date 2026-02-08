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
            
            <div id="audio-log" style="font-size:0.6rem; color:red; display:none; text-align:left;"></div>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-speak');
        const input = document.getElementById('mega-input');
        const logDiv = document.getElementById('audio-log');

        // Inicializar AudioContext (Para el Beep)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        let audioCtx;
        try { audioCtx = new AudioContext(); } catch(e){}

        btn.onclick = () => {
            const txt = input.value.trim();
            if(!txt) return;

            // 1. Feedback Visual
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            btn.style.background = "#32d74b";

            // 2. HACER BEEP (Confirmación de hardware)
            if (audioCtx) {
                if (audioCtx.state === 'suspended') audioCtx.resume();
                beep(audioCtx);
            }

            // 3. INTENTAR HABLAR (Secuencia de servidores)
            logDiv.style.display = "none";
            logDiv.innerText = "";
            
            playMultiServer(txt, (exito, msg) => {
                // Restaurar botón cuando termine o falle
                setTimeout(() => {
                    btn.innerHTML = originalIcon;
                    btn.style.background = "#f97316";
                    if(!exito) {
                        logDiv.style.display = "block";
                        logDiv.innerText = msg;
                    }
                }, 500);
            });

            // 4. Enviar MQTT
            core.pub('Megafono', JSON.stringify({ txt: txt }), false);
        };
    },
    onData: (val) => {} 
};

// --- VARIABLE GLOBAL PARA QUE NO SE CORTE EL AUDIO ---
window.currentAudio = null; 

function playMultiServer(texto, callback) {
    // Lista de URLs para probar (en orden de probabilidad de éxito)
    const encoded = encodeURIComponent(texto);
    const servers = [
        // 1. StreamElements (El más permisivo con CORS)
        `https://api.streamelements.com/kappa/v2/speech?voice=Enrique&text=${encoded}`,
        // 2. Google GTX (Usado por Android)
        `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=es&dt=t&q=${encoded}`,
        // 3. Google Tw-Ob (Legacy)
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=${encoded}`
    ];

    let intento = 0;

    function probarSiguiente() {
        if (intento >= servers.length) {
            callback(false, "Fallo total: Ningún servidor responde.");
            return;
        }

        const url = servers[intento];
        console.log(`Intentando servidor ${intento + 1}...`);

        // DETALLE IMPORTANTE: Usamos la variable global window.currentAudio
        if (window.currentAudio) {
            window.currentAudio.pause();
            window.currentAudio = null;
        }

        window.currentAudio = new Audio(url);
        window.currentAudio.volume = 1.0;

        // Promesa de reproducción
        const playPromise = window.currentAudio.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log("Audio reproduciendo con éxito.");
                    callback(true, "OK");
                })
                .catch(error => {
                    console.warn(`Fallo servidor ${intento + 1}:`, error);
                    intento++;
                    probarSiguiente(); // RECURSIVIDAD: Prueba el siguiente
                });
        } else {
            // Si el navegador no soporta promesas de audio (muy raro hoy en día)
            intento++;
            probarSiguiente();
        }
        
        // Manejador de errores de carga (404, 403, Red)
        window.currentAudio.onerror = (e) => {
            console.warn(`Error de carga en servidor ${intento + 1}`);
            intento++;
            probarSiguiente();
        };
    }

    // Iniciar la cadena
    probarSiguiente();
}

function beep(ctx) {
    // Generador de tono puro (sin archivos)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.type = 'sine';
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.15);
    osc.stop(ctx.currentTime + 0.15);
}
