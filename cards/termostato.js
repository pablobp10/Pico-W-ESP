export const TermostatoCard = {
    id: "Termostato",
    category: "sensores",
    rol: "guest",
    defaultSize: "2x2",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%;">
            <span style="font-size:0.8rem; color:var(--text-sec); font-weight:bold; letter-spacing:1px; margin-bottom:5px;">CLIMATIZADOR</span>
            
            <div style="display:flex; align-items:center; gap:15px;">
                <button id="term-down" class="btn-action" style="background:var(--card-bg); border:2px solid #0a84ff; color:#0a84ff; width:45px; height:45px; border-radius:50%; font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-minus"></i></button>
                
                <div style="display:flex; flex-direction:column; align-items:center; min-width:80px;">
                    <span id="term-target" class="val-text" style="font-size:2.8rem; font-weight:900; color:var(--text-main); line-height:1;">22°</span>
                    <span id="term-status" style="font-size:0.7rem; color:#32d74b; font-weight:bold; text-transform:uppercase;">MANTENIENDO</span>
                </div>
                
                <button id="term-up" class="btn-action" style="background:var(--card-bg); border:2px solid #ff453a; color:#ff453a; width:45px; height:45px; border-radius:50%; font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-plus"></i></button>
            </div>
            <div style="display:flex; gap:15px; margin-top:15px;">
                 <span style="font-size:0.8rem; color:var(--text-sec);"><i class="fa-solid fa-house"></i> <span id="term-current">--</span>°C</span>
            </div>
        </div>
    `,
    onInit: (core) => {
        let target = 22;
        const display = document.getElementById('term-target');
        const status = document.getElementById('term-status');
        
        let timer;
        const actualizar = (cambio) => {
            target += cambio;
            if(target < 16) target = 16;
            if(target > 30) target = 30;
            display.innerText = target + "°";
            status.innerText = "ENVIANDO...";
            status.style.color = "#ff9f0a";
            core.vibra("tick");
            
            clearTimeout(timer);
            timer = setTimeout(() => {
                core.cmd('Termostato', target);
            }, 600); // Debounce: Espera a que termines de pulsar antes de mandar la orden
        };

        document.getElementById('term-up').onclick = () => actualizar(1);
        document.getElementById('term-down').onclick = () => actualizar(-1);
    },
    onData: (val) => {
        if(!val) return;
        if(val.actual) document.getElementById('term-current').innerText = val.actual;
        if(val.objetivo) document.getElementById('term-target').innerText = val.objetivo + "°";
        
        const status = document.getElementById('term-status');
        if(val.estado === 'calentando') { status.innerText = "CALENTANDO"; status.style.color = "#ff453a"; }
        else if(val.estado === 'enfriando') { status.innerText = "ENFRIANDO"; status.style.color = "#0a84ff"; }
        else { status.innerText = "MANTENIENDO"; status.style.color = "#32d74b"; }
    }
};
