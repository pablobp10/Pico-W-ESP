export const SensoresCard = {
    id: "Sensores",
    defaultSize: "2x1",
    customAccion: {
        titulo: "Gráfica ThingSpeak",
        icono: "fa-solid fa-chart-line",
        color: "#0a84ff",
        ejecutar: (core) => {
            const card = document.getElementById('card-Sensores');
            const f = document.getElementById('ts-iframe');
            
            if (card.classList.contains('modo-grafica')) {
                card.classList.remove('modo-grafica');
                card.style.gridRowEnd = ""; 
                f.classList.remove('active');
                f.src = "";
            } else {
                card.classList.add('modo-grafica');
                card.style.gridRowEnd = "span 2"; 
                f.classList.add('active');
                
                let ch = localStorage.getItem('pico_ts_ch') || (core.conf && core.conf.ch);
                if (ch) {
                    const isDark = document.body.getAttribute('data-theme') === 'dark';
                    const color = isDark ? '0a84ff' : '007aff';
                    const bg = isDark ? '000000' : 'f2f2f7';
                    f.src = `https://thingspeak.com/channels/${ch}/charts/1?bgcolor=%23${bg}&color=%23${color}&dynamic=true&results=60&type=line`;
                } else {
                    core.notificar("Canal de ThingSpeak no configurado", "⚠️");
                }
            }
        }
    },
    html: `
        <style>
            #sens-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; }
            .sens-top { display: flex; justify-content: space-around; align-items: center; width: 100%; height: 100%; padding: 15px 10px; box-sizing: border-box; }
            .sens-data-row { display: flex; width: 100%; justify-content: space-around; align-items: center; gap: 5px; }
            .sens-num { margin: 0; font-size: clamp(1.2rem, 15cqmin, 3rem); font-weight: 800; line-height: 1; color: var(--text-main); }
            .sens-div { height: clamp(20px, 15cqmin, 40px); border-left: 1px solid var(--border); }
            .sens-label { font-size: clamp(0.6rem, 6cqmin, 0.9rem); color: var(--text-sec); font-weight: bold; margin-top: 5px; text-transform: uppercase;}
            
            #ts-iframe { display: none; width: calc(100% + 30px); height: 100%; border: none; margin: 0 -15px -15px -15px; background: var(--bg); border-radius: 0 0 20px 20px; flex-grow: 1; }
            #ts-iframe.active { display: block; }
            #card-Sensores.modo-grafica .sens-top { height: auto; }
        </style>
        
        <div id="sens-wrapper">
            <div class="sens-top">
                <div class="sens-data-row">
                    <div style="text-align:center"><div class="sens-num" id="val-s-temp">--°</div><div class="sens-label">TEMP</div></div>
                    <div class="sens-div"></div>
                    <div style="text-align:center"><div class="sens-num" id="val-s-hum">--%</div><div class="sens-label">HUM</div></div>
                    <div class="sens-div"></div>
                    <div style="text-align:center"><div class="sens-num" id="val-s-pres">--</div><div class="sens-label">hPa</div></div>
                </div>
            </div>
            <iframe id="ts-iframe"></iframe>
        </div>
    `,
    onData: (val) => {
        if(val.datos) { 
            if(val.datos.temp) document.getElementById('val-s-temp').innerText = val.datos.temp + "°"; 
            if(val.datos.hum) document.getElementById('val-s-hum').innerText = val.datos.hum + "%"; 
            if(val.datos.pres) document.getElementById('val-s-pres').innerText = val.datos.pres; 
        }
    },
    abrirAjustes: (core) => {
        let ch = prompt("ID del Canal de ThingSpeak:", localStorage.getItem('pico_ts_ch') || "");
        if(ch) { localStorage.setItem('pico_ts_ch', ch); core.notificar("Canal Guardado", "📊"); }
    }
};
