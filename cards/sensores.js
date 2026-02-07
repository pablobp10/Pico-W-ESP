export const SensoresCard = {
    id: "Sensores",
    size: "super-wide", // Empieza ocupando 3 columnas x 1 fila
    html: `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; padding:0 10px; box-sizing:border-box">
            <div style="display:flex; gap:20px; align-items:center;">
                <div style="text-align:center"><div class="val-text" id="val-s-temp" style="margin:0; font-size:2rem">--°</div><div class="label">TEMP</div></div>
                <div style="height:30px; border-left:1px solid var(--border)"></div>
                <div style="text-align:center"><div class="val-text" id="val-s-hum" style="margin:0; font-size:2rem">--%</div><div class="label">HUM</div></div>
            </div>
            <div class="switch-group">
                <div class="mini-switch-row"><span>Grabar</span><label class="toggle-switch"><input type="checkbox" id="sw-ts-rec"><span class="slider"></span></label></div>
                <div class="mini-switch-row"><span>Gráfica</span><label class="toggle-switch"><input type="checkbox" id="sw-show-graph"><span class="slider"></span></label></div>
            </div>
        </div>
        <iframe id="ts-iframe"></iframe>
    `,
    onInit: (core) => {
        document.getElementById('sw-ts-rec').onchange = (e) => core.cmd('Sensores', e.target.checked ? 'TS_ON' : 'TS_OFF');
        
        document.getElementById('sw-show-graph').onchange = (e) => {
            const f = document.getElementById('ts-iframe');
            const card = document.getElementById('card-Sensores');
            
            if(e.target.checked) {
                // ACTIVAR MODO 3x2
                card.classList.add('graph-active'); // CSS hace que ocupe span 2 rows
                f.classList.add('active');
                
                if(core.conf && core.conf.ch) {
                    const isDark = document.body.getAttribute('data-theme') === 'dark';
                    const color = isDark ? '0a84ff' : '007aff';
                    const bg = isDark ? '000000' : 'f2f2f7';
                    let u = `https://thingspeak.com/channels/${core.conf.ch}/charts/1?bgcolor=%23${bg}&color=%23${color}&dynamic=true&results=60&type=line&title=`;
                    if(core.conf.rk) u += `&api_key=${core.conf.rk}`;
                    f.src = u;
                }
            } else { 
                // VOLVER A MODO 3x1
                card.classList.remove('graph-active');
                f.classList.remove('active'); 
                f.src = ""; 
            }
        };
    },
    onData: (val) => {
        if(val.datos) { 
            document.getElementById('val-s-temp').innerText = val.datos.temp + "°"; 
            document.getElementById('val-s-hum').innerText = val.datos.hum; 
        }
        if(val.ts_activo !== undefined) document.getElementById('sw-ts-rec').checked = val.ts_activo;
    }
};
