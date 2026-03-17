export const PlantaCard = {
    id: "Planta",
    category: "sensores",
    rol: "guest",
    defaultSize: "1x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%;">
            <i class="fa-solid fa-leaf" id="planta-icon" style="font-size:2rem; color:#32d74b; margin-bottom:5px;"></i>
            <span id="planta-humedad" class="val-text" style="font-size:1.5rem; font-weight:bold; color:var(--text-main);">--%</span>
            <button id="planta-regar" class="btn-action" style="margin-top:8px; background:rgba(10, 132, 255, 0.15); color:#0a84ff; border:1px solid #0a84ff; border-radius:8px; padding:5px 10px; font-size:0.75rem; cursor:pointer; font-weight:bold;">REGAR</button>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('planta-regar').onclick = () => {
            core.vibra("doble");
            core.cmd('Planta', 'regar');
            document.getElementById('planta-regar').innerText = "REGANDO...";
            setTimeout(() => document.getElementById('planta-regar').innerText = "REGAR", 2000);
        };
    },
    onData: (val) => {
        if(val && val.humedad_tierra !== undefined) {
            document.getElementById('planta-humedad').innerText = val.humedad_tierra + "%";
            const icon = document.getElementById('planta-icon');
            if (val.humedad_tierra < 30) { icon.style.color = "#ff453a"; icon.classList.add("fa-beat"); }
            else { icon.style.color = "#32d74b"; icon.classList.remove("fa-beat"); }
        }
    }
};
