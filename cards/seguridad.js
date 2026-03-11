export const SeguridadCard = {
    id: "Seguridad",
    defaultSize: "1x1",
    html: `
        <style>
            #sec-wrapper { display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; height: 100%; width: 100%; box-sizing: border-box; padding: 10px; }
            #icon-Seguridad { font-size: clamp(2rem, 30cqmin, 6rem); margin-top: 5px; transition: color 0.3s; color: #32d74b; }
            #val-Seguridad { font-size: clamp(0.9rem, 15cqmin, 2.5rem); font-weight: 800; margin: 5px 0; transition: color 0.3s; color: var(--text-main); }
            #btn-panic { width: 100%; padding: clamp(6px, 6cqmin, 20px); font-size: clamp(0.7rem, 8cqmin, 1.5rem); background: #ff453a; border-radius: clamp(8px, 4cqmin, 16px); margin:0; border:none; color:white; cursor:pointer;}
            
            @container (aspect-ratio > 1.2) {
                #sec-wrapper { flex-direction: row; justify-content: space-around; }
                #icon-Seguridad { font-size: clamp(2.5rem, 50cqh, 8rem); width: 40%; text-align: center; }
                .sec-controls { width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 10px; }
            }
        </style>
        
        <div id="sec-wrapper">
            <i class="fa-solid fa-shield-halved icon" id="icon-Seguridad"></i>
            <div class="sec-controls" style="width:100%; text-align:center;">
                <div class="val-text" id="val-Seguridad">Seguro</div>
                <button id="btn-panic">PÁNICO</button>
            </div>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('btn-panic').onclick = () => core.cmd('Seguridad', 'ALERTA_INTRUSO');
    },
    onData: (val) => {
        const txt = document.getElementById('val-Seguridad');
        const ico = document.getElementById('icon-Seguridad');
        if(val.bloqueado || val === "ALERTA_INTRUSO") { 
            txt.innerText="ALERTA"; txt.style.color="#ff453a"; ico.style.color="#ff453a"; 
        } else { 
            txt.innerText="Seguro"; txt.style.color="var(--text-main)"; ico.style.color="#32d74b"; 
        }
    },
    abrirAjustes: (core) => {
        if(confirm("¿Desarmar sistema de seguridad y limpiar alertas?")) {
            core.cmd('Seguridad', 'DISARM');
            const txt = document.getElementById('val-Seguridad');
            const ico = document.getElementById('icon-Seguridad');
            txt.innerText="Seguro"; txt.style.color="var(--text-main)"; ico.style.color="#32d74b";
        }
    }
};
