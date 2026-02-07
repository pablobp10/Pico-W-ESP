export const NotasCard = {
    id: "Notas",
    size: "wide", // RESTAURADO: Ocupa 2 huecos
    html: `
        <div style="display:flex; flex-direction:column; height:100%; width:100%">
            <div class="label" style="text-align:left; margin-bottom:5px">
                <i class="fa-solid fa-note-sticky" style="color:#eab308"></i> NOTAS
            </div>
            <textarea id="nota-compartida" placeholder="Escribe algo..." style="flex-grow:1"></textarea>
        </div>
    `,
    onInit: (core) => {
        document.getElementById('nota-compartida').onchange = (e) => core.pub('Notas', e.target.value, true);
    },
    onData: (val) => {
        document.getElementById('nota-compartida').value = val;
    }
};
