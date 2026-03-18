export const DadoCard = {
    id: "Dado",
    defaultSize: "1x1",
    customAccion: {
        titulo: "Tirada Doble (Con Ventaja)",
        icono: "fa-solid fa-dice",
        color: "#8b5cf6",
        ejecutar: (core) => {
            const caras = parseInt(localStorage.getItem('pico_dado_faces')) || 6;
            const t1 = Math.floor(Math.random() * caras) + 1;
            const t2 = Math.floor(Math.random() * caras) + 1;
            const mejor = Math.max(t1, t2);
            core.notificar(`Tiraste ${t1} y ${t2}. ¡Te quedas con el ${mejor}!`, "🎲");
            core.cmd('Dado', mejor);
        }
    },
    html: `
        <style>
            #dado-wrapper { display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; height: 100%; width: 100%; box-sizing: border-box; padding: 5cqmin; }
            .dado-icon-box { flex-grow: 1; display: flex; justify-content: center; align-items: center; color: var(--text-main); position: relative; }
            #dice-icon { font-size: clamp(3rem, 40cqmin, 8rem); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            #dice-number { position: absolute; font-weight: 900; font-size: clamp(1rem, 15cqmin, 3rem); color: var(--bg); top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0; transition: 0.3s; }
            .dado-label { font-size: clamp(0.7rem, 8cqmin, 1.5rem); font-weight: 700; text-transform: uppercase; color: var(--text-sec); }
            #btn-dado { width: 100%; padding: clamp(10px, 6cqmin, 24px); font-size: clamp(0.8rem, 8cqmin, 2rem); margin-top: 3cqmin; border-radius: clamp(8px, 4cqmin, 16px); background: #8b5cf6; }
            
            @container (aspect-ratio > 1.2) {
                #dado-wrapper { flex-direction: row; justify-content: space-around; }
                .dado-icon-box { width: 50%; }
                #dice-icon { font-size: clamp(3rem, 60cqh, 10rem); }
                #dice-number { font-size: clamp(1rem, 20cqh, 4rem); }
                .dado-controls { width: 45%; display: flex; flex-direction: column; justify-content: center; gap: 10px; }
                #btn-dado { margin-top: 0; }
            }
        </style>
        
        <div id="dado-wrapper">
            <div class="dado-icon-box">
                <i class="fa-solid fa-dice-d6" id="dice-icon"></i>
                <span id="dice-number"></span>
            </div>
            <div class="dado-controls" style="width:100%; text-align:center;">
                <div class="dado-label">Juego</div>
                <button class="btn-action" id="btn-dado">TIRAR</button>
            </div>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('btn-dado').onclick = () => {
            const caras = parseInt(localStorage.getItem('pico_dado_faces')) || 6;
            const resultado = Math.floor(Math.random() * caras) + 1;
            core.cmd('Dado', resultado);
        };
    },
    onData: (val) => {
        const num = parseInt(val);
        if(!isNaN(num)) {
            const ico = document.getElementById('dice-icon');
            const numText = document.getElementById('dice-number');
            const carasVisuales = ["", "dice-one", "dice-two", "dice-three", "dice-four", "dice-five", "dice-six"];
            
            const randomRotation = Math.floor(Math.random() * 1080) + 360; 
            ico.style.transform = `rotate(${randomRotation}deg)`;
            
            if (num >= 1 && num <= 6) {
                ico.className = `fa-solid fa-${carasVisuales[num]}`;
                numText.style.opacity = '0';
            } else {
                ico.className = "fa-solid fa-dice-d20";
                numText.innerText = num;
                setTimeout(() => numText.style.opacity = '1', 250);
            }
        }
    },
    abrirAjustes: (core) => {
        let faces = prompt("Número de caras del dado (Ej: 6, 12, 20):", localStorage.getItem('pico_dado_faces') || "6");
        if(faces && !isNaN(faces)) {
            localStorage.setItem('pico_dado_faces', faces);
            core.notificar(`Dado configurado a D${faces}`, "🎲");
        }
    }
};
