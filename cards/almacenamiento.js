export const AlmaCard = {
    id: "Almacenamiento",
    category: "sistema",
    rol: "admin",
    defaultSize: "2x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:flex-start; height:100%; width:100%; padding:5px;">
            <div style="display:flex; align-items:center; gap:10px; width:100%;">
                <i class="fa-solid fa-microchip" style="font-size:1.8rem; color:#0a84ff;"></i>
                <div style="display:flex; flex-direction:column; flex-grow:1;">
                    <span style="font-size:0.8rem; font-weight:bold; color:var(--text-sec);">MEMORIA FLASH</span>
                    <span id="alma-txt" style="font-size:1.1rem; font-weight:900; color:var(--text-main); font-variant-numeric:tabular-nums;">-- KB Libres</span>
                </div>
            </div>
            
            <div style="width:100%; background:rgba(0,0,0,0.3); height:10px; border-radius:5px; margin-top:15px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
                <div id="alma-bar" style="width:0%; height:100%; background:#32d74b; transition:width 0.5s ease, background 0.5s ease;"></div>
            </div>
        </div>
    `,
    onData: (val) => {
        // Esperamos un payload de la Pico como: {"libre_kb": 1250, "total_kb": 2048}
        if(!val || val.libre_kb === undefined || val.total_kb === undefined) return;
        
        const libre = val.libre_kb;
        const total = val.total_kb;
        const usado = total - libre;
        const porcentaje = Math.round((usado / total) * 100);
        
        document.getElementById('alma-txt').innerText = `${libre} KB Libres`;
        
        const bar = document.getElementById('alma-bar');
        bar.style.width = `${porcentaje}%`;
        
        // Colores de advertencia si la flash se está llenando
        if(porcentaje > 90) bar.style.background = "#ff453a";
        else if(porcentaje > 75) bar.style.background = "#ff9f0a";
        else bar.style.background = "#32d74b";
    }
};
