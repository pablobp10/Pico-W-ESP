export const RelojCard = {
    id: "Clock",
    category: "info", // Le añadimos categoría para que funcione con los filtros
    defaultSize: "1x2",
    customAccion: {
        titulo: "Mostrar Segundos",
        icono: "fa-solid fa-stopwatch",
        color: "#22c55e",
        ejecutar: (core) => {
            const isSecs = localStorage.getItem('pico_clock_secs') === 'true';
            localStorage.setItem('pico_clock_secs', isSecs ? 'false' : 'true');
            core.notificar(isSecs ? "Segundos ocultos" : "Segundos visibles", "⏱️");
        }
    },
    html: `
        <style>
            #clock-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; }
            .clock-icon-row { text-align: center; padding-bottom: 5px; border-bottom: 1px solid var(--border); }
            .clock-vertical-container { display: flex; flex-direction: column; justify-content: space-around; flex-grow: 1; padding: 5px 0; }
            .clock-city-block { display: flex; flex-direction: column; align-items: center; gap: 2px; }
            .clock-city-name { font-size: clamp(0.6rem, 5cqmin, 1rem); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .clock-city-time { font-size: clamp(1.5rem, 15cqmin, 4rem); font-weight: 300; color: var(--text-main); font-variant-numeric: tabular-nums; line-height: 1; transition: 0.2s;}
            
            @container (aspect-ratio > 1.5) {
                .clock-vertical-container { flex-direction: row; align-items: center; }
                .clock-icon-row { border-bottom: none; border-right: 1px solid var(--border); padding-right: 15px; display:flex; align-items:center; }
                #clock-wrapper { flex-direction: row; }
            }
        </style>
        
        <div id="clock-wrapper">
            <div class="clock-icon-row"><i class="fa-solid fa-earth-americas icon" style="font-size:clamp(1.5rem, 10cqmin, 3rem); margin:0; color:#6366f1"></i></div>
            <div class="clock-vertical-container">
                <div class="clock-city-block">
                    <div class="clock-city-name" style="color:#ef4444" id="c-name-1">Madrid</div>
                    <div id="clock-mad" class="clock-city-time">--:--</div>
                </div>
                <div class="clock-city-block">
                    <div class="clock-city-name" style="color:#3b82f6" id="c-name-2">Londres</div>
                    <div id="clock-lon" class="clock-city-time">--:--</div>
                </div>
                <div class="clock-city-block">
                    <div class="clock-city-name" style="color:#22c55e" id="c-name-3">New York</div>
                    <div id="clock-nyc" class="clock-city-time">--:--</div>
                </div>
            </div>
        </div>
    `,
    onInit: () => {
        // 1. Evitar errores si la tarjeta no está renderizada aún
        const c1 = document.getElementById('c-name-1');
        if (c1) c1.innerText = localStorage.getItem('pico_c1') || "Madrid";
        const c2 = document.getElementById('c-name-2');
        if (c2) c2.innerText = localStorage.getItem('pico_c2') || "Londres";
        const c3 = document.getElementById('c-name-3');
        if (c3) c3.innerText = localStorage.getItem('pico_c3') || "New York";

        // 2. Destruir motores viejos (evita lagazos y solapamientos al recargar el grid)
        if (window.picoClockInterval) clearInterval(window.picoClockInterval);

        const update = () => {
            const clockMad = document.getElementById('clock-mad');
            
            // 3. PARCHE: Si el reloj no está en pantalla por los filtros, abortamos la actualización en silencio
            if (!clockMad) return;

            const now = new Date();
            const showSecs = localStorage.getItem('pico_clock_secs') === 'true';
            const opt = showSecs ? {hour:'2-digit', minute:'2-digit', second:'2-digit'} : {hour:'2-digit', minute:'2-digit'};
            
            clockMad.innerText = now.toLocaleTimeString('es-ES', {...opt});
            document.getElementById('clock-lon').innerText = now.toLocaleTimeString('en-GB', {...opt, timeZone:'Europe/London'});
            document.getElementById('clock-nyc').innerText = now.toLocaleTimeString('en-US', {...opt, timeZone:'America/New_York'});
        };
        
        window.picoClockInterval = setInterval(update, 1000); 
        update(); 
    },
    abrirAjustes: (core) => {
        let c = prompt("Nombre etiqueta 1 (Ej: Tokio):", localStorage.getItem('pico_c1') || "Madrid");
        if(c) { 
            localStorage.setItem('pico_c1', c); 
            const c1 = document.getElementById('c-name-1');
            if (c1) c1.innerText = c; 
        }
    }
};
