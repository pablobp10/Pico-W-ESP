export const LedCard = {
    id: "Led",
    category: "luces",
    defaultSize: "1x1",
    undo: true,
    pip: true,
    html: `
        <style>
            #led-wrapper { display: flex; flex-direction: column; justify-content: space-between; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; }
            .led-top { display: flex; justify-content: space-between; align-items: center; flex-grow: 1; padding: 0 2cqmin; position: relative;}
            .led-custom-name { position: absolute; top: -5cqmin; left: 2cqmin; font-size: clamp(0.6rem, 6cqmin, 1rem); font-weight: bold; color: var(--text-sec); text-transform: uppercase; }
            .led-icon { font-size: clamp(2.5rem, 35cqmin, 8rem); margin: 0; transition: color 0.3s, filter 0.3s; }
            #val-Led { font-weight: 800; font-size: clamp(1.5rem, 25cqmin, 6rem); color: var(--text-main); line-height: 1; }
            #btn-Led { margin-top: 3cqmin; width: 100%; padding: clamp(10px, 6cqmin, 24px); font-size: clamp(0.8rem, 8cqmin, 2rem); border-radius: clamp(8px, 4cqmin, 16px); }
            
            @container (aspect-ratio > 1.2) {
                #led-wrapper { flex-direction: row; align-items: center; gap: 4cqmin; }
                .led-top { width: 50%; justify-content: space-around; }
                .led-custom-name { top: -15cqh; left: 10cqw; }
                .led-icon { font-size: clamp(2.5rem, 50cqh, 8rem); }
                #btn-Led { width: 50%; margin-top: 0; height: 70%; display: flex; align-items: center; justify-content: center; }
            }
        </style>
        
        <div id="led-wrapper" class="card-content-parallax">
            <div class="card-actions-overlay" style="z-index: 5;">
                <button class="mini-action-btn btn-pip" onclick="window.App.abrirPiP('Led')"><i class="fa-solid fa-clone"></i></button>
            </div>
            <div class="led-top">
                <div class="led-custom-name" id="led-name-display">Luz Principal</div>
                <i class="fa-solid fa-lightbulb icon led-icon"></i>
                <span id="val-Led">OFF</span>
            </div>
            <button class="btn-action btn-on" id="btn-Led">ENCENDER</button>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led');
        const valTxt = document.getElementById('val-Led');
        const nameDisp = document.getElementById('led-name-display');
        
        if (!btn || !card || !valTxt) return; 
        
        // Restaurar nombre personalizado
        if(nameDisp) nameDisp.innerText = localStorage.getItem('pico_led_name') || "Luz Principal";

        card.classList.remove('on'); 
        valTxt.innerText = "OFF";
        btn.innerText = "ENCENDER"; 
        btn.className = "btn-action btn-on";

        setTimeout(() => core.cmd('Led', 'get'), 500); 

        btn.onclick = () => {
            const st = valTxt.innerText;
            core.ejecutarConDeshacer('Led', st === "ON" ? "off" : "on"); 
            btn.classList.add('is-pending');
            btn.innerText = "ESPERANDO...";
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
            if(!card.classList.contains('on')) core.vibra("doble"); 
            card.classList.add('on'); 
            btn.innerText = "APAGAR"; 
            btn.className = "btn-action btn-off"; 
        } else { 
            if(card.classList.contains('on')) core.vibra("doble");
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
