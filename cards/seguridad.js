export const SeguridadCard = {
    id: "Seguridad",
    defaultSize: "1x1",
    html: `
        <style>
            #sec-wrapper { display: flex; flex-direction: column; justify-content: space-evenly; align-items: center; height: 100%; width: 100%; box-sizing: border-box; padding: 5px; } /* Padding reducido */
            #icon-Seguridad { font-size: clamp(1.2rem, 18cqmin, 3.5rem); margin-top: 0; transition: color 0.3s; color: #32d74b; } /* Escudo mucho más pequeño */
            #val-Seguridad { font-size: clamp(0.8rem, 12cqmin, 1.8rem); font-weight: 800; margin: 2px 0; transition: color 0.3s; color: var(--text-main); }
            #btn-panic { width: 100%; padding: clamp(6px, 4cqmin, 14px); font-size: clamp(0.6rem, 7cqmin, 1.1rem); background: #ff453a; border-radius: clamp(6px, 3cqmin, 12px); margin:0; border:none; color:white; cursor:pointer;}
            
            @container (aspect-ratio > 1.2) {
                #sec-wrapper { flex-direction: row; justify-content: space-around; padding: 10px; }
                #icon-Seguridad { font-size: clamp(2rem, 40cqh, 6rem); width: 40%; text-align: center; }
                .sec-controls { width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; }
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
