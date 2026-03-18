export const FindCard = {
    id: "Find",
    defaultSize: "1x1",
    customAccion: {
        titulo: "Baliza de Emergencia",
        icono: "fa-solid fa-triangle-exclamation",
        color: "#ef4444",
        ejecutar: (core) => {
            core.notificar("Activando baliza de emergencia S.O.S", "🚨");
            let count = 0;
            const sos = setInterval(() => {
                core.pub('Find', 'beep', false);
                count++;
                if (count >= 5) clearInterval(sos);
            }, 1000);
        }
    },
    html: `
        <style>
            #find-wrapper { display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; height: 100%; width: 100%; box-sizing: border-box; padding: 10px; }
            #find-icon { font-size: clamp(2rem, 25cqmin, 4rem); color: #0ea5e9; margin: 0; }
            #bat-val { font-size: clamp(0.7rem, 10cqmin, 1.2rem); font-weight: 800; color: var(--text-sec); text-transform: uppercase; margin: 5px 0; }
            #btn-beep { padding: clamp(6px, 4cqmin, 14px); font-size: clamp(0.7rem, 8cqmin, 1.2rem); width: 100%; border-radius: 12px; background: #0ea5e9; margin: 0; }
            
            @container (aspect-ratio > 1.2) {
                #find-wrapper { flex-direction: row; justify-content: space-around; }
                #find-icon { font-size: clamp(2rem, 50cqh, 6rem); width: 40%; text-align: center; }
                .find-controls { width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; }
            }
        </style>
        
        <div id="find-wrapper">
            <i class="fa-solid fa-mobile-screen" id="find-icon"></i>
            <div class="find-controls" style="width:100%">
                <div id="bat-val">Batería</div>
                <button class="btn-action" id="btn-beep">🔊 PITAR</button>
            </div>
        </div>
    `,
    
    onInit: (core) => {
        document.getElementById('btn-beep').onclick = () => core.pub('Find','beep',false);
        if(navigator.getBattery) navigator.getBattery().then(b=>document.getElementById('bat-val').innerText=Math.round(b.level*100)+"%");
    },
    onData: (val) => {
        if(val === 'beep' || val === 'sonar') {
            const freq = parseInt(localStorage.getItem('pico_beep_freq')) || 440;
            const c = new AudioContext(); const o = c.createOscillator(); 
            o.type = 'sine'; o.frequency.setValueAtTime(freq, c.currentTime);
            o.connect(c.destination); o.start(); setTimeout(()=>o.stop(), 500);
        }
    },
    abrirAjustes: (core) => {
        let f = prompt("Frecuencia del pitido en Hz (ej: 440 o 880):", localStorage.getItem('pico_beep_freq') || "440");
        if(f && !isNaN(f)) { localStorage.setItem('pico_beep_freq', f); core.notificar("Tono actualizado", "🎵"); }
    }
};
