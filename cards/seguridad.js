export const SeguridadCard = {
    id: "Seguridad",
    html: `
        <i class="fa-solid fa-shield-halved icon" id="icon-Seguridad" style="font-size:2.5rem; margin-top:5px"></i>
        <div class="val-text" id="val-Seguridad" style="font-size:1rem; margin:5px 0">Seguro</div>
        <button class="btn-action" style="background:#ff453a; font-size:0.75rem; padding:8px" id="btn-panic">PÁNICO</button>
    `,
    onInit: (core) => {
        document.getElementById('btn-panic').onclick = () => core.cmd('Seguridad', 'ALERTA_INTRUSO');
    },
    onData: (val) => {
        const txt = document.getElementById('val-Seguridad');
        const ico = document.getElementById('icon-Seguridad');
        if(val.bloqueado) { txt.innerText="ALERTA"; txt.style.color="#ff453a"; ico.style.color="#ff453a"; } 
        else { txt.innerText="Seguro"; txt.style.color="var(--text-main)"; ico.style.color="#32d74b"; }
    }
};
