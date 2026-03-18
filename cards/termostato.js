export const TermostatoCard = {
    id: "Termostato",
    category: "clima",
    defaultSize: "2x2",
    customAccion: {
        titulo: "Cambiar Modo",
        icono: "fa-solid fa-fire-flame-curved",
        color: "#ff453a",
        ejecutar: (core) => {
            const modos = ['calor', 'frio', 'auto'];
            const colores = {'calor':'#ff453a', 'frio':'#0a84ff', 'auto':'#32d74b'};
            const iconos = {'calor':'fa-fire-flame-curved', 'frio':'fa-snowflake', 'auto':'fa-robot'};
            
            let current = localStorage.getItem('pico_term_modo') || 'calor';
            let nextIdx = (modos.indexOf(current) + 1) % modos.length;
            let nuevoModo = modos[nextIdx];
            
            localStorage.setItem('pico_term_modo', nuevoModo);
            document.getElementById('term-icon').className = `fa-solid ${iconos[nuevoModo]}`;
            document.getElementById('term-icon').style.color = colores[nuevoModo];
            core.pub('Termostato/Modo', nuevoModo, true);
        }
    },
    html: `
        <style>
            #term-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; box-sizing: border-box; padding: 10px; }
            .term-ring { border-radius: 50%; border: 4px solid var(--border); display: flex; flex-direction: column; justify-content: center; align-items: center; aspect-ratio: 1; width: clamp(80px, 80cqmin, 200px); position: relative; }
            .term-current { font-size: clamp(1.5rem, 20cqmin, 4rem); font-weight: 900; color: var(--text-main); line-height: 1; }
            .term-target { font-size: clamp(0.8rem, 8cqmin, 1.5rem); color: var(--text-sec); margin-top: 5px; }
            .term-controls { display: none; width: 100%; justify-content: space-around; margin-top: 15px; }
            .term-btn { background: var(--bg); border: 1px solid var(--border); color: var(--text-main); width: clamp(40px, 15cqw, 60px); height: clamp(40px, 15cqw, 60px); border-radius: 50%; font-size: clamp(1rem, 8cqw, 1.5rem); cursor: pointer; display: flex; justify-content: center; align-items: center; }
            
            @container (aspect-ratio > 0.8) and (min-width: 150px) {
                .term-controls { display: flex; }
            }
            @container (aspect-ratio > 1.8) {
                #term-wrapper { flex-direction: row; justify-content: space-around; }
                .term-controls { flex-direction: column; width: auto; gap: 10px; margin-top: 0; }
            }
        </style>
        
        <div id="term-wrapper">
            <div class="term-ring">
                <i id="term-icon" class="fa-solid fa-fire-flame-curved" style="position:absolute; top:10%; color:#ff453a; font-size:clamp(0.8rem, 8cqmin, 1.5rem);"></i>
                <div id="t-actual" class="term-current">21.5°</div>
                <div id="t-objetivo" class="term-target">Obj: 22.0°</div>
            </div>
            <div class="term-controls">
                <button class="term-btn" id="btn-t-menos"><i class="fa-solid fa-minus"></i></button>
                <button class="term-btn" id="btn-t-mas"><i class="fa-solid fa-plus"></i></button>
            </div>
        </div>
    `,
    onInit: (core) => {
        let obj = parseFloat(localStorage.getItem('pico_term_obj')) || 22.0;
        document.getElementById('t-objetivo').innerText = `Obj: ${obj.toFixed(1)}°`;
        
        const updateObj = (delta) => {
            obj += delta;
            localStorage.setItem('pico_term_obj', obj.toFixed(1));
            document.getElementById('t-objetivo').innerText = `Obj: ${obj.toFixed(1)}°`;
            core.pub('Termostato/Set', obj.toFixed(1), false);
        };
        
        document.getElementById('btn-t-menos').onclick = () => updateObj(-0.5);
        document.getElementById('btn-t-mas').onclick = () => updateObj(0.5);
    },
    onData: (val) => {
        if(val.actual) document.getElementById('t-actual').innerText = `${parseFloat(val.actual).toFixed(1)}°`;
    }
};
