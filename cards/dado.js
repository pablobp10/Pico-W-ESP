export const DadoCard = {
    id: "Dado",
    category: "herramientas",
    rol: "guest",
    defaultSize: "1x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%; cursor:pointer;" id="dado-btn-area">
            <i class="fa-solid fa-dice icon" id="dado-icon" style="font-size:3rem; color:#bf5af2; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></i>
            <span id="val-Dado" class="val-text" style="margin-top:10px; font-size:1.5rem; font-weight:bold; color:var(--text-main);">--</span>
        </div>
    `,
    onInit: (core) => {
        const area = document.getElementById('dado-btn-area');
        const icon = document.getElementById('dado-icon');
        
        area.onclick = () => {
            core.vibra("tick");
            icon.style.transform = `rotate(${Math.random() * 360}deg) scale(0.8)`;
            
            setTimeout(() => {
                const resultado = Math.floor(Math.random() * 6) + 1;
                document.getElementById('val-Dado').innerText = resultado;
                icon.style.transform = `rotate(0deg) scale(1)`;
                core.vibra("doble");
                core.pub('Dado', resultado, true); // Publicación en bus interno
            }, 300);
        };
    },
    onData: (val) => {
        if(typeof val === 'number') {
            document.getElementById('val-Dado').innerText = val;
        }
    }
};
