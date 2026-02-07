export const LedCard = {
    id: "Led",
    // Sin size = 1x1 (Cuadrada)
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
        document.getElementById('btn-Led').onclick = () => {
            const st = document.getElementById('val-Led').innerText;
            core.cmd('Led', st === "ON" ? "OFF" : "ON");
        };
    },
    onData: (val) => {
        const isOn = (val === true || val === "1" || val === "ON" || val.led===true); 
        
        // Actualizar Texto
        document.getElementById('val-Led').innerText = isOn ? "ON" : "OFF";
        
        // Actualizar Botón y Clase
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led'); // Necesario para el brillo del borde/icono
        
        if(isOn) { 
            card.classList.add('on'); 
            btn.innerText="APAGAR"; 
            btn.className="btn-action btn-off"; 
        } else { 
            card.classList.remove('on'); 
            btn.innerText="ENCENDER"; 
            btn.className="btn-action btn-on"; 
        }
    }
};
