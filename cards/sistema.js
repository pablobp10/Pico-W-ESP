 export const SistemaCard = {
    id: "System",
    html: `
        <div class="label" style="margin-bottom:10px">SISTEMA</div>
        <div class="sys-grid">
            <div class="sys-item"><i class="fa-solid fa-circle" id="icon-mqtt" style="color:#ccc; width:20px; text-align:center"></i> <span id="txt-mqtt">Offline</span></div>
            <div class="sys-item"><i class="fa-solid fa-wifi" id="icon-wifi" style="color:#ccc; width:20px; text-align:center"></i> <span id="txt-rssi">-- dBm</span></div>
            <div class="sys-item"><i class="fa-solid fa-bolt" style="color:#666; width:20px; text-align:center"></i> <span id="txt-vcc">-- V</span></div>
            <div class="sys-item"><i class="fa-solid fa-clock" style="color:#666; width:20px; text-align:center"></i> <span id="txt-upt">-- min</span></div>
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
    }
};

