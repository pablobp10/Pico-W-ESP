export const FiestaCard = {
    id: "Fiesta",
    // Tamaño 1x1
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%; gap:10px;">
            <div class="label" style="text-align:left;">MODO FIESTA</div>
            
            <div style="
                position: relative;
                flex-grow: 1;
                background: linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff);
                border-radius: 12px;
                overflow: hidden;
                box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
                transition: transform 0.1s;
            " id="color-wrapper">
                
                <input type="color" id="f-picker" value="#ff0000" style="
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%; height: 100%;
                    opacity: 0;
                    cursor: pointer;
                    padding: 0; margin: 0; border: none;
                ">
                
                <div style="
                    pointer-events: none;
                    position: absolute;
                    width: 100%; height: 100%;
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: 800; font-size: 1.2rem;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                ">
                    <i class="fa-solid fa-palette"></i>
                </div>
            </div>

            <button class="btn-action btn-off" id="f-off" style="
                margin: 0; 
                padding: 10px; 
                font-size: 0.8rem;
                background: #1c1c1e;
            ">APAGAR FIESTA</button>
        </div>
    `,
    onInit: (core) => {
        const picker = document.getElementById('f-picker');
        const wrapper = document.getElementById('color-wrapper');
        
        // Al cambiar el color (cuando sueltas el dedo/ratón)
        picker.onchange = (e) => {
            const hex = e.target.value; // Ej: "#ff0000"
            // Enviamos el código HEX a la Pico
            core.pub('Fiesta', hex, false);
            
            // Feedback visual inmediato en el botón
            wrapper.style.background = hex;
        };

        // Al mover el color (tiempo real, opcional)
        picker.oninput = (e) => {
            wrapper.style.background = e.target.value;
        };

        document.getElementById('f-off').onclick = () => {
            core.pub('Fiesta', 'off', false);
            // Restaurar gradiente arcoíris al apagar
            wrapper.style.background = "linear-gradient(45deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)";
        };
    },
    onData: (val) => {
        // Limpiamos cualquier estilo anterior
        document.body.style.backgroundColor = ""; 
        document.body.className = "";
        
        const wrapper = document.getElementById('color-wrapper');

        if(val && val !== "off") {
            // Si recibimos un color HEX (ej: #3b82f6)
            if(val.startsWith("#")) {
                document.body.style.backgroundColor = val; // Cambiar fondo web
                if(wrapper) wrapper.style.background = val; // Cambiar fondo botón
            } 
            // Si recibimos colores antiguos (texto) por compatibilidad
            else {
                document.body.classList.add("fiesta-" + val);
            }
        }
    }
};
