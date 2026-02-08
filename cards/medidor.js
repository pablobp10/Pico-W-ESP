 export const MedidorCard = {
    id: "Medidor",
    // Tamaño 1x1
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%">
            <div class="label"><i class="fa-solid fa-gauge-high" style="color:#007aff"></i> CPU / TEMP</div>
            <div id="gauge-container" style="width:100%; height:100%;"></div>
        </div>
    `,
    onInit: (core) => {
        // Cargar Raphael (dependencia) y JustGage
        const loadLib = (src) => {
            return new Promise((resolve) => {
                if (document.querySelector(`script[src="${src}"]`)) return resolve();
                const s = document.createElement('script');
                s.src = src;
                s.onload = resolve;
                document.head.appendChild(s);
            });
        };

        // Carga secuencial
        loadLib("https://cdnjs.cloudflare.com/ajax/libs/raphael/2.3.0/raphael.min.js")
            .then(() => loadLib("https://cdnjs.cloudflare.com/ajax/libs/justgage/1.4.0/justgage.min.js"))
            .then(() => {
                window.miGauge = new JustGage({
                    id: "gauge-container",
                    value: 0,
                    min: 0,
                    max: 100,
                    title: "",
                    label: "%",
                    pointer: true,
                    pointerOptions: {
                        toplength: -15,
                        bottomlength: 10,
                        bottomwidth: 12,
                        color: '#8e8e93',
                        stroke: '#ffffff',
                        stroke_width: 3,
                        stroke_linecap: 'round'
                    },
                    gaugeWidthScale: 0.6,
                    counter: true,
                    relativeGaugeSize: true,
                    donut: false 
                });
            });
    },
    onData: (val) => {
        // Espera un número entre 0 y 100
        const num = parseFloat(val);
        if (window.miGauge && !isNaN(num)) {
            window.miGauge.refresh(num);
        }
    }
};

