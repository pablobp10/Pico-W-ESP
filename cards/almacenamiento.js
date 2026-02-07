 export const AlmaCard = {
    id: "Almacenamiento",
    adminOnly: true,
    html: `
        <i class="fa-solid fa-hard-drive icon"></i>
        <div class="val-text" id="val-Alma" style="font-size:1rem">--</div>
        <div class="label" style="margin-top:10px">Disco Sistema</div>
        <button class="btn-action" style="background:#64748b; font-size:0.8rem; padding:5px" id="btn-refresh">🔄 Refrescar</button>
    `,
    onInit: (core) => {
        document.getElementById('btn-refresh').onclick = () => core.cmd('Almacenamiento', 'load');
    },
    onData: (val) => {
        document.getElementById('val-Alma').innerText = val.t || val.msg || val;
    }
};

