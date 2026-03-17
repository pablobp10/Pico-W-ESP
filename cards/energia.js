export const EnergiaCard = {
    id: "Energia",
    category: "sistema",
    rol: "admin",
    defaultSize: "2x1",
    html: `
        <div style="display:flex; justify-content:space-around; align-items:center; height:100%; width:100%;">
            <div style="display:flex; flex-direction:column; align-items:center;">
                <i class="fa-solid fa-bolt" style="color:#facc15; font-size:1.5rem; margin-bottom:5px;"></i>
                <span id="ener-watts" class="val-text" style="font-size:1.8rem; font-weight:900; color:var(--text-main);">0</span>
                <span style="font-size:0.7rem; color:var(--text-sec); font-weight:bold;">WATTS</span>
            </div>
            <div style="width:1px; height:60%; background:var(--border);"></div>
            <div style="display:flex; flex-direction:column; align-items:center;">
                <span id="ener-volts" style="font-size:1.2rem; font-weight:bold; color:var(--text-main);">230V</span>
                <span id="ener-amps" style="font-size:1.2rem; font-weight:bold; color:#0a84ff; margin-top:5px;">0.0A</span>
            </div>
        </div>
    `,
    onData: (val) => {
        if(!val) return;
        if(val.w !== undefined) document.getElementById('ener-watts').innerText = val.w;
        if(val.v !== undefined) document.getElementById('ener-volts').innerText = val.v + "V";
        if(val.a !== undefined) document.getElementById('ener-amps').innerText = val.a + "A";
    }
};
