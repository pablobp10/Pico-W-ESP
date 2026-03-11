export const PlantaCard = {
    id: "Planta",
    category: "sensores",
    defaultSize: "1x2",
    customAccion: {
        titulo: "Regar (Bomba ON)",
        icono: "fa-solid fa-droplet",
        color: "#0ea5e9",
        ejecutar: (core) => {
            core.cmd('Planta', 'REGAR_5S');
            core.notificar("Bomba de agua activada 5s", "💧");
        }
    },
    html: `
        <style>
            #planta-wrapper { display: flex; flex-direction: column; align-items: center; justify-content: space-evenly; height: 100%; width: 100%; box-sizing: border-box; padding: 10px; }
            #planta-svg { width: clamp(60px, 60cqmin, 150px); height: auto; transition: 1s ease-in-out; }
            .hoja { transform-origin: bottom center; transition: 1s ease-in-out; }
            #hum-tierra { font-size: clamp(1.5rem, 20cqmin, 3rem); font-weight: 800; color: var(--text-main); margin-top: 10px; }
            .planta-label { font-size: clamp(0.7rem, 8cqmin, 1rem); font-weight: bold; color: var(--text-sec); text-transform: uppercase; }
            
            @container (aspect-ratio > 1.2) {
                #planta-wrapper { flex-direction: row; justify-content: space-around; }
            }
        </style>
        
        <div id="planta-wrapper">
            <svg id="planta-svg" viewBox="0 0 100 100">
                <path d="M48 100 L48 40 L52 40 L52 100 Z" fill="#8b5cf6" id="tallo"/>
                <path class="hoja" id="hoja-izq" d="M48 70 Q 20 70 20 40 Q 35 40 48 60 Z" fill="#32d74b"/>
                <path class="hoja" id="hoja-der" d="M52 60 Q 80 60 80 30 Q 65 30 52 50 Z" fill="#32d74b"/>
                <path class="hoja" id="hoja-cen" d="M45 45 Q 50 10 55 45 Q 50 20 45 45 Z" fill="#32d74b"/>
            </svg>
            <div style="text-align:center">
                <div id="hum-tierra">--%</div>
                <div class="planta-label">Tierra</div>
            </div>
        </div>
    `,
    onData: (val) => {
        const hum = parseInt(val);
        if (isNaN(hum)) return;
        document.getElementById('hum-tierra').innerText = `${hum}%`;
        
        const izq = document.getElementById('hoja-izq');
        const der = document.getElementById('hoja-der');
        const cen = document.getElementById('hoja-cen');
        
        // Matemáticas de marchitación
        if (hum < 30) {
            izq.style.transform = "rotate(-40deg)"; izq.style.fill = "#d97706";
            der.style.transform = "rotate(40deg)"; der.style.fill = "#d97706";
            cen.style.transform = "scaleY(0.5) translateY(10px)"; cen.style.fill = "#b45309";
        } else if (hum < 60) {
            izq.style.transform = "rotate(-20deg)"; izq.style.fill = "#84cc16";
            der.style.transform = "rotate(20deg)"; der.style.fill = "#84cc16";
            cen.style.transform = "scaleY(0.8)"; cen.style.fill = "#65a30d";
        } else {
            izq.style.transform = "rotate(0deg)"; izq.style.fill = "#32d74b";
            der.style.transform = "rotate(0deg)"; der.style.fill = "#32d74b";
            cen.style.transform = "scaleY(1)"; cen.style.fill = "#22c55e";
        }
    }
};
