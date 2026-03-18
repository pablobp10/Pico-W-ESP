export const MegafonoCard = {
    id: "Megafono",
    defaultSize: "1x1",
    customAccion: {
        titulo: "Silenciar Inmediatamente",
        icono: "fa-solid fa-volume-xmark",
        color: "#a1a1aa",
        ejecutar: (core) => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                core.notificar("Megáfono silenciado", "🔇");
            }
        }
    },
    html: `
        <style>
            #mega-wrapper { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; box-sizing: border-box; padding: 5cqmin; }
            .mega-icon { font-size: clamp(1.8rem, 25cqmin, 5rem); color: #ff9f0a; margin-bottom: 3cqmin; }
            #tts-input { width: 100%; margin: 2cqmin 0; padding: clamp(8px, 4cqmin, 18px); font-size: clamp(0.8rem, 6cqmin, 1.5rem); border: 1px solid var(--border); border-radius: clamp(8px, 4cqmin, 12px); background: var(--bg); color: var(--text-main); text-align: center; outline: none; }
            #btn-tts { width: 100%; padding: clamp(10px, 5cqmin, 20px); font-size: clamp(0.8rem, 6cqmin, 1.5rem); background: #ff9f0a; border-radius: clamp(8px, 4cqmin, 12px); }
            
            @container (aspect-ratio > 1.5) {
                #mega-wrapper { flex-direction: row; gap: 3cqmin; }
                .mega-icon { width: 15%; margin: 0; font-size: clamp(2rem, 40cqh, 5rem); }
                #tts-input { width: 50%; margin: 0; }
                #btn-tts { width: 25%; margin: 0; }
            }
        </style>
        
        <div id="mega-wrapper">
            <i class="fa-solid fa-bullhorn icon mega-icon"></i>
            <input type="text" id="tts-input" placeholder="Mensaje...">
            <button class="btn-action" id="btn-tts">HABLAR</button>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('btn-tts').onclick = () => {
            const txt = document.getElementById('tts-input').value;
            core.pub('Megafono', txt, false);
            document.getElementById('tts-input').value = "";
        };
    },
    onData: (val) => { 
        if(!val) return;
        const u = new SpeechSynthesisUtterance(val);
        const pitch = parseFloat(localStorage.getItem('pico_tts_pitch')) || 1.0;
        u.pitch = pitch;
        u.lang = 'es-ES';
        window.speechSynthesis.speak(u); 
    },
    abrirAjustes: (core) => {
        let p = prompt("Tono de voz (0.1 grave a 2.0 agudo):", localStorage.getItem('pico_tts_pitch') || "1.0");
        if(p && !isNaN(p)) { localStorage.setItem('pico_tts_pitch', p); core.notificar("Cuerdas vocales ajustadas", "🗣️"); }
    }
};
