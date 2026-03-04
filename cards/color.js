 export const ColorCard = {
    id: "Color",
    html: `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%">
            <div class="label" style="margin-bottom:10px">
                <i class="fa-solid fa-palette" style="color:#e91e63"></i> CONTROL RGB
            </div>
            <div id="color-wheel"></div>
        </div>
    `,
    onInit: (core) => {
        // 1. Cargar Librería dinámicamente
        if (!window.iro) {
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/@jaames/iro@5";
            script.onload = () => initPicker(core);
            document.head.appendChild(script);
        } else {
            initPicker(core);
        }
    },
    onData: (val) => {
        // Si recibimos un color por MQTT (ej: "#ff0000"), actualizamos la rueda
        // (Solo si la librería ya cargó y existe la instancia)
        if (window.colorPicker && val.startsWith("#")) {
            window.colorPicker.color.hexString = val;
        }
    }
};

function initPicker(core) {
    // 2. Configurar la Rueda
    window.colorPicker = new iro.ColorPicker("#color-wheel", {
        width: 120,          // Tamaño
        color: "#ffffff",    // Color inicial
        borderWidth: 2,
        borderColor: "#fff",
        layout: [
            { component: iro.ui.Wheel },
        ]
    });

    // 3. Escuchar cambios (con un pequeño freno para no saturar MQTT)
    let lastSend = 0;
    window.colorPicker.on('color:change', function(color) {
        const now = Date.now();
        if (now - lastSend > 200) { // Enviar máximo cada 200ms
            const hex = color.hexString;
            // Publica al topic: PicoOS_XXXX/estado/Color -> "#FF0000"
            core.pub('Color', hex, true); 
            lastSend = now;
        }
    });
}

