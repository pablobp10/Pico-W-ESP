export const LedCard = {
    id: "Led",
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
        // 1. FORZAR ESTADO POR DEFECTO A "OFF" NADA MÁS ENTRAR
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led');
        
        card.classList.remove('on'); 
        document.getElementById('val-Led').innerText = "OFF";
        btn.innerText = "ENCENDER"; 
        btn.className = "btn-action btn-on";

        // 2. PREGUNTAR AL MASTER EL ESTADO REAL ("get")
        // Si el master no contesta, nos quedamos en el OFF por defecto de arriba
        setTimeout(() => {
            core.cmd('Led', 'get');
        }, 500); // Pequeño margen para asegurar que el túnel MQTT esté abierto

        // 3. ASIGNAR LA ACCIÓN AL BOTÓN
        btn.onclick = () => {
            const st = document.getElementById('val-Led').innerText;
            core.cmd('Led', st === "ON" ? "off" : "on"); 
        };
    },
    onData: (val) => {
        console.log("🔌 [LED] Datos recibidos:", val); 
        
        let isOn = false;
        
        // Entiende V19 (texto plano)
        if (val === true || val === "1" || val === "ON" || val === "on") {
            isOn = true;
        }
        // Entiende V22 (JSON firmado: {"led": true, "firma_v21": "..."})
        else if (typeof val === 'object' && val !== null) {
            if (val.led === true || val.led === "1" || val.led === "ON" || val.led === "on") {
                isOn = true;
            }
        }
        
        // Pinta la realidad
        document.getElementById('val-Led').innerText = isOn ? "ON" : "OFF";
        const btn = document.getElementById('btn-Led');
        const card = document.getElementById('card-Led');
        
        if(isOn) { 
            card.classList.add('on'); 
            btn.innerText = "APAGAR"; 
            btn.className = "btn-action btn-off"; 
        } else { 
            card.classList.remove('on'); 
            btn.innerText = "ENCENDER"; 
            btn.className = "btn-action btn-on"; 
        }
    }
};
