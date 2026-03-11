export const NotasCard = {
    id: "Notas",
    defaultSize: "1x2",
    html: `
        <style>
            #notas-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; padding: 4cqmin; }
            .notas-label { font-size: clamp(0.7rem, 6cqmin, 1.2rem); font-weight: 700; color: var(--text-sec); margin-bottom: 2cqmin; text-align: left; }
            #nota-compartida { flex-grow: 1; width: 100%; border: 1px solid var(--border); border-radius: 12px; padding: 10px; background: var(--bg); color: var(--text-main); font-family: inherit; font-size: clamp(0.9rem, 5cqmin, 1.5rem); resize: none; outline: none; box-sizing: border-box; }
            #nota-compartida:focus { border-color: #eab308; }
        </style>
        
        <div id="notas-wrapper">
            <div class="notas-label"><i class="fa-solid fa-note-sticky" style="color:#eab308"></i> NOTAS (Sincronizadas)</div>
            <textarea id="nota-compartida" placeholder="Escribe algo para todos..."></textarea>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('nota-compartida').onchange = (e) => core.pub('Notas', e.target.value, true);
    },
    onData: (val) => {
        const txt = document.getElementById('nota-compartida');
        // Evitamos sobrescribir si el usuario está escribiendo justo ahora
        if (document.activeElement !== txt) txt.value = val;
    },
    abrirAjustes: (core) => {
        if(confirm("¿Borrar todo el texto?")) {
            document.getElementById('nota-compartida').value = "";
            core.pub('Notas', "", true);
        }
    }
};
