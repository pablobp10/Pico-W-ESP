export const AlmaCard = {
    id: "Almacenamiento", // Debe coincidir con el nombre de la App en Python
    html: `
        <div class="app-card" style="height:100%; display:flex; flex-direction:column; justify-content:center">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                <h3 style="margin:0"><i class="fa-solid fa-hard-drive"></i> Disco</h3>
                <span id="alma-percent" style="font-weight:bold; color:var(--text-sec)">--%</span>
            </div>
            
            <div style="background:var(--border); height:12px; border-radius:6px; overflow:hidden; width:100%">
                <div id="alma-bar" style="width:0%; background:#28a745; height:100%; transition: width 0.5s"></div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:var(--text-sec); margin-top:8px">
                <span id="alma-used">Usado: --</span>
                <span id="alma-free">Libre: --</span>
            </div>
            
            <button class="btn-action" id="btn-alma-update" style="margin-top:15px; padding:8px; font-size:0.8rem">
                ACTUALIZAR
            </button>
        </div>
    `,
    onInit: (core) => {
        // Al iniciar, pedimos datos frescos
        document.getElementById('btn-alma-update').onclick = () => {
            core.cmd('Almacenamiento', 'get');
        };
        // Pedimos datos iniciales
        setTimeout(() => core.cmd('Almacenamiento', 'get'), 1000);
    },
    onData: (val) => {
        // Val es el objeto JSON: {total_bytes, usado_bytes, porcentaje...}
        if (typeof val !== 'object') return; // Protección

        const p = val.porcentaje || 0;
        const bar = document.getElementById('alma-bar');
        const txtPercent = document.getElementById('alma-percent');
        
        // Actualizar Barra
        bar.style.width = p + "%";
        txtPercent.innerText = p.toFixed(1) + "%";
        
        // Cambiar color según ocupación
        if(p > 80) bar.style.background = "#dc3545"; // Rojo
        else if(p > 60) bar.style.background = "#ffc107"; // Amarillo
        else bar.style.background = "#28a745"; // Verde

        // Formatear Bytes a MB/KB
        const fmt = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        document.getElementById('alma-used').innerText = "Usado: " + fmt(val.usado_bytes);
        document.getElementById('alma-free').innerText = "Libre: " + fmt(val.libre_bytes);
    }
};

