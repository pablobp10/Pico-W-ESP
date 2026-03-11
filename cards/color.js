export const ColorCard = {
    id: "Color",
    defaultSize: "1x1",
    html: `
        <style>
            #color-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; }
            .color-title { font-size: clamp(0.7rem, 8cqmin, 1.5rem); font-weight: 800; color: var(--text-sec); text-align: center; margin: 0; }
            #color-wheel-container { display: flex; justify-content: center; align-items: center; flex-grow: 1; width: 100%; padding: 2cqmin; }
            #color-wheel { width: 100% !important; display: flex; justify-content: center; align-items: center; }
            #color-wheel svg { width: clamp(80px, 80cqmin, 400px) !important; height: auto !important; overflow: visible; }
            
            @container (aspect-ratio > 1.2) {
                #color-wrapper { flex-direction: row; }
                .color-title { width: 30%; font-size: clamp(0.8rem, 8cqw, 2rem); }
                #color-wheel-container { width: 70%; }
                #color-wheel svg { width: clamp(80px, 80cqh, 400px) !important; }
            }
        </style>
        
        <div id="color-wrapper">
            <div class="color-title"><i class="fa-solid fa-palette" style="color:#e91e63"></i> CONTROL RGB</div>
            <div id="color-wheel-container"><div id="color-wheel"></div></div>
        </div>
    `,
    onInit: (core) => {
        if (!window.iro) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/@jaames/iro@5";
            script.onload = () => initPicker(core);
            document.head.appendChild(script);
        } else {
            initPicker(core);
        }

        function initPicker(core) {
            window.colorPicker = new iro.ColorPicker("#color-wheel", {
                width: 150, color: "#ffffff", borderWidth: 2, borderColor: "#fff",
                layout: [{ component: iro.ui.Wheel }]
            });
            let lastSend = 0;
            window.colorPicker.on('color:change', function(color) {
                const now = Date.now();
                if (now - lastSend > 200) { core.pub('Color', color.hexString, true); lastSend = now; }
            });
        }
    },
    onData: (val) => {
        if (window.colorPicker && val.startsWith("#")) window.colorPicker.color.hexString = val;
    },
    abrirAjustes: (core) => {
        if(confirm("¿Apagar LED RGB?")) {
            if (window.colorPicker) window.colorPicker.color.hexString = "#000000";
            core.pub('Color', "#000000", true);
        }
    }
};
