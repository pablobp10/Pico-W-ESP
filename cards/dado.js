export const DadoCard = {
    id: "Dado",
    html: `
        <div style="height:60px; display:flex; justify-content:center; align-items:center; font-size:3rem; color:var(--text-main)">
            <i class="fa-solid fa-dice-d6" id="dice-icon" style="transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></i>
        </div>
        <div class="label">Juego</div>
        <button class="btn-action" style="background:#8b5cf6" id="btn-dado">TIRAR</button>
    `,
    onInit: (core) => {
        // Al pulsar manualmente, publica en el broker para que lo vean todos
        document.getElementById('btn-dado').onclick = () => core.pub('Dado', Math.floor(Math.random()*6)+1, false);
    },
    onData: (val) => {
        const caras = ["", "dice-one", "dice-two", "dice-three", "dice-four", "dice-five", "dice-six"];
        const num = parseInt(val);
        
        if(num >= 1 && num <= 6) {
            const ico = document.getElementById('dice-icon');
            // Generamos un ángulo loco para que ruede (entre 1 y 3 vueltas completas)
            const randomRotation = Math.floor(Math.random() * 1080) + 360; 
            
            // Aplicamos el giro y la cara final al mismo tiempo
            ico.style.transform = `rotate(${randomRotation}deg)`;
            ico.className = `fa-solid fa-${caras[num]}`;
        }
    }
};
