export const LedCard = {
    id: "Led",
    category: "luces"
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-between; height:100%; width:100%;">
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
        
        card.classList.remove('on'); 
        document.getElementById('val-Led').innerText = "OFF";
        btn.innerText = "ENCENDER"; 
        btn.className = "btn-action btn-on";

        setTimeout(() => core.cmd('Led', 'get'), 500); 

        btn.onclick = () => {
            // ⬇️ LA MAGIA UX: Ponemos el botón a "pensar" y lo bloqueamos temporalmente
            btn.classList.add('is-pending');
            core.vibra("tick"); // Feedback táctil
            
            const st = document.getElementById('val-Led').innerText;
            core.cmd('Led', st === "ON" ? "off" : "on"); 
        };
    },
    onData: (val, app, core) => {
        let isOn = false;
        if (val === true || val === "1" || val === "ON" || val === "on") isOn = true;
        else if (typeof val === 'object' && val !== null) {
            if (val.led === true || val.led === "1" || val.led === "ON" || val.led === "on") isOn = true;
        }
        
        document.getElementById('val-Led').innerText = isOn ? "ON" : "OFF";
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led');
        
        // ⬇️ LA RESPUESTA: Quitamos el estado de carga al recibir la confirmación
        btn.classList.remove('is-pending');
        
        if(isOn) { 
            if(!card.classList.contains('on')) core.vibra("doble"); // Vibra si realmente cambió
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
