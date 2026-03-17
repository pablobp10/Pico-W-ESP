export const MedidorCard = {
    id: "Medidor",
    category: "sensores",
    rol: "guest",
    defaultSize: "1x1",
    
    // Botón superior izquierdo personalizado (igual que el del tiempo)
    customAccion: {
        titulo: "Cambiar Métrica",
        icono: "fa-solid fa-rotate",
        color: "#0a84ff",
        ejecutar: (core) => {
            // Ciclar entre diferentes métricas de telemetría de la Pico
            const metricas = ['cpu', 'ram', 'temp', 'humedad'];
            let current = localStorage.getItem('pico_medidor_metric') || 'cpu';
            let nextIdx = (metricas.indexOf(current) + 1) % metricas.length;
            let next = metricas[nextIdx];
            
            localStorage.setItem('pico_medidor_metric', next);
            MedidorCard.onInit(core); // Recargamos la UI
            core.notificar(`Métrica: ${next.toUpperCase()}`, "🔄");
            core.vibra("tick");
        }
    },
    
    html: `
        <style>
            #medidor-wrapper { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; width: 100%; position: relative; box-sizing: border-box; padding: 5px; }
            #medidor-label { font-size: clamp(0.6rem, 12cqmin, 0.85rem); font-weight: 800; color: var(--text-sec); letter-spacing: 1px; margin-bottom: auto; margin-top: 5px; }
            
            /* Contenedor del Gráfico Vectorial */
            .gauge-container { position: relative; width: 100%; max-width: 160px; margin: auto; display: flex; justify-content: center; align-items: center; }
            .gauge-svg { width: 100%; height: auto; overflow: visible; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
            
            /* Arco de fondo */
            .gauge-bg { fill: none; stroke: rgba(255,255,255,0.08); stroke-width: 12; stroke-linecap: round; }
            
            /* Arco de valor (El trazo total mide 125.66 px) */
            .gauge-val { 
                fill: none; stroke: #32d74b; stroke-width: 12; stroke-linecap: round; 
                stroke-dasharray: 125.66; stroke-dashoffset: 125.66; 
                transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease; 
            }
            
            /* Textos centrales */
            #medidor-val-container { position: absolute; bottom: 0; left: 0; width: 100%; text-align: center; transform: translateY(15%); }
            #medidor-val { font-size: clamp(1.5rem, 28cqmin, 2.5rem); font-weight: 900; color: var(--text-main); line-height: 1; }
            #medidor-unit { font-size: clamp(0.7rem, 12cqmin, 1rem); color: var(--text-sec); font-weight: bold; margin-left: 2px; }
            
            /* Clases dinámicas de peligro generadas por IA */
            .gauge-warning { stroke: #ff9f0a !important; filter: drop-shadow(0 0 8px rgba(255,159,10,0.6)); }
            .gauge-danger { stroke: #ff453a !important; filter: drop-shadow(0 0 10px rgba(255,69,58,0.8)); animation: pulse-danger 1s infinite alternate; }
            @keyframes pulse-danger { from { filter: drop-shadow(0 0 5px rgba(255,69,58,0.5)); } to { filter: drop-shadow(0 0 15px rgba(255,69,58,1)); } }
        </style>
        
        <div id="medidor-wrapper">
            <div id="medidor-label">MÉTRICA</div>
            
            <div class="gauge-container">
                <svg class="gauge-svg" viewBox="0 0 100 50">
                    <path class="gauge-bg" d="M 10 50 A 40 40 0 0 1 90 50" />
                    <path id="medidor-path" class="gauge-val" d="M 10 50 A 40 40 0 0 1 90 50" />
                </svg>
                
                <div id="medidor-val-container">
                    <span id="medidor-val" class="val-text">--</span><span id="medidor-unit">%</span>
                </div>
            </div>
        </div>
    `,

    onInit: (core) => {
        // Cargar preferencias
        const current = localStorage.getItem('pico_medidor_metric') || 'cpu';
        const labels = { cpu: "USO DE CPU", ram: "MEMORIA RAM", temp: "TEMPERATURA", humedad: "HUMEDAD" };
        const units = { cpu: "%", ram: "%", temp: "°C", humedad: "%" };
        
        // Poner textos por defecto
        document.getElementById('medidor-label').innerText = labels[current] || "MÉTRICA";
        document.getElementById('medidor-unit').innerText = units[current] || "";
        document.getElementById('medidor-val').innerText = "--";
        document.getElementById('medidor-path').style.strokeDashoffset = 125.66; // Vacío
    },

    onData: (val) => {
        if (!val) return;
        
        const currentMetric = localStorage.getItem('pico_medidor_metric') || 'cpu';
        let valor = null;
        let max = 100;
        let unit = "%";
        
        // Extraer el dato exacto según la métrica que el usuario haya seleccionado
        if (currentMetric === 'cpu' && val.cpu !== undefined) { valor = val.cpu; }
        else if (currentMetric === 'ram' && val.r_pct !== undefined) { valor = val.r_pct; }
        else if (currentMetric === 'ram' && val.ram !== undefined) { valor = Math.round((((264 * 1024) - val.ram) / (264 * 1024)) * 100); }
        else if (currentMetric === 'temp' && val.t !== undefined) { valor = val.t; unit = "°C"; max = 80; } // Asumimos 80C como techo térmico
        else if (currentMetric === 'temp' && val.temp !== undefined) { valor = val.temp; unit = "°C"; max = 80; }
        else if (currentMetric === 'humedad' && val.hum !== undefined) { valor = val.hum; }
        
        // Si el payload MQTT no traía este dato, salimos silenciosamente
        if (valor === null) return; 
        
        // Escribir el texto
        document.getElementById('medidor-val').innerText = Math.round(valor);
        document.getElementById('medidor-unit').innerText = unit;
        
        // 🧮 Motor de Renderizado Vectorial (Matemáticas puras)
        const path = document.getElementById('medidor-path');
        let percentage = valor / max;
        if (percentage > 1) percentage = 1;
        if (percentage < 0) percentage = 0;
        
        // El arco total mide 125.66. Le restamos el porcentaje para "llenarlo" visualmente
        const offset = 125.66 - (percentage * 125.66);
        path.style.strokeDashoffset = offset;
        
        // 🚦 Sistema de Alertas por colores
        path.classList.remove('gauge-warning', 'gauge-danger');
        if (percentage >= 0.85) {
            path.classList.add('gauge-danger'); // Rojo palpitante
        } else if (percentage >= 0.65) {
            path.classList.add('gauge-warning'); // Naranja
        }
    },

    abrirAjustes: (core) => {
        const current = localStorage.getItem('pico_medidor_metric') || 'cpu';
        const nuevo = prompt("Escribe la métrica a visualizar (cpu, ram, temp, humedad):", current);
        
        if (nuevo && ['cpu', 'ram', 'temp', 'humedad'].includes(nuevo.toLowerCase().trim())) {
            localStorage.setItem('pico_medidor_metric', nuevo.toLowerCase().trim());
            core.notificar("Métrica enlazada", "✅");
            MedidorCard.onInit(core);
        } else if (nuevo) {
            core.notificar("Métrica desconocida", "❌");
        }
    }
};
