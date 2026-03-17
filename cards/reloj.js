export const RelojCard = {
    id: "Reloj",
    category: "info",
    rol: "guest",
    defaultSize: "2x1",
    html: `
        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; width:100%; text-align:center;">
            <div id="reloj-hora" style="font-size:clamp(2.5rem, 50cqmin, 4rem); font-weight:900; color:var(--text-main); line-height:1; letter-spacing:2px; font-variant-numeric:tabular-nums;">00:00</div>
            <div id="reloj-fecha" style="font-size:clamp(0.8rem, 15cqmin, 1rem); color:var(--primary); font-weight:bold; margin-top:5px; text-transform:uppercase;">Cargando...</div>
        </div>
    `,
    onInit: (core) => {
        const actualizarReloj = () => {
            const horaEl = document.getElementById('reloj-hora');
            const fechaEl = document.getElementById('reloj-fecha');
            if(!horaEl) return;
            
            const ahora = new Date();
            horaEl.innerText = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            fechaEl.innerText = ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        };
        
        actualizarReloj();
        setInterval(actualizarReloj, 1000);
    }
};
