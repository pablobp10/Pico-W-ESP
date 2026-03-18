export const SistemaCard = {
    id: "System",
    defaultSize: "2x1",
    customAccion: {
        titulo: "Ping Manual",
        icono: "fa-solid fa-satellite-dish",
        color: "#0ea5e9",
        ejecutar: (core) => {
            core.cmd('Sistema', 'PING');
            core.notificar("Ping enviado a la Pico", "📡");
        }
    },
    html: `
        <style>
            #sys-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; }
            .sys-title { font-size: clamp(0.7rem, 6cqmin, 1.2rem); font-weight: 700; color: var(--text-sec); margin-bottom: 10px; }
            .sys-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: clamp(5px, 2cqmin, 15px); flex-grow: 1; }
            .sys-item { display: flex; align-items: center; gap: 8px; font-size: clamp(0.8rem, 5cqmin, 1.5rem); font-weight: 600; color: var(--text-main); }
            
            @container (aspect-ratio > 2.5) {
                .sys-grid { grid-template-columns: repeat(4, 1fr); align-items: center; }
            }
        </style>
        
        <div id="sys-wrapper">
            <div class="sys-title">SISTEMA PICO OS</div>
            <div class="sys-grid">
                <div class="sys-item"><i class="fa-solid fa-circle" id="icon-mqtt" style="color:#ccc; width:20px; text-align:center"></i> <span id="txt-mqtt">Offline</span></div>
                <div class="sys-item"><i class="fa-solid fa-wifi" id="icon-wifi" style="color:#ccc; width:20px; text-align:center"></i> <span id="txt-rssi">-- dBm</span></div>
                <div class="sys-item"><i class="fa-solid fa-bolt" style="color:#666; width:20px; text-align:center"></i> <span id="txt-vcc">-- V</span></div>
                <div class="sys-item"><i class="fa-solid fa-clock" style="color:#666; width:20px; text-align:center"></i> <span id="txt-upt">-- min</span></div>
            </div>
        </div>
    `,
    onData: (val) => {
        if (val.sistema) {
            const online = val.sistema === "ONLINE" || val.sistema === "KEEPALIVE";
            document.getElementById('txt-mqtt').innerText = online ? "Online" : "Offline";
            document.getElementById('icon-mqtt').style.color = online ? "#22c55e" : "#ef4444";
            if(val.rssi) {
                document.getElementById('txt-rssi').innerText = val.rssi + " dBm";
                const rssi = parseInt(val.rssi);
                document.getElementById('icon-wifi').style.color = rssi > -60 ? '#22c55e' : (rssi > -80 ? '#f59e0b' : '#ef4444');
            }
            if(val.vcc) document.getElementById('txt-vcc').innerText = val.vcc + " V";
            if(val.upt) document.getElementById('txt-upt').innerText = Math.round(val.upt/60000) + " min";
        }
    },
    abrirAjustes: (core) => {
        if(confirm("⚠️ ¿Deseas reiniciar la Raspberry Pi Pico remotamente?")) {
            core.cmd('Sistema', 'REBOOT');
            core.notificar("Orden de reinicio enviada", "🔄");
        }
    }
};
