export const ColorCard = {
    id: "Color",
    defaultSize: "1x1",
    customAccion: {
        titulo: "Apagar Luz RGB",
        icono: "fa-solid fa-power-off",
        color: "#000000",
        ejecutar: (core) => {
            if (window.colorPicker) {
                window.colorPicker.color.hexString = "#000000";
                core.pub('Color', '#000000', true);
                core.notificar("RGB Apagado", "🌑");
            }
        }
    },
    html: `
        <style>
            #color-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; width: 100%; box-sizing: border-box; padding: 10px; }
            #color-wheel { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; }
            #color-wheel svg { max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; }
        </style>
        
        <div id="color-wrapper">
            <div id="color-wheel"></div>
        </div>
    `,
    onInit: (core) => {
        if (!window.iro) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/@jaames/iro@5";
            script.onload = () => initPicker(core);
            document.head.appendChild(script);
        } else { initPicker(core); }

        function initPicker(core) {
            window.colorPicker = new iro.ColorPicker("#color-wheel", {
                width: 250, 
                color: "#ffffff", borderWidth: 2, borderColor: "#fff",
                layout: [{ component: iro.ui.Wheel }]
            });
            let lastSend = 0;
            window.colorPicker.on('color:change', function(color) {
                const now = Date.now();
                if (now - lastSend > 200) { core.pub('Color', color.hexString, true); lastSend = now; }
            });
        }
    },
    onData: (val) => { if (window.colorPicker && val.startsWith("#")) window.colorPicker.color.hexString = val; }
};
