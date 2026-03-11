export const SintetizadorCard = {
    id: "Sintetizador",
    category: "media",
    defaultSize: "3x1",
    customAccion: {
        titulo: "Cambiar Forma de Onda",
        icono: "fa-solid fa-wave-square",
        color: "#bf5af2",
        ejecutar: (core) => {
            const ondas = ['sine', 'square', 'triangle', 'sawtooth'];
            let current = localStorage.getItem('pico_synth_wave') || 'square';
            let next = ondas[(ondas.indexOf(current) + 1) % ondas.length];
            localStorage.setItem('pico_synth_wave', next);
            core.notificar(`Generador PWM ajustado a onda: ${next.toUpperCase()}`, "🎵");
            core.pub('Sintetizador/Onda', next, false);
        }
    },
    html: `
        <style>
            #synth-wrapper { display:flex; flex-direction:column; height:100%; width:100%; padding:10px; box-sizing:border-box; }
            .synth-header { font-size:clamp(0.6rem, 10cqmin, 0.9rem); font-weight:800; color:#bf5af2; margin-bottom:5px; text-transform:uppercase; display:flex; justify-content:space-between; }
            .keys-container { display:flex; flex-grow:1; gap:2px; position:relative; border-radius: 0 0 8px 8px; overflow:hidden;}
            .key-white { flex-grow:1; background:var(--text-main); border:1px solid var(--border); cursor:pointer; transition:0.1s; border-radius:0 0 4px 4px;}
            .key-white:active { background:#e2e8f0; transform:translateY(2px); }
            .key-black { position:absolute; width:10%; height:60%; background:#1c1c1e; border-radius:0 0 4px 4px; cursor:pointer; z-index:2; transition:0.1s; transform:translateX(-50%); border: 1px solid #000; box-shadow: 0 2px 5px rgba(0,0,0,0.5);}
            .key-black:active { background:#000; transform:translate(-50%, 2px); }
            
            @container (aspect-ratio < 1) {
                #synth-wrapper { padding: 5px; }
            }
        </style>
        <div id="synth-wrapper">
            <div class="synth-header">
                <span><i class="fa-solid fa-music"></i> Sintetizador PWM</span>
                <span style="color:var(--text-sec); font-size:0.7em;">C4 - A4</span>
            </div>
            <div class="keys-container" id="synth-keys">
                </div>
        </div>
    `,
    onInit: (core) => {
        const keysDiv = document.getElementById('synth-keys');
        // Frecuencias exactas en Hz para la escala C4-A4
        const notas = [
            { n: 'C4', f: 261.63, t: 'w' },
            { n: 'Cs4', f: 277.18, t: 'b', left: '14.28%' },
            { n: 'D4', f: 293.66, t: 'w' },
            { n: 'Ds4', f: 311.13, t: 'b', left: '28.57%' },
            { n: 'E4', f: 329.63, t: 'w' },
            { n: 'F4', f: 349.23, t: 'w' },
            { n: 'Fs4', f: 369.99, t: 'b', left: '57.14%' },
            { n: 'G4', f: 392.00, t: 'w' },
            { n: 'Gs4', f: 415.30, t: 'b', left: '71.42%' },
            { n: 'A4', f: 440.00, t: 'w' },
            { n: 'As4', f: 466.16, t: 'b', left: '85.71%' },
            { n: 'B4', f: 493.88, t: 'w' }
        ];
        
        let html = '';
        notas.forEach(nota => {
            if (nota.t === 'w') {
                html += `<div class="key-white" data-f="${nota.f}"></div>`;
            } else {
                html += `<div class="key-black" style="left:${nota.left}" data-f="${nota.f}"></div>`;
            }
        });
        keysDiv.innerHTML = html;
        
        // Asignamos el envío del payload al tocar
        keysDiv.querySelectorAll('div').forEach(k => {
            const sendFreq = (e) => {
                e.preventDefault(); 
                core.pub('Sintetizador', k.getAttribute('data-f'), false);
            };
            k.onmousedown = sendFreq;
            k.ontouchstart = sendFreq;
        });
    },
    abrirAjustes: (core) => {
        core.notificar("Conecta un buzzer pasivo al pin PWM de la Pico", "🎹");
    }
};
