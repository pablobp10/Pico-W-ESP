export const AlmaCard = {
    id: "Almacenamiento",
    defaultSize: "1x1",
    html: `
        <style>
            #alma-wrapper { display: flex; flex-direction: column; justify-content: space-evenly; height: 100%; width: 100%; box-sizing: border-box; padding: 5cqmin; }
            .alma-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2cqmin; }
            .alma-title { margin: 0; font-size: clamp(0.8rem, 12cqmin, 2rem); }
            #alma-percent { font-size: clamp(1rem, 15cqmin, 3rem); font-weight: bold; color: var(--text-sec); }
            .alma-bar-bg { background: var(--border); height: clamp(8px, 6cqmin, 24px); border-radius: 12px; overflow: hidden; width: 100%; }
            #alma-bar { width: 0%; background: #28a745; height: 100%; transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
            .alma-details { display: flex; justify-content: space-between; font-size: clamp(0.7rem, 8cqmin, 1.2rem); color: var(--text-sec); margin-top: 3cqmin; }
            #btn-alma-update { margin-top: 4cqmin; padding: clamp(6px, 4cqmin, 16px); font-size: clamp(0.7rem, 8cqmin, 1.2rem); border-radius: clamp(8px, 3cqmin, 16px); }
            
            @container (aspect-ratio > 1.5) {
                #alma-wrapper { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: space-between; }
                .alma-header { width: 100%; }
                .alma-bar-bg { width: 65%; margin: 0; }
                .alma-details { width: 30%; flex-direction: column; align-items: flex-end; margin: 0; gap: 5px; }
                #btn-alma-update { width: 100%; margin-top: 10px; }
            }
        </style>
        
        <div id="alma-wrapper">
            <div class="alma-header">
                <h3 class="alma-title"><i class="fa-solid fa-hard-drive"></i> Disco</h3>
                <span id="alma-percent">--%</span>
            </div>
            <div class="alma-bar-bg"><div id="alma-bar"></div></div>
            <div class="alma-details">
                <span id="alma-used">Usado: --</span>
                <span id="alma-free">Libre: --</span>
            </div>
            <button class="btn-action" id="btn-alma-update">ACTUALIZAR</button>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('btn-alma-update').onclick = () => core.cmd('Almacenamiento', 'get');
        setTimeout(() => core.cmd('Almacenamiento', 'get'), 1000);
    },
    onData: (val) => {
        if (typeof val !== 'object') return;
        const p = val.porcentaje || 0;
        const bar = document.getElementById('alma-bar');
        const txtPercent = document.getElementById('alma-percent');
        
        bar.style.width = p + "%";
        txtPercent.innerText = p.toFixed(1) + "%";
        
        const limit = parseInt(localStorage.getItem('pico_alma_limit')) || 80;
        if(p > limit) bar.style.background = "#dc3545";
        else if(p > limit - 20) bar.style.background = "#ffc107";
        else bar.style.background = "#28a745";

        const fmt = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        document.getElementById('alma-used').innerText = "Usado: " + fmt(val.usado_bytes);
        document.getElementById('alma-free').innerText = "Libre: " + fmt(val.libre_bytes);
    },
    abrirAjustes: (core) => {
        let current = localStorage.getItem('pico_alma_limit') || "80";
        let limit = prompt("Límite de alerta roja en porcentaje (ej: 80):", current);
        if (limit && !isNaN(limit)) {
            localStorage.setItem('pico_alma_limit', limit);
            core.notificar(`Alerta configurada al ${limit}%`, "⚙️");
        }
    }
};
