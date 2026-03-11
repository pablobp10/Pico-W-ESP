export const FiestaCard = {
    id: "Fiesta",
    defaultSize: "1x1",
    html: `
        <style>
            #fiesta-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; gap: 3cqmin; box-sizing: border-box; padding: 5cqmin; }
            .fiesta-label { font-size: clamp(0.7rem, 8cqmin, 1.5rem); font-weight: 800; color: var(--text-sec); text-align: left; margin: 0; }
            #color-wrapper { position: relative; flex-grow: 1; border-radius: clamp(8px, 4cqmin, 20px); min-height: 40px; overflow: hidden; box-shadow: inset 0 0 10px rgba(0,0,0,0.2); transition: transform 0.1s; background: linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff); }
            #f-picker { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; padding: 0; margin: 0; border: none; }
            .fiesta-center { pointer-events: none; position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: clamp(1.5rem, 20cqmin, 5rem); text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
            #f-off { margin: 0; padding: clamp(8px, 5cqmin, 20px); font-size: clamp(0.7rem, 8cqmin, 1.5rem); background: #1c1c1e; border-radius: clamp(8px, 3cqmin, 12px); }
            
            @container (aspect-ratio > 1.5) {
                #fiesta-wrapper { flex-direction: row; flex-wrap: wrap; align-items: center; }
                .fiesta-label { width: 100%; margin-bottom: 0; }
                #color-wrapper { height: 100%; width: 60%; }
                #f-off { width: 35%; height: 100%; }
            }
        </style>
        
        <div id="fiesta-wrapper">
            <div class="fiesta-label">MODO FIESTA</div>
            <div id="color-wrapper">
                <input type="color" id="f-picker" value="#ff0000">
                <div class="fiesta-center"><i class="fa-solid fa-palette"></i></div>
            </div>
            <button class="btn-action btn-off" id="f-off">APAGAR FIESTA</button>
        </div>
    `,
    onInit: (core) => {
        const picker = document.getElementById('f-picker');
        const wrapper = document.getElementById('color-wrapper');
        picker.onchange = (e) => {
            core.pub('Fiesta', e.target.value, false);
            wrapper.style.background = e.target.value;
        };
        picker.oninput = (e) => wrapper.style.background = e.target.value;
        document.getElementById('f-off').onclick = () => {
            core.pub('Fiesta', 'off', false);
            wrapper.style.background = "linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)";
        };
    },
    onData: (val) => {
        document.body.style.backgroundColor = ""; document.body.className = "";
        const wrapper = document.getElementById('color-wrapper');
        
        // IA Support: Diccionario de colores comunes
        const coloresText = { "rojo":"#ff0000", "verde":"#00ff00", "azul":"#0000ff", "amarillo":"#ffff00", "blanco":"#ffffff" };
        let finalColor = coloresText[val.toLowerCase()] || val;

        if(finalColor && finalColor !== "off") {
            if(finalColor.startsWith("#")) {
                document.body.style.backgroundColor = finalColor; 
                if(wrapper) wrapper.style.background = finalColor; 
            } else {
                document.body.classList.add("fiesta-" + finalColor);
            }
        }
    },
    abrirAjustes: (core) => {
        core.notificar("Opciones DMX próximamente", "🪩");
    }
};
