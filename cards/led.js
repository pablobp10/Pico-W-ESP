export const LedCard = {
    id: "Led",
    category: "luces",
    undo: true,  // ⏱️ Activa el Time-Travel de 3 segundos
    pip: true,   // 🪟 Permite extraerla como ventana flotante
    html: `
        <div class="card-content-parallax" style="display:flex; flex-direction:column; justify-content:space-between; height:100%; width:100%;">
            <div class="card-actions-overlay">
                <button class="mini-action-btn btn-pip" onclick="window.App.abrirPiP('Led')"><i class="fa-solid fa-clone"></i></button>
            </div>
            
            <div style="display:flex; justify-content:space-between; align-items:center; flex-grow:1; padding:0 5px">
                <i class="fa-solid fa-lightbulb icon" style="font-size:3rem; margin:0"></i>
                <span id="val-Led" style="font-weight:800; font-size:1.5rem; color:var(--text-main)">OFF</span>
            </div>
            <button class="btn-action btn-on" id="btn-Led" style="margin-top:5px; width:100%">ENCENDER</button>
        </div>
    `,
    onInit: (core) => {
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led');
        const valTxt = document.getElementById('val-Led');

        // 🛡️ ESCUDO: Si la interfaz aún no se ha dibujado, abortamos para no dar error
        if (!btn || !card || !valTxt) return; 

        // Configuración inicial segura
        card.classList.remove('on'); 
        valTxt.innerText = "OFF";
        btn.innerText = "ENCENDER"; 
        btn.className = "btn-action btn-on";

        // Pedimos el estado real a la placa (una sola vez es suficiente)
        setTimeout(() => core.cmd('Led', 'get'), 500); 

        btn.onclick = () => {
            const st = valTxt.innerText;
            // 🧠 Time-Travel activado:
            core.ejecutarConDeshacer('Led', st === "ON" ? "off" : "on"); 
            
            // Feedback visual: Ponemos el botón en espera
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
        
        // 🛡️ ESCUDO: Protegemos la recepción de datos
        if (!valTxt || !btn || !card) return;

        valTxt.innerText = isOn ? "ON" : "OFF";
        
        // ⬇️ LA RESPUESTA: Quitamos el estado de carga al recibir la confirmación de la Pico
        btn.classList.remove('is-pending');
        
        if(isOn) { 
            if(!card.classList.contains('on')) core.vibra("doble"); // Vibra solo si hay un cambio real
            card.classList.add('on'); 
            btn.innerText = "APAGAR"; 
            btn.className = "btn-action btn-off"; 
        } else { 
            if(card.classList.contains('on')) core.vibra("doble");
            card.classList.remove('on'); 
            btn.innerText = "ENCENDER"; 
            btn.className = "btn-action btn-on"; 
        }
    }
};
