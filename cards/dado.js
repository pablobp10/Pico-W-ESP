 export const DadoCard = {
    id: "Dado",
    html: `
        <div style="height:60px; display:flex; justify-content:center; align-items:center; font-size:3rem; color:var(--text-main)">
            <i class="fa-solid fa-dice-d6" id="dice-icon"></i>
        </div>
        <div class="label">Juego</div>
        <button class="btn-action" style="background:#8b5cf6" id="btn-dado">TIRAR</button>
    `,
    onInit: (core) => {
        document.getElementById('btn-dado').onclick = () => core.pub('Dado', Math.floor(Math.random()*6)+1, false);
    },
    onData: (val) => {
        const caras = ["", "dice-one", "dice-two", "dice-three", "dice-four", "dice-five", "dice-six"];
        const num = parseInt(val);
        if(num >= 1 && num <= 6) {
            const ico = document.getElementById('dice-icon');
            ico.className = `fa-solid fa-${caras[num]}`;
            setTimeout(()=>ico.classList.remove('dice-anim'), 500);
        }
    }
};

