export const ConscienciaCard = {
    id: "Consciencia",
    category: "sistema",
    defaultSize: "1x1",
    customAccion: {
        titulo: "Evolucionar IA",
        icono: "fa-solid fa-dna",
        color: "#ff453a",
        ejecutar: (core) => {
            const modos = [
                { id: 'logico', nombre: 'LÓGICO', color: '#0a84ff', icon: 'fa-brain' },
                { id: 'ironico', nombre: 'IRÓNICO', color: '#f59e0b', icon: 'fa-face-rolling-eyes' },
                { id: 'defensa', nombre: 'DEFENSA', color: '#ff453a', icon: 'fa-skull' },
                { id: 'zen', nombre: 'MODO ZEN', color: '#32d74b', icon: 'fa-leaf' }
            ];
            let current = localStorage.getItem('pico_ai_modo') || 'logico';
            let idx = modos.findIndex(m => m.id === current);
            let next = modos[(idx + 1) % modos.length];
            
            localStorage.setItem('pico_ai_modo', next.id);
            ConscienciaCard.onData(next); 
            
            core.notificar(`Personalidad alterada: ${next.nombre}`, "🧬");
            core.pub('Sistema/Consciencia', next.id, true);
        }
    },
    html: `
        <style>
            #ai-wrapper { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; box-sizing:border-box; padding:10px; transition:0.3s;}
            #ai-icon { font-size:clamp(2rem, 30cqmin, 6rem); transition:0.5s cubic-bezier(0.4, 0, 0.2, 1); margin-bottom:5px; filter: drop-shadow(0 0 15px currentColor); }
            #ai-label { font-size:clamp(0.7rem, 12cqmin, 1.5rem); font-weight:900; letter-spacing:2px; transition:0.3s; text-shadow: 0 0 5px rgba(255,255,255,0.2);}
            
            #ai-icon.spin { transform: rotateY(360deg) scale(1.1); }
            
            @container (aspect-ratio > 1.2) {
                #ai-wrapper { flex-direction:row; justify-content:space-around; }
                #ai-icon { margin:0; }
            }
        </style>
        <div id="ai-wrapper">
            <i id="ai-icon" class="fa-solid fa-brain" style="color:#0a84ff"></i>
            <div id="ai-label" style="color:#0a84ff">LÓGICO</div>
        </div>
    `,
    onInit: (core) => {
        const modos = {
            'logico': { nombre: 'LÓGICO', color: '#0a84ff', icon: 'fa-brain' },
            'ironico': { nombre: 'IRÓNICO', color: '#f59e0b', icon: 'fa-face-rolling-eyes' },
            'defensa': { nombre: 'DEFENSA', color: '#ff453a', icon: 'fa-skull' },
            'zen': { nombre: 'MODO ZEN', color: '#32d74b', icon: 'fa-leaf' }
        };
        let current = localStorage.getItem('pico_ai_modo') || 'logico';
        ConscienciaCard.onData(modos[current]);
    },
    onData: (val) => {
        if (val && val.nombre) {
            const icon = document.getElementById('ai-icon');
            const label = document.getElementById('ai-label');
            
            icon.classList.add('spin');
            setTimeout(() => {
                icon.className = `fa-solid ${val.icon}`;
                icon.style.color = val.color;
                label.innerText = val.nombre;
                label.style.color = val.color;
                icon.classList.remove('spin');
            }, 250);
        }
    },
    abrirAjustes: (core) => {
        core.notificar("Los prompts del sistema base han sido alterados", "🧠");
    }
};