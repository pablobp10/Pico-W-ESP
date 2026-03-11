export const SensoresCard = {
    id: "Sensores",
    defaultSize: "3x2",
    html: `
        <style>
            #sens-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; }
            .sens-top { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 10px; box-sizing: border-box; }
            .sens-data-row { display: flex; gap: clamp(10px, 4cqmin, 30px); align-items: center; }
            .sens-num { margin: 0; font-size: clamp(1.5rem, 10cqmin, 4rem); font-weight: 800; line-height: 1; color: var(--text-main); }
            .sens-div { height: clamp(20px, 8cqmin, 40px); border-left: 1px solid var(--border); }
            .sens-label { font-size: clamp(0.6rem, 3cqmin, 1rem); color: var(--text-sec); font-weight: bold; }
        </style>
        
        <div id="sens-wrapper">
            <div class="sens-top">
                <div class="sens-data-row">
                    <div style="text-align:center"><div class="sens-num" id="val-s-temp">--°</div><div class="sens-label">TEMP</div></div>
                    <div class="sens-div"></div>
                    <div style="text-align:center"><div class="sens-num" id="val-s-hum">--%</div><div class="sens-label">HUM</div></div>
                </div>
                <div class="switch-group">
                    <div class="mini-switch-row"><span>Grabar</span><label class="toggle-switch"><input type="checkbox" id="sw-ts-rec"><span class="slider"></span></label></div>
                    <div class="mini-switch-row"><span>Gráfica</span><label class="toggle-switch"><input type="checkbox" id="sw-show-graph"><span class="slider"></span></label></div>
                </div>
            </div>
            <iframe id="ts-iframe"></iframe>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('sw-ts-rec').onchange = (e) => core.cmd('Sensores', e.target.checked ? 'TS_ON' : 'TS_OFF');
        
        document.getElementById('sw-show-graph').onchange = (e) => {
            const f = document.getElementById('ts-iframe');
            const card = document.getElementById('card-Sensores');
            
            if(e.target.checked) {
                card.classList.add('graph-active'); // Expande hacia abajo
                f.classList.add('active');
                
                let ch = localStorage.getItem('pico_ts_ch') || (core.conf && core.conf.ch);
                if(ch) {
                    const isDark = document.body.getAttribute('data-theme') === 'dark';
                    const color = isDark ? '0a84ff' : '007aff';
                    const bg = isDark ? '000000' : 'f2f2f7';
                    let u = `https://thingspeak.com/channels/${ch}/charts/1?bgcolor=%23${bg}&color=%23${color}&dynamic=true&results=60&type=line&title=`;
                    f.src = u;
                } else {
                    core.notificar("Canal de ThingSpeak no configurado", "⚠️");
                }
            } else { 
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
    },
    abrirAjustes: (core) => {
        let ch = prompt("ID del Canal de ThingSpeak:", localStorage.getItem('pico_ts_ch') || "");
        if(ch) { localStorage.setItem('pico_ts_ch', ch); core.notificar("Canal Guardado", "📊"); }
    }
};
