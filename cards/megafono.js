export const MegafonoCard = {
    id: "Megafono",
    // Lo hacemos ancho para ver bien los errores
    size: "wide", 
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%; gap:5px;">
            <div class="label" style="text-align:left;">
                <i class="fa-solid fa-bug"></i> DIAGNÓSTICO DE AUDIO
            </div>
            
            <div style="display:flex; gap:5px">
                <button id="btn-test-native" class="btn-action" style="margin:0; background:#007aff; font-size:0.8rem">
                    1. PROBAR NATIVO
                </button>
                <button id="btn-test-google" class="btn-action" style="margin:0; background:#f97316; font-size:0.8rem">
                    2. PROBAR GOOGLE
                </button>
            </div>

            <textarea id="debug-log" readonly style="
                flex-grow: 1; 
                background: #000; 
                color: #0f0; 
                font-family: monospace; 
                font-size: 0.7rem; 
                padding: 5px;
                resize: none;
            ">Esperando pruebas...</textarea>
            
            <audio id="google-player" style="display:none"></audio>
        </div>
    `,
    onInit: (core) => {
        const btnNative = document.getElementById('btn-test-native');
        const btnGoogle = document.getElementById('btn-test-google');
        const logArea = document.getElementById('debug-log');
        const player = document.getElementById('google-player');

        // Función para escribir en la pantalla negra
        const log = (msg) => {
            const time = new Date().toLocaleTimeString();
            logArea.value += `[${time}] ${msg}\n`;
            logArea.scrollTop = logArea.scrollHeight; // Auto-scroll al final
        };

        // 1. CHEQUEO INICIAL
        log("Iniciando...");
        if (!window.speechSynthesis) {
            log("❌ ERROR CRÍTICO: Tu navegador NO tiene API de voz (SpeechSynthesis).");
            log("   -> La opción nativa es imposible.");
        } else {
            log("✅ API SpeechSynthesis detectada.");
            // Intentar cargar voces
            const voces = window.speechSynthesis.getVoices();
            log(`ℹ️ Voces cargadas al inicio: ${voces.length}`);
            
            window.speechSynthesis.onvoiceschanged = () => {
                const v = window.speechSynthesis.getVoices();
                log(`⚡ Evento de voces disparado. Total: ${v.length}`);
            };
        }

        // --- PRUEBA 1: VOZ NATIVA ---
        btnNative.onclick = () => {
            log("--- INICIANDO TEST NATIVO ---");
            
            if (!window.speechSynthesis) {
                log("❌ Abortado: No hay API.");
                return;
            }

            window.speechSynthesis.cancel(); // Limpiar cola
            
            const texto = "Prueba de sistema nativo uno dos tres";
            const frase = new SpeechSynthesisUtterance(texto);
            frase.lang = 'es-ES';
            frase.volume = 1;
            frase.rate = 1;

            const voces = window.speechSynthesis.getVoices();
            const voz = voces.find(v => v.lang.includes('es'));
            
            if (voz) {
                frase.voice = voz;
                log(`✅ Voz seleccionada: ${voz.name}`);
            } else {
                log("⚠️ No se encontró voz en Español. Usando la predeterminada.");
                if(voces.length === 0) log("⚠️ ALERTA: La lista de voces está vacía (Bug típico de Opera/Android).");
            }

            // Eventos para saber qué pasa
            frase.onstart = () => log("▶️ Evento: Empezó a hablar (onstart)");
            frase.onend = () => log("Tb Evento: Terminó (onend)");
            frase.onerror = (e) => log(`❌ ERROR NATIVO: ${e.error}`);

            try {
                window.speechSynthesis.speak(frase);
                log("🚀 Orden .speak() enviada.");
            } catch (e) {
                log(`❌ Excepción JS: ${e.message}`);
            }
        };

        // --- PRUEBA 2: GOOGLE MP3 ---
        btnGoogle.onclick = () => {
            log("--- INICIANDO TEST GOOGLE ---");
            const texto = "Prueba de conexión con Google";
            // Usamos un cliente diferente para evitar bloqueos
            const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es&q=${encodeURIComponent(texto)}`;
            
            log(`🔗 URL generada (tw-ob)`);
            
            player.src = url;
            player.volume = 1.0;

            player.onplay = () => log("▶️ Reproductor: Playing...");
            player.onended = () => log("Tb Reproductor: Terminado.");
            player.onerror = (e) => {
                const err = player.error;
                let msg = "Desconocido";
                if (err.code === 1) msg = "Abortado por usuario";
                if (err.code === 2) msg = "Error de Red (Bloqueo CORS o Sin Internet)";
                if (err.code === 3) msg = "Error de Decodificación (Archivo corrupto)";
                if (err.code === 4) msg = "Formato no soportado";
                log(`❌ ERROR AUDIO: ${msg} (Code: ${err.code})`);
            };

            const promesa = player.play();
            if (promesa !== undefined) {
                promesa
                    .then(() => log("✅ Promesa de audio aceptada."))
                    .catch(error => {
                        log(`❌ BLOQUEO AUTOMÁTICO: ${error.message}`);
                        log("ℹ️ Posible causa: Autoplay Policy o Configuración de Sonido.");
                    });
            }
        };
    },
    onData: () => {}
};
