export const MedidorCard = {
    id: "Medidor",
    defaultSize: "1x1",
    html: `
        <style>
            #medidor-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; align-items:center; }
            .medidor-label { font-size: clamp(0.7rem, 8cqmin, 1.5rem); font-weight: bold; color: #007aff; align-self: flex-start; }
            #gauge-container { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
            #gauge-container svg { width: 100% !important; height: auto !important; max-height: 100%; }
        </style>
        
        <div id="medidor-wrapper">
            <div class="medidor-label"><i class="fa-solid fa-gauge-high"></i> <span id="med-title">MÉTRICA</span></div>
            <div id="gauge-container"></div>
        </div>
    `,
    onInit: (core) => {
        const titleText = localStorage.getItem('pico_medidor_title') || "MÉTRICA";
        const symbolText = localStorage.getItem('pico_medidor_sym') || "%";
        document.getElementById('med-title').innerText = titleText;

        const loadLib = (src) => {
            return new Promise((resolve) => {
                if (document.querySelector(`script[src="${src}"]`)) return resolve();
                const s = document.createElement('script');
                s.src = src; s.onload = resolve; document.head.appendChild(s);
            });
        };

        loadLib("https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js")
            .then(() => loadLib("https://cdnjs.cloudflare.com/ajax/libs/justgage/1.4.0/justgage.min.js"))
            .then(() => {
                window.miGauge = new JustGage({
                    id: "gauge-container",
                    value: 0, min: 0, max: 100, title: "", label: symbolText,
                    pointer: true, pointerOptions: { color: '#8e8e93' },
                    gaugeWidthScale: 0.6, counter: true, relativeGaugeSize: true
                });
            });
    },
    onData: (val) => {
        const num = parseFloat(val);
        if (window.miGauge && !isNaN(num)) window.miGauge.refresh(num);
    },
    abrirAjustes: (core) => {
        let t = prompt("Nombre de la métrica:", localStorage.getItem('pico_medidor_title') || "CPU");
        let s = prompt("Símbolo (ej: %, °C, rpm):", localStorage.getItem('pico_medidor_sym') || "%");
        if(t !== null) localStorage.setItem('pico_medidor_title', t);
        if(s !== null) localStorage.setItem('pico_medidor_sym', s);
        core.notificar("Refresca la página para aplicar", "🔄");
    }
};
