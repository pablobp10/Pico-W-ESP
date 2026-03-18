export const LedCard = {
    id: "Led",
    category: "luces",
    defaultSize: "1x1",
    undo: true,
    customAccion: {
        titulo: "Abrir Ventana Flotante (PiP)",
        icono: "fa-solid fa-clone",
        color: "#0a84ff",
        ejecutar: (core) => core.abrirPiP('Led')
    },
    html: `
        <style>
            #led-wrapper { display: flex; flex-direction: column; justify-content: space-between; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; cursor: pointer; transition: 0.2s;}
            #led-wrapper:active { transform: scale(0.98); }
            
            .led-top { display: flex; justify-content: space-between; align-items: center; flex-grow: 1; padding: 0 2cqmin; position: relative; pointer-events:none;}
            .led-custom-name { position: absolute; top: -5cqmin; left: 2cqmin; font-size: clamp(0.6rem, 6cqmin, 1rem); font-weight: bold; color: var(--text-sec); text-transform: uppercase; }
            .led-icon { font-size: clamp(1.5rem, 20cqmin, 4rem); margin: 0; transition: color 0.3s, filter 0.3s; }
            #val-Led { font-weight: 800; font-size: clamp(1.5rem, 25cqmin, 6rem); color: var(--text-main); line-height: 1; }
            #btn-Led { margin-top: 3cqmin; width: 100%; padding: clamp(10px, 6cqmin, 24px); font-size: clamp(0.8rem, 8cqmin, 2rem); border-radius: clamp(8px, 4cqmin, 16px); }
            
            /* Indicativo visual sutil de interactividad */
            #card-Led { transition: box-shadow 0.3s, border-color 0.3s; }
            #card-Led:hover { border-color: rgba(255, 255, 255, 0.2); }
            #card-Led.on { box-shadow: 0 0 15px rgba(250, 204, 21, 0.1); border-color: rgba(250, 204, 21, 0.3); }

            @container (aspect-ratio > 1.2) {
                #led-wrapper { flex-direction: row; align-items: center; gap: 4cqmin; }
                .led-top { width: 50%; justify-content: space-around; }
                .led-custom-name { top: -15cqh; left: 10cqw; }
                .led-icon { font-size: clamp(2.5rem, 50cqh, 8rem); }
                #btn-Led { width: 50%; margin-top: 0; height: 70%; display: flex; align-items: center; justify-content: center; }
            }
        </style>
        
        <div id="led-wrapper" class="card-content-parallax">
            <div class="led-top">
                <div class="led-custom-name" id="led-name-display">Luz Principal</div>
                <i class="fa-solid fa-lightbulb icon led-icon"></i>
                <span id="val-Led">OFF</span>
            </div>
            <button class="btn-action btn-on" id="btn-Led" style="pointer-events:none;">ENCENDER</button>
        </div>
    `,
    onInit: (core) => {
        const wrapper = document.getElementById('led-wrapper');
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led');
        const valTxt = document.getElementById('val-Led');
        const nameDisp = document.getElementById('led-name-display');
        
        if (!wrapper || !btn || !card || !valTxt) return; 
        
        if(nameDisp) nameDisp.innerText = localStorage.getItem('pico_led_name') || "Luz Principal";

        card.classList.remove('on'); 
        valTxt.innerText = "OFF";
        btn.innerText = "ENCENDER"; 
        btn.className = "btn-action btn-on";

        setTimeout(() => core.cmd('Led', 'get'), 500); 

        // Moví el evento de click al wrapper entero para que toda la tarjeta sea un botón gigante
        wrapper.onclick = () => {
            const st = valTxt.innerText;
            core.ejecutarConDeshacer('Led', st === "ON" ? "off" : "on"); 
            btn.classList.add('is-pending');
            btn.innerText = "ESPERANDO...";
            core.vibra("tick");
        };
    },
    onData: (val, app, core) => {
        let isOn = false;
        if (val === true || val === "1" || val === "ON" || val === "on") isOn = true;
        else if (typeof val === 'object' && val !== null) {
            if (val.led === true || val.led === "1" || val.led === "ON" || val.led === "on") isOn = true;
        }
        
        const valTxt = document.getElementById('val-Led');
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led');
        if (!valTxt || !btn || !card) return;

        valTxt.innerText = isOn ? "ON" : "OFF";
        btn.classList.remove('is-pending');
        
        if(isOn) { 
            card.classList.add('on'); 
            btn.innerText = "APAGAR"; 
            btn.className = "btn-action btn-off"; 
        } else { 
            card.classList.remove('on'); 
            btn.innerText = "ENCENDER"; 
            btn.className = "btn-action btn-on"; 
        }
    },
    abrirAjustes: (core) => {
        let name = prompt("Nombre de la luz:", localStorage.getItem('pico_led_name') || "Luz Principal");
        if(name) {
            localStorage.setItem('pico_led_name', name);
            document.getElementById('led-name-display').innerText = name;
            core.notificar("Nombre actualizado", "✅");
        }
    }
};
