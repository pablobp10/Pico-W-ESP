export const LedCard = {
    id: "Led",
    category: "luces",
    rol: "guest",
    defaultSize: "1x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%; cursor:pointer;" id="led-btn-area">
            <i class="fa-solid fa-lightbulb icon" id="led-icon" style="font-size:2.8rem; color:var(--text-sec); transition: 0.3s, text-shadow 0.3s;"></i>
            <span id="val-Led" class="val-text" style="margin-top:10px; font-size:1.2rem; font-weight:bold;">OFF</span>
        </div>
    `,
    onInit: (core) => {
        const area = document.getElementById('led-btn-area');
        area.onclick = () => {
            const current = document.getElementById('val-Led').innerText;
            const action = current === "ON" ? "off" : "on";
            core.vibra("tick");
            core.cmd('Led', action); // Viaja encriptado por AES
            
            // Feedback visual inmediato (UI optimista)
            document.getElementById('val-Led').innerText = "ESPERANDO...";
        };
    },
    onData: (val) => {
        if (!val) return;
        const txt = document.getElementById('val-Led');
        const icon = document.getElementById('led-icon');
        
        // Sanitización implícita
        let estado = typeof val === 'string' ? val.toUpperCase() : (val.estado ? val.estado.toUpperCase() : 'OFF');
        txt.innerText = estado;
        
        if (estado === "ON") {
            icon.style.color = "#facc15";
            icon.style.textShadow = "0 0 15px rgba(250, 204, 21, 0.8)";
        } else {
            icon.style.color = "var(--text-sec)";
            icon.style.textShadow = "none";
        }
    }
};
