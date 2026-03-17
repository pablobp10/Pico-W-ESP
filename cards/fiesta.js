export const FiestaCard = {
    id: "Fiesta",
    category: "sistema",
    rol: "guest",
    defaultSize: "1x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%; cursor:pointer;" id="fiesta-btn-area">
            <i class="fa-solid fa-champagne-glasses icon" id="fiesta-icon" style="font-size:2.8rem; color:var(--text-sec); transition: 0.3s;"></i>
            <span id="val-Fiesta" class="val-text" style="margin-top:10px; font-size:1rem; font-weight:bold; letter-spacing:1px;">MODO FIESTA</span>
        </div>
    `,
    onInit: (core) => {
        let activo = false;
        const area = document.getElementById('fiesta-btn-area');
        const icon = document.getElementById('fiesta-icon');
        const text = document.getElementById('val-Fiesta');

        area.onclick = () => {
            activo = !activo;
            core.vibra(activo ? "doble" : "tick");
            core.cmd('Fiesta', activo ? 'on' : 'off');
            
            if (activo) {
                icon.style.color = "#ff453a";
                icon.classList.add("fa-shake");
                text.style.color = "#ff453a";
            } else {
                icon.style.color = "var(--text-sec)";
                icon.classList.remove("fa-shake");
                text.style.color = "var(--text-main)";
            }
        };
    },
    onData: (val) => {
        // Por si la Pico W confirma el estado de la fiesta
        const activo = (val === 'on' || val.estado === 'on');
        const icon = document.getElementById('fiesta-icon');
        const text = document.getElementById('val-Fiesta');
        
        if (activo) {
            icon.style.color = "#ff453a";
            icon.classList.add("fa-shake");
            text.style.color = "#ff453a";
        } else {
            icon.style.color = "var(--text-sec)";
            icon.classList.remove("fa-shake");
            text.style.color = "var(--text-main)";
        }
    }
};
