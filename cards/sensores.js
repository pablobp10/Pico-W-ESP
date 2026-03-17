export const SensoresCard = {
    id: "Sensores",
    category: "sensores",
    rol: "guest",
    defaultSize: "1x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:space-evenly; height:100%; width:100%; padding:5px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <i class="fa-solid fa-temperature-three-quarters" style="color:#ff9f0a; font-size:1.2rem;"></i>
                <span id="sens-temp" style="font-size:1.2rem; font-weight:bold; color:var(--text-main);">--°C</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <i class="fa-solid fa-droplet" style="color:#0a84ff; font-size:1.2rem;"></i>
                <span id="sens-hum" style="font-size:1.2rem; font-weight:bold; color:var(--text-main);">--%</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <i class="fa-solid fa-person-rays" id="icon-pir" style="color:var(--text-sec); font-size:1.2rem; transition:0.3s;"></i>
                <span id="sens-pir" style="font-size:0.9rem; font-weight:bold; color:var(--text-sec);">Tranquilo</span>
            </div>
        </div>
    `,
    onData: (val) => {
        if(!val) return;
        
        // Usamos innerText por seguridad XSS
        if(val.t !== undefined) document.getElementById('sens-temp').innerText = `${val.t}°C`;
        if(val.h !== undefined) document.getElementById('sens-hum').innerText = `${val.h}%`;
        
        if(val.pir !== undefined) {
            const iconPir = document.getElementById('icon-pir');
            const txtPir = document.getElementById('sens-pir');
            if(val.pir === 1 || val.pir === "MOVIMIENTO") {
                iconPir.style.color = "#ff453a";
                txtPir.style.color = "#ff453a";
                txtPir.innerText = "DETECTADO";
            } else {
                iconPir.style.color = "var(--text-sec)";
                txtPir.style.color = "var(--text-sec)";
                txtPir.innerText = "Tranquilo";
            }
        }
    }
};
