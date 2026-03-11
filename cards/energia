export const EnergiaCard = {
    id: "Energia",
    category: "sensores",
    defaultSize: "2x1",
    customAccion: {
        titulo: "Resetear Consumo",
        icono: "fa-solid fa-rotate-left",
        color: "#ff9f0a",
        ejecutar: (core) => {
            core.cmd('Energia', 'RESET_MAH');
            core.notificar("Contador de mAh reseteado", "⚡");
        }
    },
    html: `
        <style>
            #ene-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; height: 100%; width: 100%; box-sizing: border-box; padding: 10px; }
            .ene-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; text-align: center; }
            .ene-box { background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 5px; border: 1px solid var(--border); }
            .ene-val { font-size: clamp(1.2rem, 15cqmin, 2.5rem); font-weight: 800; color: var(--text-main); font-variant-numeric: tabular-nums; }
            .ene-lbl { font-size: clamp(0.6rem, 8cqmin, 0.8rem); font-weight: bold; color: var(--text-sec); }
            
            @container (aspect-ratio > 1.8) {
                .ene-grid { grid-template-columns: repeat(3, 1fr); }
            }
        </style>
        
        <div id="ene-wrapper">
            <div style="align-self: flex-start; font-size: 0.8rem; font-weight: bold; color: #ff9f0a; margin-bottom: 5px;">
                <i class="fa-solid fa-bolt"></i> TELEMETRÍA
            </div>
            <div class="ene-grid">
                <div class="ene-box"><div id="e-volts" class="ene-val">0.00</div><div class="ene-lbl">VOLTAJE (V)</div></div>
                <div class="ene-box"><div id="e-amps" class="ene-val">0</div><div class="ene-lbl">CORRIENTE (mA)</div></div>
                <div class="ene-box"><div id="e-watts" class="ene-val">0.00</div><div class="ene-lbl">POTENCIA (W)</div></div>
            </div>
        </div>
    `,
    onData: (val) => {
        if(val.v) document.getElementById('e-volts').innerText = parseFloat(val.v).toFixed(2);
        if(val.i) document.getElementById('e-amps').innerText = parseInt(val.i);
        if(val.w) document.getElementById('e-watts').innerText = parseFloat(val.w).toFixed(2);
    }
};
